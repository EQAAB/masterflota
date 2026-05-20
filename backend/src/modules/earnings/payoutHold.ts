import { roundMoney } from "./debtAllocation";

export type PayoutHoldReleaseInput = {
  payment_status: string;
  raw_net_amount: string | number | null;
  remaining_debt_amount: string | number | null;
};

export type PayoutHoldReleaseResult =
  | { ok: true; nextStatus: string }
  | { ok: false; message: string };

export function truncateHoldReason(value: string | null | undefined, maxLen = 200): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  if (!t) return null;
  return t.length <= maxLen ? t : t.slice(0, maxLen);
}

export function holdReasonForAdjustDebt(note: string | null | undefined): string {
  return truncateHoldReason(note) ?? "debt_forgiven";
}

export function holdReasonForBulk(holdReason: string | null | undefined): string {
  return truncateHoldReason(holdReason) ?? "manual_hold";
}

/** Status after admin releases a payout from hold. */
export function computeStatusAfterReleaseHold(input: PayoutHoldReleaseInput): PayoutHoldReleaseResult {
  if (input.payment_status !== "hold") {
    return { ok: false, message: "Payout is not on hold" };
  }
  const rem = roundMoney(Number(input.remaining_debt_amount ?? 0));
  if (rem > 0) {
    return { ok: true, nextStatus: "debt" };
  }
  return { ok: true, nextStatus: "pending" };
}
