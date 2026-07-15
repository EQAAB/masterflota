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

function existingImportFileSuffix(existing: CompletedPlatformWeekImport): string {
  return existing.file_name?.trim() ? ` (${existing.file_name})` : "";
}

/** Soft warning when preview detects an existing completed week (append is allowed). */
export function appendToExistingWeekPreviewMessage(existing: CompletedPlatformWeekImport): string {
  const label = earningsPlatformLabel(existing.platform);
  const file = existingImportFileSuffix(existing);
  return `${label} earnings for ${existing.week_start} → ${existing.week_end} already imported${file}. You can add this file to the same pay week (month-split reports). To replace the whole week, revert the existing import first.`;
}

/** Commit blocked until client sends appendToExistingWeek: true. */
export function appendToExistingWeekRequiredMessage(existing: CompletedPlatformWeekImport): string {
  const label = earningsPlatformLabel(existing.platform);
  const file = existingImportFileSuffix(existing);
  return `${label} earnings for ${existing.week_start} → ${existing.week_end} already imported${file}. Confirm “Add to this week” to append, or revert the existing import to replace the week.`;
}

/** @deprecated Prefer append-aware messages; kept for older clients/tests. */
export function duplicatePlatformWeekImportMessage(existing: CompletedPlatformWeekImport): string {
  return appendToExistingWeekRequiredMessage(existing);
}

export type ExistingWeekImportDto = {
  id: string;
  platform: string;
  weekStart: string;
  weekEnd: string;
  fileName: string | null;
  importDate: string;
};

export function toExistingWeekImportDto(existing: CompletedPlatformWeekImport): ExistingWeekImportDto {
  return {
    id: existing.id,
    platform: existing.platform,
    weekStart: existing.week_start,
    weekEnd: existing.week_end,
    fileName: existing.file_name,
    importDate: existing.import_date,
  };
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

export class AppendToExistingWeekRequiredError extends Error {
  readonly code = "APPEND_TO_EXISTING_WEEK_REQUIRED" as const;
  readonly existingImportId: string;
  readonly existing: CompletedPlatformWeekImport;
  readonly appendAllowed = true as const;

  constructor(existing: CompletedPlatformWeekImport) {
    super(appendToExistingWeekRequiredMessage(existing));
    this.name = "AppendToExistingWeekRequiredError";
    this.existingImportId = existing.id;
    this.existing = existing;
  }
}

/** @deprecated Use AppendToExistingWeekRequiredError */
export class DuplicatePlatformWeekImportError extends AppendToExistingWeekRequiredError {
  constructor(existing: CompletedPlatformWeekImport) {
    super(existing);
    this.name = "DuplicatePlatformWeekImportError";
  }
}
