function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export type WeekPlatformLeg = {
  payoutId: string;
  platform: string;
  rawNet: number;
  existingRemainingDebt: number;
  currentPaymentStatus: string;
};

export type WeekDebtPool = {
  weekRawNet: number;
  crossPlatformDebtOffset: number;
  debtPlatforms: string[];
  totalPositiveRaw: number;
  totalNegativeRaw: number;
};

export type WeekDebtResolution = {
  weekFinalNet: number;
  debtAppliedToOlder: number;
  newWeekDebtAmount: number;
  remainingDebtAmount: number;
  weekPaymentStatus: string;
};

export type LegDebtAllocation = {
  net_driver_payout: number;
  debt_amount: number;
  debt_applied_amount: number;
  remaining_debt_amount: number;
  payment_status: string;
};

/** Pool platform raw nets for one driver payment week (driver is one entity). */
export function computeWeekDebtPool(legs: Array<{ platform: string; rawNet: number }>): WeekDebtPool {
  const totalPositiveRaw = roundMoney(
    legs.reduce((s, l) => (l.rawNet > 0.02 ? s + l.rawNet : s), 0),
  );
  const totalNegativeRaw = roundMoney(
    legs.reduce((s, l) => (l.rawNet < -0.02 ? s + l.rawNet : s), 0),
  );
  const weekRawNet = roundMoney(totalPositiveRaw + totalNegativeRaw);
  const crossPlatformDebtOffset = roundMoney(Math.min(totalPositiveRaw, Math.abs(totalNegativeRaw)));
  const debtPlatforms = legs.filter((l) => l.rawNet < -0.02).map((l) => l.platform);
  return {
    weekRawNet,
    crossPlatformDebtOffset,
    debtPlatforms,
    totalPositiveRaw,
    totalNegativeRaw,
  };
}

function pickAnchorLeg(legs: WeekPlatformLeg[]): WeekPlatformLeg {
  const negative = legs.filter((l) => l.rawNet < -0.02);
  if (negative.length) {
    return negative.reduce((a, b) => (a.rawNet < b.rawNet ? a : b));
  }
  return legs.reduce((a, b) => (a.rawNet >= b.rawNet ? a : b));
}

/** Split week final net across platform legs after cross-platform offset. */
export function distributeWeekNetToLegs(
  legs: WeekPlatformLeg[],
  pool: WeekDebtPool,
  resolution: WeekDebtResolution,
): Map<string, LegDebtAllocation> {
  const out = new Map<string, LegDebtAllocation>();
  if (!legs.length) return out;

  const anchor = pickAnchorLeg(legs);
  const { weekFinalNet, debtAppliedToOlder, remainingDebtAmount, weekPaymentStatus } = resolution;

  if (weekFinalNet < -0.02) {
    for (const leg of legs) {
      const isAnchor = leg.payoutId === anchor.payoutId;
      out.set(leg.payoutId, {
        net_driver_payout: isAnchor ? weekFinalNet : 0,
        debt_amount: isAnchor
          ? resolution.newWeekDebtAmount
          : leg.rawNet < -0.02
            ? roundMoney(Math.abs(leg.rawNet))
            : 0,
        debt_applied_amount: 0,
        remaining_debt_amount: isAnchor ? remainingDebtAmount : 0,
        payment_status: isAnchor
          ? weekPaymentStatus
          : leg.rawNet < -0.02
            ? "debt"
            : weekPaymentStatus === "hold"
              ? "hold"
              : "pending",
      });
    }
    return out;
  }

  const positiveLegs = legs.filter((l) => l.rawNet > 0.02);
  const negativeLegs = legs.filter((l) => l.rawNet < -0.02);
  const neutralLegs = legs.filter((l) => Math.abs(l.rawNet) <= 0.02);

  for (const leg of negativeLegs) {
    out.set(leg.payoutId, {
      net_driver_payout: 0,
      debt_amount: roundMoney(Math.abs(leg.rawNet)),
      debt_applied_amount: 0,
      remaining_debt_amount: 0,
      payment_status: weekPaymentStatus === "hold" ? "hold" : "pending",
    });
  }

  for (const leg of neutralLegs) {
    out.set(leg.payoutId, {
      net_driver_payout: 0,
      debt_amount: 0,
      debt_applied_amount: 0,
      remaining_debt_amount: 0,
      payment_status: weekPaymentStatus === "hold" ? "hold" : "pending",
    });
  }

  if (positiveLegs.length === 0) {
    out.set(anchor.payoutId, {
      net_driver_payout: weekFinalNet,
      debt_amount: 0,
      debt_applied_amount: debtAppliedToOlder,
      remaining_debt_amount: 0,
      payment_status: weekPaymentStatus,
    });
    return out;
  }

  const positiveSum = pool.totalPositiveRaw;
  let allocated = 0;
  for (let i = 0; i < positiveLegs.length; i++) {
    const leg = positiveLegs[i]!;
    const isLast = i === positiveLegs.length - 1;
    const share = isLast
      ? roundMoney(weekFinalNet - allocated)
      : positiveSum > 0
        ? roundMoney((weekFinalNet * leg.rawNet) / positiveSum)
        : 0;
    allocated = roundMoney(allocated + share);
    out.set(leg.payoutId, {
      net_driver_payout: share,
      debt_amount: 0,
      debt_applied_amount: i === 0 ? debtAppliedToOlder : 0,
      remaining_debt_amount: 0,
      payment_status: weekPaymentStatus,
    });
  }

  return out;
}

export { roundMoney as roundWeekMoney };
