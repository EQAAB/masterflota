import type { QueryResultRow } from "pg";
import { query as poolQuery } from "../../db/pool";

export const VEHICLE_HISTORY_EVENT_TYPES = [
  "assigned",
  "unassigned",
  "status_change",
  "maintenance",
  "incident",
  "rent_changed",
  "rent_collected",
  "rental_booked",
  "rental_pickup",
  "rental_return",
  "rental_cancelled",
] as const;

export type VehicleHistoryEventType = (typeof VEHICLE_HISTORY_EVENT_TYPES)[number];

type Db = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

export type InsertVehicleHistoryParams = {
  orgId: string;
  vehicleId: string;
  eventType: VehicleHistoryEventType;
  eventDate?: Date;
  driverId?: string | null;
  previousDriverId?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  previousRent?: number | null;
  newRent?: number | null;
  title?: string | null;
  description?: string | null;
  cost?: number | null;
  odometerReading?: number | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
};

export async function insertVehicleHistory(db: Db, params: InsertVehicleHistoryParams): Promise<string | null> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO vehicle_history (
       organization_id, vehicle_id, event_type, event_date,
       driver_id, previous_driver_id, previous_status, new_status,
       previous_rent, new_rent, title, description, cost, odometer_reading,
       metadata, created_by
     ) VALUES (
       $1::uuid, $2::uuid, $3, COALESCE($4::timestamptz, NOW()),
       $5::uuid, $6::uuid, $7, $8,
       $9, $10, $11, $12, $13, $14,
       $15::jsonb, $16::uuid
     )
     RETURNING id::text`,
    [
      params.orgId,
      params.vehicleId,
      params.eventType,
      params.eventDate ?? null,
      params.driverId ?? null,
      params.previousDriverId ?? null,
      params.previousStatus ?? null,
      params.newStatus ?? null,
      params.previousRent ?? null,
      params.newRent ?? null,
      params.title ?? null,
      params.description ?? null,
      params.cost ?? null,
      params.odometerReading ?? null,
      JSON.stringify(params.metadata ?? {}),
      params.createdBy ?? null,
    ],
  );
  return rows[0]?.id ?? null;
}

export type VehicleHistoryRow = {
  id: string;
  vehicle_id: string;
  event_type: VehicleHistoryEventType;
  event_date: string;
  driver_id: string | null;
  previous_driver_id: string | null;
  previous_status: string | null;
  new_status: string | null;
  previous_rent: string | null;
  new_rent: string | null;
  title: string | null;
  description: string | null;
  cost: string | null;
  odometer_reading: number | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  driver_first_name: string | null;
  driver_last_name: string | null;
  previous_driver_first_name: string | null;
  previous_driver_last_name: string | null;
  created_by_first_name: string | null;
  created_by_last_name: string | null;
};

export type ListVehicleHistoryFilters = {
  eventType?: string;
  startDate?: string;
  endDate?: string;
  driverId?: string;
};

export async function listVehicleHistory(
  orgId: string,
  vehicleId: string,
  filters: ListVehicleHistoryFilters,
): Promise<VehicleHistoryRow[]> {
  const conditions = ["vh.organization_id = $1::uuid", "vh.vehicle_id = $2::uuid"];
  const params: unknown[] = [orgId, vehicleId];
  let p = 3;

  if (filters.eventType && VEHICLE_HISTORY_EVENT_TYPES.includes(filters.eventType as VehicleHistoryEventType)) {
    conditions.push(`vh.event_type = $${p++}`);
    params.push(filters.eventType);
  }
  if (filters.startDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) {
    conditions.push(`vh.event_date >= $${p++}::date`);
    params.push(filters.startDate);
  }
  if (filters.endDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
    conditions.push(`vh.event_date < ($${p++}::date + INTERVAL '1 day')`);
    params.push(filters.endDate);
  }
  if (filters.driverId && /^[0-9a-f-]{36}$/i.test(filters.driverId)) {
    conditions.push(`(vh.driver_id = $${p}::uuid OR vh.previous_driver_id = $${p}::uuid)`);
    params.push(filters.driverId);
    p += 1;
  }

  const { rows } = await poolQuery<VehicleHistoryRow>(
    `SELECT vh.id::text,
            vh.vehicle_id::text,
            vh.event_type,
            vh.event_date::text,
            vh.driver_id::text,
            vh.previous_driver_id::text,
            vh.previous_status,
            vh.new_status,
            vh.previous_rent::text,
            vh.new_rent::text,
            vh.title,
            vh.description,
            vh.cost::text,
            vh.odometer_reading,
            vh.metadata,
            vh.created_by::text,
            vh.created_at::text,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            pd.first_name AS previous_driver_first_name,
            pd.last_name AS previous_driver_last_name,
            u.first_name AS created_by_first_name,
            u.last_name AS created_by_last_name
       FROM vehicle_history vh
       LEFT JOIN drivers d ON d.id = vh.driver_id
       LEFT JOIN drivers pd ON pd.id = vh.previous_driver_id
       LEFT JOIN users u ON u.id = vh.created_by
      WHERE ${conditions.join(" AND ")}
      ORDER BY vh.event_date DESC, vh.created_at DESC
      LIMIT 500`,
    params,
  );
  return rows;
}

export async function driverDisplayName(db: Db, driverId: string | null | undefined): Promise<string | null> {
  if (!driverId) return null;
  const { rows } = await db.query<{ name: string }>(
    `SELECT TRIM(CONCAT(first_name, ' ', last_name)) AS name FROM drivers WHERE id = $1::uuid LIMIT 1`,
    [driverId],
  );
  return rows[0]?.name?.trim() || null;
}

const poolDb: Db = { query: (text, params) => poolQuery(text, params) };

export async function insertVehicleHistoryQuery(params: InsertVehicleHistoryParams): Promise<string | null> {
  return insertVehicleHistory(poolDb, params);
}
