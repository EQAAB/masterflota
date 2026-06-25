export const FROZEN_PAYOUT_STATUSES = ["paid", "approved"] as const;

export type FrozenPayoutStatus = (typeof FROZEN_PAYOUT_STATUSES)[number];

export function isFrozenPayoutStatus(status: string): boolean {
  return (FROZEN_PAYOUT_STATUSES as readonly string[]).includes(status);
}

export function filterOpenWeekLegs<T extends { currentPaymentStatus: string }>(legs: T[]): T[] {
  return legs.filter((leg) => !isFrozenPayoutStatus(leg.currentPaymentStatus));
}

/** SQL fragment: `payment_status NOT IN ('paid', 'approved')` */
export const OPEN_PAYOUT_STATUS_SQL = `payment_status NOT IN ('paid', 'approved')`;
