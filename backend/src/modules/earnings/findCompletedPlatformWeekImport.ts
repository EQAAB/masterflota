import type { Pool, PoolClient } from "pg";
import type { EarningsPlatform } from "./detectPlatform";

type Queryable = Pool | PoolClient;

export type CompletedPlatformWeekImport = {
  id: string;
  platform: string;
  week_start: string;
  week_end: string;
  file_name: string | null;
  import_date: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  uber: "Uber",
  bolt: "Bolt",
  glovo: "Glovo",
  bolt_courier: "Bolt Courier",
  wolt_courier: "Wolt Courier",
  bolt_taxi: "Bolt Taxi",
};

export function earningsPlatformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

export function duplicatePlatformWeekImportMessage(existing: CompletedPlatformWeekImport): string {
  const label = earningsPlatformLabel(existing.platform);
  const file = existing.file_name?.trim() ? ` (${existing.file_name})` : "";
  return `${label} earnings for ${existing.week_start} → ${existing.week_end} already imported${file}. Revert that import before uploading again.`;
}

/** Find a completed weekly import for the same org + platform + pay week. */
export async function findCompletedPlatformWeekImport(
  db: Queryable,
  orgId: string,
  platform: EarningsPlatform | string,
  weekStart: string,
  weekEnd: string,
  excludeImportId?: string,
): Promise<CompletedPlatformWeekImport | null> {
  const params: unknown[] = [orgId, platform, weekStart, weekEnd];
  let excludeClause = "";
  if (excludeImportId) {
    params.push(excludeImportId);
    excludeClause = ` AND id <> $${params.length}::uuid`;
  }

  const { rows } = await db.query<CompletedPlatformWeekImport>(
    `SELECT id::text,
            platform,
            week_start::text,
            week_end::text,
            file_name,
            import_date::text
     FROM earnings_imports
     WHERE organization_id = $1::uuid
       AND platform = $2
       AND week_start = $3::date
       AND week_end = $4::date
       AND status = 'completed'${excludeClause}
     ORDER BY created_at DESC
     LIMIT 1`,
    params,
  );
  return rows[0] ?? null;
}

export class DuplicatePlatformWeekImportError extends Error {
  readonly code = "DUPLICATE_PLATFORM_WEEK_IMPORT" as const;
  readonly existingImportId: string;

  constructor(existing: CompletedPlatformWeekImport) {
    super(duplicatePlatformWeekImportMessage(existing));
    this.name = "DuplicatePlatformWeekImportError";
    this.existingImportId = existing.id;
  }
}
