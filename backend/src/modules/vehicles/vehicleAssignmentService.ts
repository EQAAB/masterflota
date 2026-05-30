import type { PoolClient } from "pg";
import { pool } from "../../db/pool";
import {
  closeOpenAssignmentsForVehicle,
  closeOpenVehicleAssignment,
  recordVehicleAssignment,
} from "./vehicleAssignmentHistory";
import { driverDisplayName, insertVehicleHistory } from "./vehicleHistory";

export type AssignVehicleParams = {
  orgId: string;
  driverId: string;
  vehicleId: string;
  assignedBy?: string | null;
  notes?: string | null;
};

export type UnassignParams = {
  orgId: string;
  driverId?: string;
  vehicleId?: string;
  unassignedBy?: string | null;
  notes?: string | null;
};

async function clearVehicleDriverLink(
  client: PoolClient,
  vehicleId: string,
  orgId: string,
): Promise<void> {
  await client.query(
    `UPDATE vehicles
     SET current_driver_id = NULL,
         status = CASE WHEN status = 'rented' THEN 'available' ELSE status END,
         updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [vehicleId, orgId],
  );
}

async function clearDriverVehicleLink(
  client: PoolClient,
  driverId: string,
  orgId: string,
): Promise<void> {
  await client.query(
    `UPDATE drivers
     SET current_vehicle_id = NULL, updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [driverId, orgId],
  );
}

export async function assignVehicleToDriver(
  client: PoolClient,
  params: AssignVehicleParams,
): Promise<void> {
  const { orgId, driverId, vehicleId, assignedBy, notes } = params;

  const { rows: driverRows } = await client.query<{ id: string; current_vehicle_id: string | null }>(
    `SELECT id::text, current_vehicle_id::text
     FROM drivers
     WHERE id = $1::uuid AND organization_id = $2::uuid
       AND (is_deleted = false OR is_deleted IS NULL)`,
    [driverId, orgId],
  );
  if (!driverRows[0]) {
    throw new Error("Driver not found");
  }

  const { rows: vehicleRows } = await client.query<{
    id: string;
    current_driver_id: string | null;
    weekly_rent: string | null;
    license_plate: string | null;
  }>(
    `SELECT id::text, current_driver_id::text, weekly_rent::text, license_plate
     FROM vehicles
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [vehicleId, orgId],
  );
  if (!vehicleRows[0]) {
    throw new Error("Vehicle not found");
  }

  const priorVehicleId = driverRows[0].current_vehicle_id;
  const priorDriverOnVehicle = vehicleRows[0].current_driver_id;

  if (priorDriverOnVehicle && priorDriverOnVehicle !== driverId) {
    await closeOpenVehicleAssignment(client, {
      driverId: priorDriverOnVehicle,
      unassignedBy: assignedBy,
      notes: notes ?? "Vehicle reassigned to another driver",
    });
    await clearDriverVehicleLink(client, priorDriverOnVehicle, orgId);
  }

  await closeOpenAssignmentsForVehicle(client, {
    vehicleId,
    orgId,
    unassignedBy: assignedBy,
    notes: notes ?? "Vehicle assigned to another driver",
  });

  if (priorVehicleId && priorVehicleId !== vehicleId) {
    await closeOpenVehicleAssignment(client, {
      driverId,
      unassignedBy: assignedBy,
      notes: "Driver reassigned to another vehicle",
    });
    await clearVehicleDriverLink(client, priorVehicleId, orgId);
  }

  await client.query(
    `UPDATE drivers SET current_vehicle_id = $1::uuid, updated_at = NOW()
     WHERE id = $2::uuid AND organization_id = $3::uuid`,
    [vehicleId, driverId, orgId],
  );

  await client.query(
    `UPDATE vehicles SET current_driver_id = $1::uuid, status = 'rented', updated_at = NOW()
     WHERE id = $2::uuid AND organization_id = $3::uuid`,
    [driverId, vehicleId, orgId],
  );

  await recordVehicleAssignment(client, {
    driverId,
    vehicleId,
    orgId,
    assignedBy,
    notes: notes ?? null,
  });

  const driverName = await driverDisplayName(client, driverId);
  const weeklyRent = Number(vehicleRows[0].weekly_rent ?? 0) || 0;
  await insertVehicleHistory(client, {
    orgId,
    vehicleId,
    eventType: "assigned",
    driverId,
    previousDriverId: priorDriverOnVehicle !== driverId ? priorDriverOnVehicle : null,
    newRent: weeklyRent,
    title: "Vehicle assigned",
    description: driverName
      ? `Assigned to ${driverName}${vehicleRows[0].license_plate ? ` (${vehicleRows[0].license_plate})` : ""}`
      : "Driver assigned to vehicle",
    metadata: { weekly_rent: weeklyRent },
    createdBy: assignedBy ?? null,
  });
}

export async function unassignVehicle(
  client: PoolClient,
  params: UnassignParams,
): Promise<void> {
  const { orgId, driverId, vehicleId, unassignedBy, notes } = params;
  if (!driverId && !vehicleId) {
    throw new Error("driverId or vehicleId is required");
  }

  let resolvedDriverId = driverId;
  let resolvedVehicleId = vehicleId;

  if (vehicleId && !driverId) {
    const { rows } = await client.query<{ current_driver_id: string | null }>(
      `SELECT current_driver_id::text FROM vehicles WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [vehicleId, orgId],
    );
    if (!rows[0]) throw new Error("Vehicle not found");
    resolvedDriverId = rows[0].current_driver_id ?? undefined;
    resolvedVehicleId = vehicleId;
  } else if (driverId && !vehicleId) {
    const { rows } = await client.query<{ current_vehicle_id: string | null }>(
      `SELECT current_vehicle_id::text FROM drivers WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [driverId, orgId],
    );
    if (!rows[0]) throw new Error("Driver not found");
    resolvedVehicleId = rows[0].current_vehicle_id ?? undefined;
    resolvedDriverId = driverId;
  }

  if (!resolvedDriverId && !resolvedVehicleId) {
    return;
  }

  let vehiclePlate: string | null = null;
  if (resolvedVehicleId) {
    const { rows: vrows } = await client.query<{ license_plate: string | null; status: string }>(
      `SELECT license_plate, status FROM vehicles WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [resolvedVehicleId, orgId],
    );
    vehiclePlate = vrows[0]?.license_plate ?? null;
  }

  if (resolvedDriverId) {
    await closeOpenVehicleAssignment(client, {
      driverId: resolvedDriverId,
      unassignedBy,
      notes: notes ?? "Unassigned",
    });
    await clearDriverVehicleLink(client, resolvedDriverId, orgId);
  }

  if (resolvedVehicleId) {
    await closeOpenAssignmentsForVehicle(client, {
      vehicleId: resolvedVehicleId,
      orgId,
      unassignedBy,
      notes: notes ?? "Unassigned",
    });
    await clearVehicleDriverLink(client, resolvedVehicleId, orgId);
  }

  if (resolvedVehicleId && resolvedDriverId) {
    const driverName = await driverDisplayName(client, resolvedDriverId);
    await insertVehicleHistory(client, {
      orgId,
      vehicleId: resolvedVehicleId,
      eventType: "unassigned",
      driverId: null,
      previousDriverId: resolvedDriverId,
      title: "Vehicle unassigned",
      description: driverName
        ? `${driverName} removed from vehicle${vehiclePlate ? ` ${vehiclePlate}` : ""}`
        : "Driver removed from vehicle",
      createdBy: unassignedBy ?? null,
    });
  }
}

export async function runAssignVehicleTransaction(params: AssignVehicleParams): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await assignVehicleToDriver(client, params);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function runUnassignVehicleTransaction(params: UnassignParams): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await unassignVehicle(client, params);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
