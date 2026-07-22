import { Router } from "express";
import { authenticateJWT, requirePermission } from "../../middleware/auth";
import { attachOrgContext, requireOrgId } from "../../middleware/orgContext";
import { query } from "../../db/pool";
import { handleVehicleDriverHistory } from "./vehicleAssignmentHistoryHandlers";
import {
  runAssignVehicleTransaction,
  runUnassignVehicleTransaction,
} from "./vehicleAssignmentService";
import { insertVehicleHistoryQuery, listVehicleHistory } from "./vehicleHistory";
import {
  assertVehicleHasNoRentalBookings,
  VehicleDeleteBlockedError,
} from "./vehicleDeleteGuards";
import { parseListSort, type ListSortQuery } from "../../lib/listSort";

const router = Router();

const VEHICLE_LIST_SORT_FIELDS: Record<string, string | readonly string[]> = {
  plate_number: "v.license_plate",
  model: ["v.model", "v.make"],
  status: "v.status",
  weekly_rent: "v.weekly_rent",
  current_driver_id: [
    "(v.current_driver_id IS NOT NULL)",
    "d.last_name",
    "d.first_name",
  ],
  created_at: "v.created_at",
};

function resolveVehicleListOrder(query: ListSortQuery) {
  return parseListSort(query, VEHICLE_LIST_SORT_FIELDS, ["v.created_at"], "desc", "v.id ASC");
}

router.use(authenticateJWT);
router.use(attachOrgContext);
router.use(requirePermission("vehicles.view"));

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function appendVehicleSearchCondition(conditions: string[], params: unknown[], rawSearch: string) {
  const term = rawSearch.trim();
  if (!term) return;
  params.push(`%${term}%`);
  const idx = params.length;
  conditions.push(`(
    LOWER(v.license_plate) LIKE LOWER($${idx})
    OR LOWER(COALESCE(v.vin, '')) LIKE LOWER($${idx})
    OR LOWER(v.make) LIKE LOWER($${idx})
    OR LOWER(v.model) LIKE LOWER($${idx})
    OR LOWER(CONCAT(v.make, ' ', v.model)) LIKE LOWER($${idx})
    OR LOWER(COALESCE(v.vehicle_type, '')) LIKE LOWER($${idx})
    OR LOWER(v.status) LIKE LOWER($${idx})
    OR LOWER(COALESCE(v.current_driver_id::text, '')) LIKE LOWER($${idx})
    OR LOWER(CONCAT(COALESCE(d.first_name, ''), ' ', COALESCE(d.last_name, ''))) LIKE LOWER($${idx})
    OR LOWER(COALESCE(d.first_name, '')) LIKE LOWER($${idx})
    OR LOWER(COALESCE(d.last_name, '')) LIKE LOWER($${idx})
    OR LOWER(COALESCE(d.phone, '')) LIKE LOWER($${idx})
  )`);
}

const VEHICLE_LIST_FROM = `
      FROM vehicles v
      LEFT JOIN drivers d ON v.current_driver_id = d.id
      LEFT JOIN subcontractors sc ON d.subcontractor_id = sc.id
`;

const VEHICLE_LIST_SELECT = `
      SELECT v.id, v.organization_id, v.vehicle_type, v.make, v.model, v.year, v.color,
             v.license_plate, v.vin, v.fuel_type, v.transmission, v.seating_capacity,
             v.daily_rent, v.weekly_rent, v.monthly_rent, v.insurance_expiry, v.registration_expiry,
             v.status, v.current_driver_id, v.notes, v.created_at, v.updated_at,
             d.first_name AS driver_first_name, d.last_name AS driver_last_name, d.phone AS driver_phone,
             d.profile_photo_url AS driver_profile_photo_url,
             d.bolt_driver_id AS driver_bolt_driver_id,
             d.glovo_courier_id AS driver_glovo_courier_id,
             d.uber_driver_id AS driver_uber_driver_id,
             d.wolt_courier_id AS driver_wolt_courier_id,
             d.bolt_courier_id AS driver_bolt_courier_id,
             d.subcontractor_id AS driver_subcontractor_id,
             sc.legal_name AS driver_subcontractor_name
      ${VEHICLE_LIST_FROM}
`;

function appendVehiclePlatformFilter(conditions: string[], platform: string) {
  const p = platform.trim().toLowerCase();
  if (!p || p === "all") return;
  if (p === "bolt") {
    conditions.push(
      `(NULLIF(TRIM(COALESCE(d.bolt_driver_id, '')), '') IS NOT NULL OR NULLIF(TRIM(COALESCE(d.bolt_courier_id, '')), '') IS NOT NULL)`,
    );
    return;
  }
  if (p === "glovo") {
    conditions.push(`NULLIF(TRIM(COALESCE(d.glovo_courier_id, '')), '') IS NOT NULL`);
    return;
  }
  if (p === "bolt_glovo") {
    conditions.push(
      `(NULLIF(TRIM(COALESCE(d.bolt_driver_id, '')), '') IS NOT NULL OR NULLIF(TRIM(COALESCE(d.bolt_courier_id, '')), '') IS NOT NULL)`,
    );
    conditions.push(`NULLIF(TRIM(COALESCE(d.glovo_courier_id, '')), '') IS NOT NULL`);
    return;
  }
  if (p === "uber") {
    conditions.push(`NULLIF(TRIM(COALESCE(d.uber_driver_id, '')), '') IS NOT NULL`);
    return;
  }
  if (p === "wolt") {
    conditions.push(`NULLIF(TRIM(COALESCE(d.wolt_courier_id, '')), '') IS NOT NULL`);
  }
}

router.get("/", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { search, status, limit, offset, page, sort_by, sort_order, subcontractor_id, platform } =
    req.query as {
      search?: string;
      status?: string;
      limit?: string;
      offset?: string;
      page?: string;
      sort_by?: string;
      sort_order?: string;
      subcontractor_id?: string;
      platform?: string;
    };

  const sortResult = resolveVehicleListOrder({ sort_by, sort_order });
  if (!sortResult.ok) {
    return res.status(sortResult.status).json({ message: sortResult.message });
  }

  const filterParams: unknown[] = [orgId];
  const conditions = ["v.organization_id = $1"];

  if (status) {
    filterParams.push(status);
    conditions.push(`v.status = $${filterParams.length}`);
  }
  if (search) {
    appendVehicleSearchCondition(conditions, filterParams, search);
  }
  if (subcontractor_id && subcontractor_id !== "all" && UUID_RE.test(subcontractor_id)) {
    filterParams.push(subcontractor_id);
    conditions.push(`d.subcontractor_id = $${filterParams.length}`);
  }
  if (platform) {
    appendVehiclePlatformFilter(conditions, platform);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitNum = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 10_000) : 25;
  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : undefined;
  const offsetNum =
    pageNum !== undefined
      ? (pageNum - 1) * limitNum
      : offset
        ? Math.max(0, parseInt(offset, 10))
        : 0;
  const resolvedPage = pageNum ?? Math.floor(offsetNum / limitNum) + 1;

  const listParams = [...filterParams, limitNum, offsetNum];
  const limitIdx = listParams.length - 1;
  const offsetIdx = listParams.length;

  try {
    const [{ rows }, countResult] = await Promise.all([
      query(
        `
        ${VEHICLE_LIST_SELECT}
        ${where}
        ${sortResult.orderByClause}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
        `,
        listParams,
      ),
      query(
        `
        SELECT COUNT(*)::int AS total
        ${VEHICLE_LIST_FROM}
        ${where}
        `,
        filterParams,
      ),
    ]);

    const total = countResult.rows[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    return res.json({
      data: rows,
      pagination: {
        page: resolvedPage,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error("List vehicles error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/search", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { q, status, limit, offset, sort_by, sort_order } = req.query as {
    q?: string;
    status?: string;
    limit?: string;
    offset?: string;
    sort_by?: string;
    sort_order?: string;
  };
  if (!q || !String(q).trim()) {
    return res.status(400).json({ message: "q is required" });
  }

  const sortResult = resolveVehicleListOrder({ sort_by, sort_order });
  if (!sortResult.ok) {
    return res.status(sortResult.status).json({ message: sortResult.message });
  }

  const params: unknown[] = [orgId];
  const conditions = ["v.organization_id = $1"];

  if (status) {
    params.push(status);
    conditions.push(`v.status = $${params.length}`);
  }
  appendVehicleSearchCondition(conditions, params, String(q));

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitNum = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 500) : 200;
  const offsetNum = offset ? Math.max(0, parseInt(offset, 10)) : 0;
  params.push(limitNum, offsetNum);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  try {
    const { rows } = await query(
      `
      ${VEHICLE_LIST_SELECT}
      ${where}
      ${sortResult.orderByClause}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params,
    );
    return res.json(rows);
  } catch (err) {
    console.error("Search vehicles error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/history", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const { id } = req.params;
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  if (!UUID_RE.test(String(id))) {
    return res.status(400).json({ message: "Invalid vehicle id" });
  }

  const q = req.query as {
    eventType?: string;
    startDate?: string;
    endDate?: string;
    driverId?: string;
  };

  try {
    const { rows: vehicleRows } = await query<{ id: string }>(
      "SELECT id FROM vehicles WHERE id = $1::uuid AND organization_id = $2::uuid LIMIT 1",
      [id, orgId],
    );
    if (!vehicleRows[0]) return res.status(404).json({ message: "Vehicle not found" });

    const rows = await listVehicleHistory(orgId, String(id), {
      eventType: q.eventType,
      startDate: q.startDate,
      endDate: q.endDate,
      driverId: q.driverId,
    });
    return res.json({ vehicleId: id, rows });
  } catch (err) {
    console.error("List vehicle history error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/incidents", requirePermission("vehicles.edit"), async (req, res) => {
  const orgId = req.effectiveOrgId;
  const { id: vehicleId } = req.params;
  const body = req.body as Record<string, unknown>;
  const { title, description, cost, odometerReading, driverId, eventDate } = body;

  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "title is required" });
  }

  try {
    const { rows: vehicleRows } = await query<{ id: string; current_driver_id: string | null }>(
      "SELECT id, current_driver_id::text FROM vehicles WHERE id = $1::uuid AND organization_id = $2::uuid LIMIT 1",
      [vehicleId, orgId],
    );
    if (!vehicleRows[0]) return res.status(404).json({ message: "Vehicle not found" });

    const resolvedDriverId =
      typeof driverId === "string" && UUID_RE.test(driverId)
        ? driverId
        : vehicleRows[0].current_driver_id;

    const historyId = await insertVehicleHistoryQuery({
      orgId,
      vehicleId: String(vehicleId),
      eventType: "incident",
      eventDate:
        typeof eventDate === "string" && !Number.isNaN(Date.parse(eventDate))
          ? new Date(eventDate)
          : undefined,
      driverId: resolvedDriverId,
      title: title.trim(),
      description: typeof description === "string" ? description : null,
      cost: cost != null ? Number(cost) : null,
      odometerReading: odometerReading != null ? Number(odometerReading) : null,
      createdBy: req.user?.sub ?? null,
    });

    return res.status(201).json({ id: historyId });
  } catch (err) {
    console.error("Create vehicle incident error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

const vehicleDriverHistory = [handleVehicleDriverHistory];
router.get("/:id/vehicle-assignment-history", ...vehicleDriverHistory);
router.get("/:id/driver-history", ...vehicleDriverHistory);

router.post("/:id/assign-driver", requirePermission("vehicles.assign"), async (req, res) => {
  const orgId = req.effectiveOrgId;
  const vehicleId = String(req.params.id);
  const body = req.body as { driverId?: string };
  const driverId = typeof body.driverId === "string" ? body.driverId.trim() : "";

  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  if (!UUID_RE.test(vehicleId) || !UUID_RE.test(driverId)) {
    return res.status(400).json({ message: "Invalid vehicle or driver id" });
  }

  try {
    await runAssignVehicleTransaction({
      orgId,
      driverId,
      vehicleId,
      assignedBy: req.user?.sub ?? null,
      notes: "Assigned via vehicle detail",
    });
    const { rows } = await query(
      `SELECT v.*, d.first_name AS driver_first_name, d.last_name AS driver_last_name
       FROM vehicles v
       LEFT JOIN drivers d ON v.current_driver_id = d.id
       WHERE v.id = $1 AND v.organization_id = $2`,
      [vehicleId, orgId],
    );
    if (!rows[0]) return res.status(404).json({ message: "Vehicle not found" });
    return res.json(rows[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Assign failed";
    if (msg === "Driver not found" || msg === "Vehicle not found") {
      return res.status(404).json({ message: msg });
    }
    console.error("Assign driver to vehicle error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/unassign-driver", requirePermission("vehicles.assign"), async (req, res) => {
  const orgId = req.effectiveOrgId;
  const vehicleId = String(req.params.id);

  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  if (!UUID_RE.test(vehicleId)) {
    return res.status(400).json({ message: "Invalid vehicle id" });
  }

  try {
    await runUnassignVehicleTransaction({
      orgId,
      vehicleId,
      unassignedBy: req.user?.sub ?? null,
      notes: "Unassigned via vehicle detail",
    });
    const { rows } = await query(
      `SELECT v.*, d.first_name AS driver_first_name, d.last_name AS driver_last_name
       FROM vehicles v
       LEFT JOIN drivers d ON v.current_driver_id = d.id
       WHERE v.id = $1 AND v.organization_id = $2`,
      [vehicleId, orgId],
    );
    if (!rows[0]) return res.status(404).json({ message: "Vehicle not found" });
    return res.json(rows[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unassign failed";
    if (msg === "Vehicle not found") {
      return res.status(404).json({ message: msg });
    }
    console.error("Unassign driver from vehicle error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }

  try {
    const { rows } = await query(
      `
      SELECT v.*, d.first_name AS driver_first_name, d.last_name AS driver_last_name
      FROM vehicles v
      LEFT JOIN drivers d ON v.current_driver_id = d.id
      WHERE v.id = $1 AND v.organization_id = $2
      LIMIT 1
      `,
      [id, orgId],
    );
    const vehicle = rows[0];
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    return res.json(vehicle);
  } catch (err) {
    console.error("Get vehicle error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requirePermission("vehicles.create"), async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const body = req.body as Record<string, unknown>;
  const {
    vehicleType,
    make,
    model,
    year,
    color,
    licensePlate,
    vin,
    fuelType,
    transmission,
    seatingCapacity,
    dailyRent,
    weeklyRent,
    monthlyRent,
    insuranceExpiry,
    registrationExpiry,
    status,
    notes,
  } = body;

  if (!vehicleType || !make || !model || !licensePlate) {
    return res.status(400).json({
      message: "vehicleType, make, model and licensePlate are required",
    });
  }

  try {
    const { rows: existing } = await query<{ id: string }>(
      "SELECT id FROM vehicles WHERE organization_id = $1 AND license_plate = $2 LIMIT 1",
      [orgId, String(licensePlate).trim()],
    );
    if (existing[0]) {
      return res.status(409).json({ message: "A vehicle with this license plate already exists" });
    }

    const { rows } = await query(
      `
      INSERT INTO vehicles (
        organization_id, vehicle_type, make, model, year, color, license_plate, vin,
        fuel_type, transmission, seating_capacity, daily_rent, weekly_rent, monthly_rent,
        insurance_expiry, registration_expiry, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, COALESCE($17, 'available'), $18)
      RETURNING *
      `,
      [
        orgId,
        vehicleType,
        make,
        model,
        year ?? null,
        color ?? null,
        String(licensePlate).trim(),
        vin ?? null,
        fuelType ?? null,
        transmission ?? null,
        seatingCapacity ?? null,
        dailyRent ?? 0,
        weeklyRent ?? 0,
        monthlyRent ?? 0,
        insuranceExpiry ?? null,
        registrationExpiry ?? null,
        status ?? null,
        notes ?? null,
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create vehicle error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", requirePermission("vehicles.edit"), async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }

  const body = req.body as Record<string, unknown>;
  const {
    vehicleType,
    make,
    model,
    year,
    color,
    licensePlate,
    vin,
    fuelType,
    transmission,
    seatingCapacity,
    dailyRent,
    weeklyRent,
    monthlyRent,
    insuranceExpiry,
    registrationExpiry,
    status,
    currentDriverId,
    notes,
  } = body;

  if (licensePlate) {
    const { rows: existing } = await query<{ id: string }>(
      "SELECT id FROM vehicles WHERE organization_id = $1 AND license_plate = $2 AND id != $3 LIMIT 1",
      [orgId, String(licensePlate).trim(), id],
    );
    if (existing[0]) {
      return res.status(409).json({ message: "A vehicle with this license plate already exists" });
    }
  }

  try {
    const { rows: beforeRows } = await query<{
      status: string;
      weekly_rent: string;
    }>(
      `SELECT status, weekly_rent::text
       FROM vehicles WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [id, orgId],
    );
    const before = beforeRows[0];
    if (!before) return res.status(404).json({ message: "Vehicle not found" });

    const { rows } = await query(
      `
      UPDATE vehicles
      SET
        vehicle_type = COALESCE($1, vehicle_type),
        make = COALESCE($2, make),
        model = COALESCE($3, model),
        year = $4,
        color = $5,
        license_plate = COALESCE($6, license_plate),
        vin = $7,
        fuel_type = $8,
        transmission = $9,
        seating_capacity = $10,
        daily_rent = COALESCE($11, daily_rent),
        weekly_rent = COALESCE($12, weekly_rent),
        monthly_rent = COALESCE($13, monthly_rent),
        insurance_expiry = $14,
        registration_expiry = $15,
        status = COALESCE($16, status),
        notes = $17,
        updated_at = NOW()
      WHERE id = $18 AND organization_id = $19
      RETURNING *
      `,
      [
        vehicleType ?? null,
        make ?? null,
        model ?? null,
        year ?? null,
        color ?? null,
        licensePlate ?? null,
        vin ?? null,
        fuelType ?? null,
        transmission ?? null,
        seatingCapacity ?? null,
        dailyRent ?? null,
        weeklyRent ?? null,
        monthlyRent ?? null,
        insuranceExpiry ?? null,
        registrationExpiry ?? null,
        status ?? null,
        notes ?? null,
        id,
        orgId,
      ],
    );
    const vehicle = rows[0];
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const userId = req.user?.sub ?? null;
    const nextStatus = status != null ? String(status) : before.status;
    if (nextStatus !== before.status) {
      await insertVehicleHistoryQuery({
        orgId,
        vehicleId: String(id),
        eventType: "status_change",
        previousStatus: before.status,
        newStatus: nextStatus,
        title: "Status changed",
        description: `Status updated from ${before.status} to ${nextStatus}`,
        createdBy: userId,
      });
    }

    const nextWeekly =
      weeklyRent != null && weeklyRent !== "" ? Number(weeklyRent) : Number(before.weekly_rent);
    const prevWeekly = Number(before.weekly_rent ?? 0);
    if (
      weeklyRent != null &&
      weeklyRent !== "" &&
      Number.isFinite(nextWeekly) &&
      Math.abs(nextWeekly - prevWeekly) > 0.009
    ) {
      await insertVehicleHistoryQuery({
        orgId,
        vehicleId: String(id),
        eventType: "rent_changed",
        previousRent: prevWeekly,
        newRent: nextWeekly,
        title: "Weekly rent updated",
        description: `Weekly rent changed from ${prevWeekly.toFixed(2)} to ${nextWeekly.toFixed(2)}`,
        createdBy: userId,
      });
    }

    if (typeof currentDriverId !== "undefined") {
      const vehicleIdStr = String(id);
      if (currentDriverId && typeof currentDriverId === "string" && UUID_RE.test(currentDriverId)) {
        await runAssignVehicleTransaction({
          orgId,
          driverId: currentDriverId,
          vehicleId: vehicleIdStr,
          assignedBy: req.user?.sub ?? null,
          notes: "Assigned via edit vehicle",
        });
      } else {
        await runUnassignVehicleTransaction({
          orgId,
          vehicleId: vehicleIdStr,
          unassignedBy: req.user?.sub ?? null,
          notes: "Unassigned via edit vehicle",
        });
      }
    }

    const { rows: refreshed } = await query(
      `SELECT v.*, d.first_name AS driver_first_name, d.last_name AS driver_last_name
       FROM vehicles v
       LEFT JOIN drivers d ON v.current_driver_id = d.id
       WHERE v.id = $1 AND v.organization_id = $2`,
      [id, orgId],
    );
    return res.json(refreshed[0] ?? vehicle);
  } catch (err) {
    console.error("Update vehicle error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requirePermission("vehicles.delete"), async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }

  try {
    await assertVehicleHasNoRentalBookings(id, orgId);

    const { rows } = await query(
      "DELETE FROM vehicles WHERE id = $1 AND organization_id = $2 RETURNING id",
      [id, orgId],
    );
    if (!rows[0]) return res.status(404).json({ message: "Vehicle not found" });
    return res.json({ id: rows[0].id });
  } catch (err) {
    if (err instanceof VehicleDeleteBlockedError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    const pg = err as { code?: string };
    if (pg.code === "23503") {
      return res.status(409).json({
        message: "Cannot delete this vehicle because it is linked to rental bookings.",
      });
    }
    console.error("Delete vehicle error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/maintenance", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const { id } = req.params;
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }

  try {
    const { rows: vehicleRows } = await query<{ id: string }>(
      "SELECT id FROM vehicles WHERE id = $1 AND organization_id = $2 LIMIT 1",
      [id, orgId],
    );
    if (!vehicleRows[0]) return res.status(404).json({ message: "Vehicle not found" });

    const { rows } = await query(
      "SELECT * FROM vehicle_maintenance WHERE vehicle_id = $1 ORDER BY scheduled_date DESC NULLS LAST, created_at DESC",
      [id],
    );
    return res.json(rows);
  } catch (err) {
    console.error("List vehicle maintenance error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/maintenance", requirePermission("vehicles.edit"), async (req, res) => {
  const orgId = req.effectiveOrgId;
  const { id: vehicleId } = req.params;
  const body = req.body as Record<string, unknown>;
  const {
    maintenanceType,
    description,
    cost,
    scheduledDate,
    completedDate,
    status,
    mechanicName,
    notes,
  } = body;

  if (!maintenanceType) {
    return res.status(400).json({ message: "maintenanceType is required" });
  }
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }

  try {
    const { rows: vehicleRows } = await query<{ id: string }>(
      "SELECT id FROM vehicles WHERE id = $1 AND organization_id = $2 LIMIT 1",
      [vehicleId, orgId],
    );
    if (!vehicleRows[0]) return res.status(404).json({ message: "Vehicle not found" });

    const { rows } = await query(
      `
      INSERT INTO vehicle_maintenance (
        vehicle_id, maintenance_type, description, cost, scheduled_date, completed_date, status, mechanic_name, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'pending'), $8, $9)
      RETURNING *
      `,
      [
        vehicleId,
        maintenanceType,
        description ?? null,
        cost ?? null,
        scheduledDate ?? null,
        completedDate ?? null,
        status ?? null,
        mechanicName ?? null,
        notes ?? null,
      ],
    );

    if (status === "in_progress" || status === "completed") {
      await query(
        "UPDATE vehicles SET status = 'maintenance', updated_at = NOW() WHERE id = $1",
        [vehicleId],
      );
    }

    await insertVehicleHistoryQuery({
      orgId,
      vehicleId: String(vehicleId),
      eventType: "maintenance",
      title: String(maintenanceType),
      description: description != null ? String(description) : null,
      cost: cost != null ? Number(cost) : null,
      metadata: {
        maintenance_id: rows[0]?.id,
        maintenance_type: maintenanceType,
        status: status ?? "pending",
      },
      createdBy: req.user?.sub ?? null,
    });

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create maintenance error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:vehicleId/maintenance/:maintenanceId", requirePermission("vehicles.edit"), async (req, res) => {
  const orgId = req.effectiveOrgId;
  const { vehicleId, maintenanceId } = req.params;
  const body = req.body as Record<string, unknown>;
  const { maintenanceType, description, cost, scheduledDate, completedDate, status, mechanicName, notes } = body;

  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }

  try {
    const { rows } = await query(
      `
      UPDATE vehicle_maintenance
      SET
        maintenance_type = COALESCE($1, maintenance_type),
        description = COALESCE($2, description),
        cost = COALESCE($3, cost),
        scheduled_date = COALESCE($4, scheduled_date),
        completed_date = COALESCE($5, completed_date),
        status = COALESCE($6, status),
        mechanic_name = COALESCE($7, mechanic_name),
        notes = COALESCE($8, notes),
        updated_at = NOW()
      WHERE id = $9 AND vehicle_id = $10
      RETURNING *
      `,
      [
        maintenanceType ?? null,
        description ?? null,
        cost ?? null,
        scheduledDate ?? null,
        completedDate ?? null,
        status ?? null,
        mechanicName ?? null,
        notes ?? null,
        maintenanceId,
        vehicleId,
      ],
    );
    const maintenance = rows[0];
    if (!maintenance) return res.status(404).json({ message: "Maintenance record not found" });

    const { rows: vehicleRows } = await query<{ id: string }>(
      "SELECT id FROM vehicles WHERE id = $1 AND organization_id = $2 LIMIT 1",
      [vehicleId, orgId],
    );
    if (vehicleRows[0]) {
      const allCompleted = await query(
        "SELECT COUNT(*) AS cnt FROM vehicle_maintenance WHERE vehicle_id = $1 AND status NOT IN ('completed', 'cancelled')",
        [vehicleId],
      );
      const pending = Number((allCompleted.rows[0] as { cnt: string }).cnt) > 0;
      await query(
        "UPDATE vehicles SET status = $1, updated_at = NOW() WHERE id = $2",
        [pending ? "maintenance" : "available", vehicleId],
      );
    }

    return res.json(maintenance);
  } catch (err) {
    console.error("Update maintenance error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const vehicleRoutes = router;
