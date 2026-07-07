import type { PoolClient } from "pg";
import { roundMoney } from "./debtAllocation";

export type ConsolidatedPlatformLine = {
  payout_id: string;
  platform: string;
  net_driver_payout: string;
  raw_net_amount: string | null;
  payment_status: string;
};

export type ConsolidatedDriverPayoutRow = {
  driver_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  payment_period_start: string;
  payment_period_end: string;
  total_amount: string;
  total_gross: string;
  total_fees: string;
  total_platform_fees: string;
  total_vehicle_rent: string;
  /** Same-week negative platform raw net offset by positive platforms. */
  total_debt_offset: string;
  /** Platforms with negative raw net in this week. */
  debt_platforms: string[];
  platforms: string[];
  platform_payout_ids: string[];
  platform_lines: ConsolidatedPlatformLine[];
  /** Max remaining collectible debt across platform legs. */
  remaining_debt: string;
  /** Sum of manual debt reductions this week (forgive, cash, adjust). */
  week_debt_adjusted_total: string;
  /** Active loan remaining balance for this driver. */
  outstanding_loan_balance: string;
  /** Planned repayment week start on active loan (reminder only). */
  planned_repayment_week: string | null;
  planned_repayment_note: string | null;
  /** payable | paid | debt | hold | partial | mixed */
  consolidated_status: string;
  can_pay: boolean;
  driver_payment_id: string | null;
  paid_at: string | null;
};

type PayoutLegRow = {
  id: string;
  driver_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  platform: string;
  payment_period_start: string;
  payment_period_end: string;
  net_driver_payout: string | null;
  raw_net_amount: string | null;
  total_gross_earnings: string | null;
  company_commission: string | null;
  total_platform_fees: string | null;
  vehicle_rental_fee: string | null;
  cross_platform_debt_offset: string | null;
  week_debt_platforms: string[] | null;
  remaining_debt_amount: string | null;
  payment_status: string;
};

export function deriveConsolidatedStatus(
  total: number,
  statuses: string[],
  remainingDebt = 0,
): { consolidated_status: string; can_pay: boolean } {
  if (total < 0) {
    const rem = roundMoney(remainingDebt);
    const hasHold = statuses.some((s) => s === "hold");
    const hasDebtLeg = statuses.some((s) => s === "debt");
    if (rem <= 0.02 && hasHold && !hasDebtLeg) {
      return { consolidated_status: "hold", can_pay: false };
    }
    return { consolidated_status: "debt", can_pay: false };
  }
  const allPaid = statuses.every((s) => s === "paid" || s === "approved");
  if (allPaid) {
    return { consolidated_status: "paid", can_pay: false };
  }
  if (statuses.some((s) => s === "hold")) {
    return { consolidated_status: "hold", can_pay: false };
  }
  if (statuses.some((s) => s === "debt")) {
    return { consolidated_status: "debt", can_pay: false };
  }
  const somePaid = statuses.some((s) => s === "paid" || s === "approved");
  const allPayablePending = statuses.every((s) => s === "pending" || s === "processing");
  if (somePaid && !allPaid) {
    return { consolidated_status: "partial", can_pay: false };
  }
  if (allPayablePending && total > 0) {
    return { consolidated_status: "payable", can_pay: true };
  }
  if (total > 0 && statuses.every((s) => s !== "debt" && s !== "hold")) {
    return { consolidated_status: "payable", can_pay: true };
  }
  return { consolidated_status: "mixed", can_pay: false };
}

function buildConsolidatedRows(
  legs: PayoutLegRow[],
  payments: Map<string, { id: string; paid_at: string }>,
  adjustmentsByDriver: Map<string, number> = new Map(),
  loanBalancesByDriver: Map<string, number> = new Map(),
  plannedWeekByDriver: Map<string, string | null> = new Map(),
  plannedNoteByDriver: Map<string, string | null> = new Map(),
): ConsolidatedDriverPayoutRow[] {
  const byDriver = new Map<string, PayoutLegRow[]>();
  for (const leg of legs) {
    const key = leg.driver_id;
    const list = byDriver.get(key) ?? [];
    list.push(leg);
    byDriver.set(key, list);
  }

  const rows: ConsolidatedDriverPayoutRow[] = [];
  for (const [driverId, driverLegs] of byDriver) {
    const first = driverLegs[0]!;
    const platformLines: ConsolidatedPlatformLine[] = driverLegs.map((l) => ({
      payout_id: l.id,
      platform: l.platform,
      net_driver_payout: roundMoney(Number(l.net_driver_payout ?? "0")).toFixed(2),
      raw_net_amount: l.raw_net_amount,
      payment_status: l.payment_status,
    }));

    const total = roundMoney(
      driverLegs.reduce((sum, l) => sum + Number(l.net_driver_payout ?? "0"), 0),
    );
    const totalGross = roundMoney(
      driverLegs.reduce((sum, l) => sum + Number(l.total_gross_earnings ?? "0"), 0),
    );
    const totalFees = roundMoney(
      driverLegs.reduce((sum, l) => sum + Number(l.company_commission ?? "0"), 0),
    );
    const totalPlatformFees = roundMoney(
      driverLegs.reduce((sum, l) => sum + Number(l.total_platform_fees ?? "0"), 0),
    );
    const totalVehicleRent = roundMoney(
      driverLegs.reduce((m, l) => Math.max(m, Number(l.vehicle_rental_fee ?? "0")), 0),
    );
    const totalDebtOffset = roundMoney(
      Math.max(...driverLegs.map((l) => Number(l.cross_platform_debt_offset ?? "0")), 0),
    );
    const debtPlatforms = [
      ...new Set(driverLegs.flatMap((l) => l.week_debt_platforms ?? []).filter(Boolean)),
    ].sort();
    const remainingDebt = roundMoney(
      driverLegs.reduce((m, l) => Math.max(m, Number(l.remaining_debt_amount ?? "0")), 0),
    );
    const weekDebtAdjustedTotal = roundMoney(adjustmentsByDriver.get(driverId) ?? 0);
    const outstandingLoanBalance = roundMoney(loanBalancesByDriver.get(driverId) ?? 0);
    const plannedRepaymentWeek = plannedWeekByDriver.get(driverId) ?? null;
    const plannedRepaymentNote = plannedNoteByDriver.get(driverId) ?? null;
    const statuses = driverLegs.map((l) => l.payment_status);
    const { consolidated_status, can_pay } = deriveConsolidatedStatus(total, statuses, remainingDebt);

    const payKey = `${driverId}|${first.payment_period_start}|${first.payment_period_end}`;
    const existingPay = payments.get(payKey);

    rows.push({
      driver_id: driverId,
      first_name: first.first_name,
      last_name: first.last_name,
      phone: first.phone,
      payment_period_start: first.payment_period_start,
      payment_period_end: first.payment_period_end,
      total_amount: total.toFixed(2),
      total_gross: totalGross.toFixed(2),
      total_fees: totalFees.toFixed(2),
      total_platform_fees: totalPlatformFees.toFixed(2),
      total_vehicle_rent: totalVehicleRent.toFixed(2),
      total_debt_offset: totalDebtOffset.toFixed(2),
      debt_platforms: debtPlatforms,
      platforms: [...new Set(driverLegs.map((l) => l.platform))].sort(),
      platform_payout_ids: driverLegs.map((l) => l.id),
      platform_lines: platformLines,
      remaining_debt: remainingDebt.toFixed(2),
      week_debt_adjusted_total: weekDebtAdjustedTotal.toFixed(2),
      outstanding_loan_balance: outstandingLoanBalance.toFixed(2),
      planned_repayment_week: plannedRepaymentWeek,
      planned_repayment_note: plannedRepaymentNote,
      consolidated_status,
      can_pay,
      driver_payment_id: existingPay?.id ?? null,
      paid_at: existingPay?.paid_at ?? null,
    });
  }

  rows.sort((a, b) => {
    const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
    const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return rows;
}

export async function listConsolidatedPayouts(
  client: PoolClient,
  orgId: string,
  weekStart: string,
  weekEnd: string,
  options?: {
    q?: string;
    status?: string;
    driverId?: string;
    platform?: string;
    hasOutstandingLoan?: boolean;
  },
): Promise<ConsolidatedDriverPayoutRow[]> {
  const ps = weekStart.slice(0, 10);
  const pe = weekEnd.slice(0, 10);

  const params: unknown[] = [orgId, ps, pe];
  let p = 4;
  const extra: string[] = [];
  if (options?.driverId) {
    extra.push(`AND dp.driver_id = $${p++}::uuid`);
    params.push(options.driverId);
  }
  if (options?.q?.trim()) {
    const search = buildConsolidatedPayoutSearchClause(options.q, p);
    if (search) {
      extra.push(search.sql);
      params.push(search.param);
      p++;
    }
  }
  if (options?.platform?.trim()) {
    extra.push(`AND dp.platform = $${p++}`);
    params.push(options.platform.trim().toLowerCase());
  }

  const { rows: legs } = await client.query<PayoutLegRow>(
    `SELECT dp.id::text, dp.driver_id::text, d.first_name, d.last_name, d.phone,
            dp.platform, dp.payment_period_start::text, dp.payment_period_end::text,
            dp.net_driver_payout::text, dp.raw_net_amount::text,
            dp.total_gross_earnings::text, dp.company_commission::text,
            dp.total_platform_fees::text, dp.vehicle_rental_fee::text, dp.payment_status,
            dp.cross_platform_debt_offset::text, dp.week_debt_platforms,
            dp.remaining_debt_amount::text
     FROM driver_payouts dp
     INNER JOIN drivers d ON d.id = dp.driver_id AND d.organization_id = dp.organization_id
     WHERE dp.organization_id = $1::uuid
       AND dp.payment_period_start = $2::date
       AND dp.payment_period_end = $3::date
       AND d.subcontractor_id IS NULL
       AND dp.subcontractor_payout_id IS NULL
       ${extra.join("\n       ")}
     ORDER BY d.last_name, d.first_name, dp.platform`,
    params,
  );

  const adjExtra: string[] = [];
  const adjParams: unknown[] = [orgId, ps, pe];
  let adjP = 4;
  if (options?.driverId) {
    adjExtra.push(`AND dp.driver_id = $${adjP++}::uuid`);
    adjParams.push(options.driverId);
  }

  const { rows: adjRows } = await client.query<{ driver_id: string; week_debt_adjusted_total: string }>(
    `SELECT dp.driver_id::text,
            COALESCE(SUM(
              CASE
                WHEN pa.adjustment_type = 'carry_forward' THEN 0
                WHEN pa.applied_amount IS NOT NULL AND pa.applied_amount::numeric > 0.02
                  THEN pa.applied_amount::numeric
                WHEN pa.previous_remaining_debt IS NOT NULL AND pa.new_remaining_debt IS NOT NULL
                  THEN GREATEST(0, pa.previous_remaining_debt::numeric - pa.new_remaining_debt::numeric)
                WHEN pa.amount::numeric < -0.02 THEN ABS(pa.amount::numeric)
                ELSE 0
              END
            ), 0)::text AS week_debt_adjusted_total
     FROM payout_adjustments pa
     INNER JOIN driver_payouts dp ON dp.id = pa.payout_id AND dp.organization_id = pa.organization_id
     INNER JOIN drivers d ON d.id = dp.driver_id AND d.organization_id = dp.organization_id
     WHERE pa.organization_id = $1::uuid
       AND dp.payment_period_start = $2::date
       AND dp.payment_period_end = $3::date
       AND d.subcontractor_id IS NULL
       AND dp.subcontractor_payout_id IS NULL
       ${adjExtra.join("\n       ")}
     GROUP BY dp.driver_id`,
    adjParams,
  );
  const adjustmentsByDriver = new Map<string, number>();
  for (const ar of adjRows) {
    adjustmentsByDriver.set(ar.driver_id, roundMoney(Number(ar.week_debt_adjusted_total)));
  }

  const driverIdsInWeek = [...new Set(legs.map((l) => l.driver_id))];
  const loanBalancesByDriver = new Map<string, number>();
  const plannedWeekByDriver = new Map<string, string | null>();
  const plannedNoteByDriver = new Map<string, string | null>();

  if (driverIdsInWeek.length > 0) {
    const { rows: loanRows } = await client.query<{
      driver_id: string;
      remaining_balance: string;
      planned_repayment_week: string | null;
      planned_repayment_note: string | null;
    }>(
      `SELECT driver_id::text, remaining_balance::text, planned_repayment_week::text,
              planned_repayment_note
       FROM driver_loans
       WHERE organization_id = $1::uuid
         AND status = 'active'
         AND driver_id = ANY($2::uuid[])`,
      [orgId, driverIdsInWeek],
    );
    for (const lr of loanRows) {
      loanBalancesByDriver.set(lr.driver_id, roundMoney(Number(lr.remaining_balance)));
      plannedWeekByDriver.set(lr.driver_id, lr.planned_repayment_week?.slice(0, 10) ?? null);
      plannedNoteByDriver.set(lr.driver_id, lr.planned_repayment_note ?? null);
    }
  }

  const { rows: payRows } = await client.query<{ id: string; driver_id: string; paid_at: string }>(
    `SELECT id::text, driver_id::text, paid_at::text
     FROM driver_payments
     WHERE organization_id = $1::uuid
       AND payment_period_start = $2::date
       AND payment_period_end = $3::date`,
    [orgId, ps, pe],
  );
  const payments = new Map<string, { id: string; paid_at: string }>();
  for (const pr of payRows) {
    payments.set(`${pr.driver_id}|${ps}|${pe}`, { id: pr.id, paid_at: pr.paid_at });
  }

  let consolidated = buildConsolidatedRows(
    legs,
    payments,
    adjustmentsByDriver,
    loanBalancesByDriver,
    plannedWeekByDriver,
    plannedNoteByDriver,
  );

  if (options?.status?.trim()) {
    const filter = options.status.trim().toLowerCase();
    consolidated = consolidated.filter((r) => r.consolidated_status === filter);
  }

  if (options?.hasOutstandingLoan) {
    consolidated = consolidated.filter((r) => hasOutstandingLoanBalance(r));
  }

  return consolidated;
}

export function hasOutstandingLoanBalance(row: {
  outstanding_loan_balance: string;
}): boolean {
  return Number(row.outstanding_loan_balance) > 0;
}

/** Builds the driver search WHERE fragment for consolidated payout listing (param index starts at 4). */
export function buildConsolidatedPayoutSearchClause(
  q: string,
  paramIndex: number,
): { sql: string; param: string } | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  const p = `$${paramIndex}`;
  return {
    sql: `AND (
      d.first_name ILIKE ${p}
      OR d.last_name ILIKE ${p}
      OR d.phone ILIKE ${p}
      OR CONCAT(d.first_name, ' ', d.last_name) ILIKE ${p}
      OR dp.platform_id ILIKE ${p}
      OR dp.id::text ILIKE ${p}
      OR d.uber_driver_id ILIKE ${p}
      OR d.bolt_driver_id ILIKE ${p}
      OR d.glovo_courier_id ILIKE ${p}
      OR d.bolt_courier_id ILIKE ${p}
      OR d.bolt_taxi_driver_uuid::text ILIKE ${p}
      OR d.wolt_courier_id ILIKE ${p}
      OR COALESCE(dp.vehicle_rental_fee::text, '') ILIKE ${p}
    )`,
    param: `%${trimmed}%`,
  };
}

export type PayDriverResult = {
  driverId: string;
  totalAmount: number;
  platforms: string[];
  platformPayoutIds: string[];
  driverPaymentId: string;
  updatedPayoutRows: number;
};

export async function payDriverConsolidated(
  client: PoolClient,
  orgId: string,
  userId: string,
  driverId: string,
  weekStart: string,
  weekEnd: string,
  options?: { paymentMethod?: string | null; transactionRef?: string | null },
): Promise<PayDriverResult> {
  const ps = weekStart.slice(0, 10);
  const pe = weekEnd.slice(0, 10);

  const { rows: legs } = await client.query<PayoutLegRow>(
    `SELECT dp.id::text, dp.driver_id::text, d.first_name, d.last_name, d.phone,
            dp.platform, dp.payment_period_start::text, dp.payment_period_end::text,
            dp.net_driver_payout::text, dp.raw_net_amount::text,
            dp.total_gross_earnings::text, dp.company_commission::text,
            dp.total_platform_fees::text, dp.vehicle_rental_fee::text, dp.payment_status,
            dp.cross_platform_debt_offset::text, dp.week_debt_platforms,
            dp.remaining_debt_amount::text
     FROM driver_payouts dp
     INNER JOIN drivers d ON d.id = dp.driver_id AND d.organization_id = dp.organization_id
     WHERE dp.organization_id = $1::uuid
       AND dp.driver_id = $2::uuid
       AND dp.payment_period_start = $3::date
       AND dp.payment_period_end = $4::date
       AND d.subcontractor_id IS NULL
       AND dp.subcontractor_payout_id IS NULL
     FOR UPDATE OF dp`,
    [orgId, driverId, ps, pe],
  );

  if (legs.length === 0) {
    throw new ConsolidatedPayoutError("No payouts found for this driver and week", "NOT_FOUND");
  }

  const consolidated = buildConsolidatedRows(legs, new Map())[0];
  if (!consolidated) {
    throw new ConsolidatedPayoutError("No payouts found for this driver and week", "NOT_FOUND");
  }
  if (!consolidated.can_pay) {
    const msg =
      consolidated.consolidated_status === "debt"
        ? "Cannot pay: consolidated total is debt (negative)."
        : consolidated.consolidated_status === "paid"
          ? "Driver already paid for this week."
          : `Cannot pay: status is ${consolidated.consolidated_status}.`;
    throw new ConsolidatedPayoutError(msg, "NOT_PAYABLE");
  }

  const payoutIds = consolidated.platform_payout_ids;
  const totalAmount = roundMoney(Number(consolidated.total_amount));
  const paymentDate = new Date().toISOString().slice(0, 10);

  const updateRes = await client.query<{ id: string }>(
    `UPDATE driver_payouts dp
     SET payment_status = 'paid',
         payment_date = $3::date,
         payment_method = COALESCE($4, payment_method),
         transaction_ref = COALESCE($5, transaction_ref),
         updated_at = NOW()
     FROM drivers d
     WHERE dp.id = ANY($6::uuid[])
       AND dp.organization_id = $1::uuid
       AND dp.driver_id = $2::uuid
       AND d.id = dp.driver_id
       AND d.subcontractor_id IS NULL
       AND dp.subcontractor_payout_id IS NULL
       AND dp.payment_status IN ('pending', 'processing')
     RETURNING dp.id::text`,
    [orgId, driverId, paymentDate, options?.paymentMethod ?? null, options?.transactionRef ?? null, payoutIds],
  );

  if ((updateRes.rowCount ?? 0) === 0) {
    throw new ConsolidatedPayoutError("No pending platform payouts could be marked paid", "NOT_PAYABLE");
  }

  const payIns = await client.query<{ id: string }>(
    `INSERT INTO driver_payments (
       organization_id, driver_id, payment_period_start, payment_period_end,
       total_amount, total_debt_offset, debt_platforms, platforms, platform_payout_ids, payment_status,
       payment_method, transaction_ref, paid_by
     ) VALUES ($1::uuid, $2::uuid, $3::date, $4::date, $5, $6, $7::text[], $8::text[], $9::uuid[], 'paid', $10, $11, $12::uuid)
     ON CONFLICT ON CONSTRAINT uq_driver_payment_driver_week
     DO UPDATE SET
       total_amount = EXCLUDED.total_amount,
       total_debt_offset = EXCLUDED.total_debt_offset,
       debt_platforms = EXCLUDED.debt_platforms,
       platforms = EXCLUDED.platforms,
       platform_payout_ids = EXCLUDED.platform_payout_ids,
       payment_status = 'paid',
       payment_method = COALESCE(EXCLUDED.payment_method, driver_payments.payment_method),
       transaction_ref = COALESCE(EXCLUDED.transaction_ref, driver_payments.transaction_ref),
       paid_at = NOW(),
       paid_by = EXCLUDED.paid_by
     RETURNING id::text`,
    [
      orgId,
      driverId,
      ps,
      pe,
      totalAmount,
      roundMoney(Number(consolidated.total_debt_offset)),
      consolidated.debt_platforms,
      consolidated.platforms,
      payoutIds,
      options?.paymentMethod ?? null,
      options?.transactionRef ?? null,
      userId,
    ],
  );

  return {
    driverId,
    totalAmount,
    platforms: consolidated.platforms,
    platformPayoutIds: payoutIds,
    driverPaymentId: payIns.rows[0]?.id ?? "",
    updatedPayoutRows: updateRes.rowCount ?? 0,
  };
}

export type PayAllResult = {
  driversPaid: number;
  totalAmount: number;
  skipped: number;
};

export async function payAllConsolidated(
  client: PoolClient,
  orgId: string,
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<PayAllResult> {
  const rows = await listConsolidatedPayouts(client, orgId, weekStart, weekEnd);
  const payable = rows.filter((r) => r.can_pay);

  let driversPaid = 0;
  let totalAmount = 0;
  for (const row of payable) {
    const result = await payDriverConsolidated(client, orgId, userId, row.driver_id, weekStart, weekEnd);
    driversPaid += 1;
    totalAmount = roundMoney(totalAmount + result.totalAmount);
  }

  return {
    driversPaid,
    totalAmount,
    skipped: rows.length - payable.length,
  };
}

export class ConsolidatedPayoutError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "NOT_PAYABLE" | "INVALID_WEEK",
  ) {
    super(message);
    this.name = "ConsolidatedPayoutError";
  }
}
