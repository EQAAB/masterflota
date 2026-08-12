import type {
  DriverPayoutCustomFee,
  DriverPayoutCustomFeesResponse,
  PayoutListItem,
  PayoutRentEntry,
} from "../../../api/earnings";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";
import { rentEntryTypeLabel } from "./payoutRowUtils";

/** Anchor platform priority for weekly recurring fee deduction (matches backend). */
export const WEEKLY_FEE_ANCHOR_PLATFORMS = ["glovo", "uber", "bolt_taxi", "bolt"] as const;

export type FeeDisplayItem = {
  id: string;
  payoutId: string;
  feeName: string;
  signedAmount: number;
  source: "recurring" | "manual";
  platform?: string;
  notes?: string | null;
};

export type WeekFeeBreakdown = {
  items: FeeDisplayItem[];
  anchorPlatform: string | null;
  anchorPayoutId: string | null;
  isLoading: boolean;
};

export type LegFeeBreakdown = {
  items: FeeDisplayItem[];
  anchorHint?: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function platformOf(p: PayoutListItem): string {
  return (p.earnings_platform ?? "").toLowerCase();
}

export function pickAnchorPayoutItem(items: PayoutListItem[]): PayoutListItem | undefined {
  for (const anchor of WEEKLY_FEE_ANCHOR_PLATFORMS) {
    const found = items.find((p) => platformOf(p) === anchor);
    if (found) return found;
  }
  return items[0];
}

export function feeSignedAmount(fee: DriverPayoutCustomFee): number {
  const amount = round2(Number(fee.amount));
  return fee.fee_type === "deduction" ? -Math.abs(amount) : Math.abs(amount);
}

function toDisplayItem(
  fee: DriverPayoutCustomFee,
  payoutId: string,
  platform: string | null,
  multiPlatform: boolean,
  isManual: boolean,
): FeeDisplayItem {
  const feeName =
    isManual && multiPlatform && platform
      ? `${fee.fee_name} (${earningsPlatformLabel(platform)})`
      : fee.fee_name;
  return {
    id: `${fee.source}-${fee.id}`,
    payoutId,
    feeName,
    signedAmount: feeSignedAmount(fee),
    source: fee.source,
    platform: platform ?? undefined,
    notes: fee.notes,
  };
}

export function buildWeekFeeDisplayItems(
  payoutItems: PayoutListItem[],
  feesByPayoutId: Map<string, DriverPayoutCustomFeesResponse>,
): FeeDisplayItem[] {
  const anchor = pickAnchorPayoutItem(payoutItems);
  const anchorPayoutId = anchor?.id ?? null;
  const anchorPlatform = anchor?.earnings_platform ?? null;
  const multiPlatform = payoutItems.length > 1;
  const items: FeeDisplayItem[] = [];

  if (anchorPayoutId) {
    const anchorFees = feesByPayoutId.get(anchorPayoutId);
    for (const fee of anchorFees?.recurring_items ?? []) {
      items.push(toDisplayItem(fee, anchorPayoutId, anchorPlatform, multiPlatform, false));
    }
  }

  for (const p of payoutItems) {
    const fees = feesByPayoutId.get(p.id);
    for (const fee of fees?.manual_items ?? []) {
      items.push(toDisplayItem(fee, p.id, p.earnings_platform ?? null, multiPlatform, true));
    }
  }

  return items;
}

export function buildWeekFeeBreakdown(
  payoutItems: PayoutListItem[],
  feesByPayoutId: Map<string, DriverPayoutCustomFeesResponse>,
  isLoading: boolean,
): WeekFeeBreakdown {
  const anchor = pickAnchorPayoutItem(payoutItems);
  return {
    items: buildWeekFeeDisplayItems(payoutItems, feesByPayoutId),
    anchorPlatform: anchor?.earnings_platform ?? null,
    anchorPayoutId: anchor?.id ?? null,
    isLoading,
  };
}

export function buildLegFeeDisplayItems(
  payoutId: string,
  weekBreakdown: WeekFeeBreakdown,
): LegFeeBreakdown {
  const isAnchor = weekBreakdown.anchorPayoutId === payoutId;
  const hasRecurring = weekBreakdown.items.some((i) => i.source === "recurring");

  if (isAnchor) {
    return {
      items: weekBreakdown.items.filter(
        (i) => i.source === "recurring" || (i.source === "manual" && i.payoutId === payoutId),
      ),
    };
  }

  const manualForLeg = weekBreakdown.items.filter(
    (i) => i.source === "manual" && i.payoutId === payoutId,
  );

  let anchorHint: string | undefined;
  if (hasRecurring && weekBreakdown.anchorPlatform) {
    anchorHint = `Recurring fees deducted on ${earningsPlatformLabel(weekBreakdown.anchorPlatform)} this week.`;
  }

  return { items: manualForLeg, anchorHint };
}

export function formatFeeStepLabel(item: FeeDisplayItem): string {
  if (item.source === "recurring") return `${item.feeName} (recurring)`;
  return item.feeName;
}

export function formatFeeStepHint(item: FeeDisplayItem): string | undefined {
  if (item.notes?.trim()) return item.notes.trim();
  if (item.source === "recurring") return "From driver profile";
  return undefined;
}

export function sumFeeSignedAmount(items: FeeDisplayItem[]): number {
  return round2(items.reduce((s, i) => s + i.signedAmount, 0));
}

export function feeItemsTotalAbs(items: FeeDisplayItem[]): number {
  return round2(items.reduce((s, i) => s + Math.abs(i.signedAmount), 0));
}

export type FeeLadderStepDef = {
  kind: "deduction" | "positive" | "loading" | "neutral";
  prefix?: "-" | "";
  label: string;
  amount: number;
  hint?: string;
};

export function feeResidualDelta(weeklyChargesDelta: number, items: FeeDisplayItem[]): number {
  return round2(weeklyChargesDelta - sumFeeSignedAmount(items));
}

export function buildWeekFeeLadderSteps(
  weekBreakdown: WeekFeeBreakdown | undefined,
  options: {
    fallbackDelta?: number;
    recurringAnchorHint?: string;
  } = {},
): FeeLadderStepDef[] {
  if (!weekBreakdown) {
    const delta = options.fallbackDelta ?? 0;
    if (Math.abs(delta) > 0.02) {
      return [
        {
          kind: "deduction",
          prefix: "-",
          label: "Fleet fees & adjustments",
          amount: delta,
          hint: "Recurring/custom fees on this platform.",
        },
      ];
    }
    return [];
  }

  if (weekBreakdown.isLoading) {
    return [{ kind: "loading", label: "Loading fee breakdown…", amount: 0 }];
  }

  if (weekBreakdown.items.length > 0) {
    let recurringHintShown = false;
    return weekBreakdown.items.map((item) => {
      const isPositive = item.signedAmount > 0.02;
      let hint = formatFeeStepHint(item);
      if (
        !recurringHintShown &&
        item.source === "recurring" &&
        options.recurringAnchorHint
      ) {
        hint = hint ? `${options.recurringAnchorHint} ${hint}` : options.recurringAnchorHint;
        recurringHintShown = true;
      }
      return {
        kind: isPositive ? "positive" : "deduction",
        prefix: isPositive ? "" : "-",
        label: formatFeeStepLabel(item),
        amount: isPositive ? item.signedAmount : -Math.abs(item.signedAmount),
        hint,
      };
    });
  }

  const delta = options.fallbackDelta ?? 0;
  if (Math.abs(delta) > 0.02) {
    return [
      {
        kind: "deduction",
        prefix: "-",
        label: "Fleet fees & adjustments",
        amount: delta,
        hint: "Recurring/custom fees on this platform.",
      },
    ];
  }

  return [];
}

function payoutRentAmount(p: PayoutListItem): number {
  const n = Number(p.vehicle_rental_fee ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function findPayoutWithVehicleRent(payoutItems: PayoutListItem[]): PayoutListItem | undefined {
  if (payoutItems.length === 0) return undefined;
  const withRent = payoutItems.filter((p) => payoutRentAmount(p) > 0.02);
  if (withRent.length === 0) return undefined;
  if (withRent.length === 1) return withRent[0];

  /** Prefer fee-anchor platform when multiple legs still carry rent (legacy double-charge). */
  for (const anchor of WEEKLY_FEE_ANCHOR_PLATFORMS) {
    const hit = withRent.find((p) => (p.earnings_platform ?? "") === anchor);
    if (hit) return hit;
  }
  return withRent.reduce((best, p) =>
    payoutRentAmount(p) > payoutRentAmount(best) ? p : best,
  );
}

export function formatVehicleRentLabel(licensePlate?: string | null): string {
  const plate = licensePlate?.trim();
  return plate ? `Vehicle rent (${plate})` : "Vehicle rent";
}

export type VehicleRentLadderInput = {
  totalRent: number;
  licensePlate?: string | null;
  rentEntries?: PayoutRentEntry[];
};

export function buildVehicleRentLadderSteps(input: VehicleRentLadderInput): FeeLadderStepDef[] {
  const { totalRent, licensePlate, rentEntries = [] } = input;
  if (totalRent <= 0.02) return [];

  const entries = rentEntries.filter((e) => Math.abs(Number(e.amount) || 0) > 0.02);

  if (entries.length > 1) {
    return entries.map((e, index) => ({
      kind: "deduction" as const,
      prefix: "-" as const,
      label: `Vehicle rent — ${rentEntryTypeLabel(e.entry_type)}`,
      amount: -round2(Math.abs(Number(e.amount) || 0)),
      hint:
        e.description?.trim() ||
        (index === 0 && licensePlate?.trim()
          ? `Plate ${licensePlate.trim()}`
          : "Weekly vehicle assignment rent"),
    }));
  }

  if (entries.length === 1) {
    const entry = entries[0]!;
    return [
      {
        kind: "deduction",
        prefix: "-",
        label: `Vehicle rent — ${rentEntryTypeLabel(entry.entry_type)}`,
        amount: -round2(Math.abs(Number(entry.amount) || 0)),
        hint:
          entry.description?.trim() ||
          (licensePlate?.trim()
            ? `Plate ${licensePlate.trim()}`
            : "Weekly vehicle assignment rent"),
      },
    ];
  }

  return [
    {
      kind: "deduction",
      prefix: "-",
      label: formatVehicleRentLabel(licensePlate),
      amount: -round2(totalRent),
      hint: "Weekly vehicle assignment rent",
    },
  ];
}
