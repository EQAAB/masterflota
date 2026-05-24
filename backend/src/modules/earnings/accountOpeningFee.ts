import { query } from "../../db/pool";
import type { EarningsPlatform } from "./detectPlatform";

function parseOrgFee(value: unknown): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function readOrgSettings(orgId: string): Promise<Record<string, unknown>> {
  const { rows } = await query<{ settings: unknown }>(
    `SELECT settings FROM organizations WHERE id = $1::uuid`,
    [orgId],
  );
  return (rows[0]?.settings as Record<string, unknown>) ?? {};
}

/** Organization default account opening fee (Glovo), from `organizations.settings.defaultAccountOpeningFee`. */
export async function readOrgDefaultAccountOpeningFee(orgId: string): Promise<number> {
  const s = await readOrgSettings(orgId);
  return parseOrgFee(s.defaultAccountOpeningFee);
}

/** Organization default Taxa aplicatie / platform fee (Glovo), from `organizations.settings.defaultPlatformFee`. */
export async function readOrgDefaultPlatformFee(orgId: string): Promise<number> {
  const s = await readOrgSettings(orgId);
  return parseOrgFee(s.defaultPlatformFee);
}

export function isBoltEarningsPlatform(platform: EarningsPlatform): boolean {
  return platform === "bolt_courier" || platform === "bolt";
}

/**
 * Per earnings_records row at commit/preview.
 * Glovo: CSV if present; else org default once per driver per import.
 * Bolt: always 0.
 */
export function resolveAccountOpeningFeeForEarningsRow(params: {
  platform: EarningsPlatform;
  csvFee: number | null | undefined;
  orgDefault: number;
  driverId: string;
  defaultAppliedForDriver: Set<string>;
}): number | null {
  if (isBoltEarningsPlatform(params.platform)) {
    return 0;
  }

  if (params.platform !== "glovo") {
    const csv = params.csvFee;
    if (csv == null) return null;
    const abs = Math.abs(csv);
    return abs > 0 ? abs : null;
  }

  const csv = params.csvFee;
  if (csv != null) {
    const abs = Math.abs(csv);
    if (abs > 0) return abs;
  }

  if (!params.defaultAppliedForDriver.has(params.driverId)) {
    params.defaultAppliedForDriver.add(params.driverId);
    if (params.orgDefault > 0) {
      return params.orgDefault;
    }
  }

  return null;
}

/**
 * Per earnings_records row: Taxa aplicatie (platform_fee).
 * Glovo: CSV if present; else org default once per driver per import.
 * Bolt: always 0 (VAT gross−net is not a platform service fee).
 */
export function resolvePlatformFeeForEarningsRow(params: {
  platform: EarningsPlatform;
  csvFee: number | null | undefined;
  orgDefault: number;
  driverId: string;
  defaultAppliedForDriver: Set<string>;
}): number | null {
  if (isBoltEarningsPlatform(params.platform)) {
    return 0;
  }

  if (params.platform !== "glovo") {
    const csv = params.csvFee;
    if (csv == null) return null;
    const abs = Math.abs(csv);
    return abs > 0 ? abs : null;
  }

  const csv = params.csvFee;
  if (csv != null) {
    const abs = Math.abs(csv);
    if (abs > 0) return abs;
  }

  if (!params.defaultAppliedForDriver.has(params.driverId)) {
    params.defaultAppliedForDriver.add(params.driverId);
    if (params.orgDefault > 0) {
      return params.orgDefault;
    }
  }

  return null;
}
