import {
  resolveAccountOpeningFeeForEarningsRow,
  resolvePlatformFeeForEarningsRow,
} from "./accountOpeningFee";
import type { EarningsPlatform } from "./detectPlatform";
import type { DriverMatchIndex } from "./matchDriver";
import type { EarningsStagingPayload } from "./normalizeRow";

/** Shape returned to the earnings import preview UI (matches frontend EarningsPreviewRow). */
export type EarningsPreviewRowDto = {
  rowIndex: number;
  tripDate: string | null;
  gross: number | null;
  net: number | null;
  tips: number | null;
  transferTotal: number | null;
  platformFee: number | null;
  dailyCash: number | null;
  accountOpeningFee: number | null;
  tripCount: number | null;
  matchMethod: string;
  driverMatched: boolean;
  hints: {
    courierId?: string;
    phone?: string;
    plate?: string;
    driverName?: string;
  };
  /** True when TVT (transfer total) is negative — creates driver debt on commit. */
  negativeTransferTotal: boolean;
};

export function stagingPayloadToPreviewRow(
  rowIndex: number,
  p: EarningsStagingPayload,
  platform: EarningsPlatform,
  index: DriverMatchIndex,
  opts?: {
    orgDefaultOpeningFee?: number;
    defaultOpeningApplied?: Set<string>;
    orgDefaultPlatformFee?: number;
    defaultPlatformApplied?: Set<string>;
  },
): EarningsPreviewRowDto {
  const { driverId, matchMethod } = index.match(platform, p.hints);
  const tt = p.amounts.transferTotal;
  const defaultOpeningApplied = opts?.defaultOpeningApplied ?? new Set<string>();
  const defaultPlatformApplied = opts?.defaultPlatformApplied ?? new Set<string>();
  const accountOpeningFee =
    driverId != null
      ? resolveAccountOpeningFeeForEarningsRow({
          platform,
          csvFee: p.amounts.accountOpeningFee,
          orgDefault: opts?.orgDefaultOpeningFee ?? 0,
          driverId,
          defaultAppliedForDriver: defaultOpeningApplied,
        })
      : platform === "bolt_courier" || platform === "bolt"
        ? 0
        : p.amounts.accountOpeningFee;
  const platformFee =
    driverId != null
      ? resolvePlatformFeeForEarningsRow({
          platform,
          csvFee: p.amounts.platformFee,
          orgDefault: opts?.orgDefaultPlatformFee ?? 0,
          driverId,
          defaultAppliedForDriver: defaultPlatformApplied,
        })
      : platform === "bolt_courier" || platform === "bolt"
        ? 0
        : p.amounts.platformFee;
  return {
    rowIndex,
    tripDate: p.tripDateIso,
    gross: p.amounts.gross,
    net: p.amounts.net,
    tips: p.amounts.tips ?? null,
    transferTotal: p.amounts.transferTotal,
    platformFee,
    dailyCash: p.amounts.dailyCash,
    accountOpeningFee,
    tripCount: p.amounts.tripCount,
    matchMethod,
    driverMatched: !!driverId,
    hints: p.hints,
    negativeTransferTotal: tt != null && tt < 0,
  };
}
