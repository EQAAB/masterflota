import { query } from "../../db/pool";

/** Drivers eligible for earnings import matching (active/suspended, not soft-deleted). */
export const DRIVER_MATCHABLE_SQL =
  `(is_deleted = false OR is_deleted IS NULL) AND employment_status IS DISTINCT FROM 'terminated'`;

export const DRIVER_MATCHABLE_SQL_D =
  `(d.is_deleted = false OR d.is_deleted IS NULL) AND d.employment_status IS DISTINCT FROM 'terminated'`;

/** SET clause fragment to release platform courier IDs after leave/transfer. */
export const CLEAR_PLATFORM_IDS_SQL = `
  uber_driver_id = NULL,
  bolt_driver_id = NULL,
  glovo_courier_id = NULL,
  bolt_courier_id = NULL,
  bolt_taxi_driver_uuid = NULL,
  wolt_courier_id = NULL`;

export type PlatformIdField =
  | "uber_driver_id"
  | "bolt_driver_id"
  | "glovo_courier_id"
  | "bolt_courier_id"
  | "bolt_taxi_driver_uuid"
  | "wolt_courier_id";

export type PlatformIdValues = Partial<Record<PlatformIdField, string | null | undefined>>;

const PLATFORM_ID_LABELS: Record<PlatformIdField, string> = {
  uber_driver_id: "Uber driver ID",
  bolt_driver_id: "Bolt driver ID",
  glovo_courier_id: "Glovo courier ID",
  bolt_courier_id: "Bolt courier ID",
  bolt_taxi_driver_uuid: "Bolt Taxi driver UUID",
  wolt_courier_id: "Wolt courier ID",
};

const PLATFORM_ID_FIELDS = Object.keys(PLATFORM_ID_LABELS) as PlatformIdField[];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePlatformIdValue(
  field: PlatformIdField,
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (field === "bolt_taxi_driver_uuid") {
    return UUID_RE.test(trimmed) ? trimmed.toLowerCase() : null;
  }
  return trimmed;
}

export function platformIdsForTerminatedWrite(
  employmentStatus: unknown,
  values: PlatformIdValues,
): PlatformIdValues {
  if (String(employmentStatus ?? "").toLowerCase() === "terminated") {
    return {
      uber_driver_id: null,
      bolt_driver_id: null,
      glovo_courier_id: null,
      bolt_courier_id: null,
      bolt_taxi_driver_uuid: null,
      wolt_courier_id: null,
    };
  }
  return {
    uber_driver_id: normalizePlatformIdValue("uber_driver_id", values.uber_driver_id),
    bolt_driver_id: normalizePlatformIdValue("bolt_driver_id", values.bolt_driver_id),
    glovo_courier_id: normalizePlatformIdValue("glovo_courier_id", values.glovo_courier_id),
    bolt_courier_id: normalizePlatformIdValue("bolt_courier_id", values.bolt_courier_id),
    bolt_taxi_driver_uuid: normalizePlatformIdValue(
      "bolt_taxi_driver_uuid",
      values.bolt_taxi_driver_uuid,
    ),
    wolt_courier_id: normalizePlatformIdValue("wolt_courier_id", values.wolt_courier_id),
  };
}

export type PlatformIdConflict = {
  field: PlatformIdField;
  label: string;
  value: string;
  existingDriverId: string;
};

/**
 * Returns the first active/suspended driver in the org that already owns one of the given platform IDs.
 * Soft-deleted and terminated drivers are ignored (IDs should be cleared on leave).
 */
export async function findPlatformIdConflict(
  orgId: string,
  values: PlatformIdValues,
  excludeDriverId?: string | null,
): Promise<PlatformIdConflict | null> {
  const checks: { field: PlatformIdField; value: string }[] = [];
  for (const field of PLATFORM_ID_FIELDS) {
    const value = normalizePlatformIdValue(field, values[field]);
    if (value) checks.push({ field, value });
  }
  if (checks.length === 0) return null;

  const params: unknown[] = [orgId];
  const unions = checks
    .map(({ field }, i) => {
      const p = `$${i + 2}`;
      const valueExpr =
        field === "bolt_taxi_driver_uuid"
          ? "LOWER(TRIM(bolt_taxi_driver_uuid::text))"
          : `LOWER(TRIM(${field}))`;
      const selectValue =
        field === "bolt_taxi_driver_uuid" ? "bolt_taxi_driver_uuid::text" : field;
      const excludeClause = excludeDriverId
        ? `AND id <> $${checks.length + 2}::uuid`
        : "";
      return `
        SELECT id::text AS id, '${field}'::text AS field, ${selectValue} AS value
        FROM drivers
        WHERE organization_id = $1::uuid
          AND ${DRIVER_MATCHABLE_SQL}
          AND ${field} IS NOT NULL
          AND ${valueExpr} = LOWER(TRIM(${p}))
          ${excludeClause}
      `;
    })
    .join("\nUNION ALL\n");

  for (const { value } of checks) params.push(value);
  if (excludeDriverId) params.push(excludeDriverId);

  const { rows } = await query<{ id: string; field: PlatformIdField; value: string }>(
    `${unions}
     LIMIT 1`,
    params,
  );
  const hit = rows[0];
  if (!hit) return null;
  return {
    field: hit.field,
    label: PLATFORM_ID_LABELS[hit.field] ?? hit.field,
    value: hit.value,
    existingDriverId: hit.id,
  };
}

export function platformIdConflictMessage(conflict: PlatformIdConflict): string {
  return `Another driver in this organization already uses this ${conflict.label} (${conflict.value})`;
}
