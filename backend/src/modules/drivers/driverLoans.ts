import type { PoolClient } from "pg";
import { roundMoney } from "../earnings/debtAllocation";
import { recomputeDriverPayoutAfterCustomFees } from "../earnings/driverPayoutCustomFees";
import { selectWeeklyFeeAnchorPayoutId } from "../earnings/driverWeeklyFees";
import { isFrozenPayoutStatus } from "../earnings/payoutFreeze";

export type DriverLoanStatus = "active" | "paid" | "written_off";
export type LoanRepaymentType = "from_payout" | "cash" | "forgive";

export type DriverLoanRow = {
  id: string;
  organization_id: string;
  driver_id: string;
  principal: string;
  remaining_balance: string;
  status: DriverLoanStatus;
  disbursed_at: string;
  reference: string | null;
  notes: string | null;
  planned_repayment_week: string | null;
  planned_repayment_note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DriverLoanRepaymentRow = {
  id: string;
  loan_id: string;
  repayment_type: LoanRepaymentType;
  amount: string;
  balance_before: string;
  balance_after: string;
  driver_payout_id: string | null;
  payment_period_start: string | null;
  payment_period_end: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type DriverLoanWithRepayments = DriverLoanRow & {
  repayments: DriverLoanRepaymentRow[];
};

function mapLoanRow(row: DriverLoanRow): DriverLoanRow {
  return {
    ...row,
    principal: roundMoney(Number(row.principal)).toFixed(2),
    remaining_balance: roundMoney(Number(row.remaining_balance)).toFixed(2),
    disbursed_at: row.disbursed_at.slice(0, 10),
    planned_repayment_week: row.planned_repayment_week?.slice(0, 10) ?? null,
  };
}

function mapRepaymentRow(row: DriverLoanRepaymentRow): DriverLoanRepaymentRow {
  return {
    ...row,
    amount: roundMoney(Number(row.amount)).toFixed(2),
    balance_before: roundMoney(Number(row.balance_before)).toFixed(2),
    balance_after: roundMoney(Number(row.balance_after)).toFixed(2),
    payment_period_start: row.payment_period_start?.slice(0, 10) ?? null,
    payment_period_end: row.payment_period_end?.slice(0, 10) ?? null,
  };
}

const LOAN_SELECT = `id::text, organization_id::text, driver_id::text,
  principal::text, remaining_balance::text, status,
  disbursed_at::text, reference, notes,
  planned_repayment_week::text, planned_repayment_note,
  created_by::text, created_at::text, updated_at::text`;

const REPAYMENT_SELECT = `id::text, loan_id::text, repayment_type,
  amount::text, balance_before::text, balance_after::text,
  driver_payout_id::text, payment_period_start::text, payment_period_end::text,
  notes, created_by::text, created_at::text`;

export async function listDriverLoans(
  client: PoolClient,
  orgId: string,
  driverId: string,
): Promise<DriverLoanWithRepayments[]> {
  const { rows: loans } = await client.query<DriverLoanRow>(
    `SELECT ${LOAN_SELECT}
     FROM driver_loans
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
     ORDER BY created_at DESC`,
    [orgId, driverId],
  );

  const result: DriverLoanWithRepayments[] = [];
  for (const loan of loans) {
    const { rows: repayments } = await client.query<DriverLoanRepaymentRow>(
      `SELECT ${REPAYMENT_SELECT}
       FROM driver_loan_repayments
       WHERE loan_id = $1::uuid AND organization_id = $2::uuid
       ORDER BY created_at ASC, id ASC`,
      [loan.id, orgId],
    );
    result.push({
      ...mapLoanRow(loan),
      repayments: repayments.map(mapRepaymentRow),
    });
  }
  return result;
}

export async function getActiveDriverLoan(
  client: PoolClient,
  orgId: string,
  driverId: string,
): Promise<DriverLoanWithRepayments | null> {
  const { rows } = await client.query<DriverLoanRow>(
    `SELECT ${LOAN_SELECT}
     FROM driver_loans
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1`,
    [orgId, driverId],
  );
  const loan = rows[0];
  if (!loan) return null;

  const { rows: repayments } = await client.query<DriverLoanRepaymentRow>(
    `SELECT ${REPAYMENT_SELECT}
     FROM driver_loan_repayments
     WHERE loan_id = $1::uuid AND organization_id = $2::uuid
     ORDER BY created_at ASC, id ASC`,
    [loan.id, orgId],
  );

  return {
    ...mapLoanRow(loan),
    repayments: repayments.map(mapRepaymentRow),
  };
}

export async function getOutstandingLoanBalance(
  client: PoolClient,
  orgId: string,
  driverId: string,
): Promise<number> {
  const { rows } = await client.query<{ balance: string }>(
    `SELECT COALESCE(remaining_balance, 0)::text AS balance
     FROM driver_loans
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid AND status = 'active'
     LIMIT 1`,
    [orgId, driverId],
  );
  return roundMoney(Number(rows[0]?.balance ?? "0"));
}

export type CreateDriverLoanInput = {
  principal: number;
  disbursed_at?: string;
  reference?: string | null;
  notes?: string | null;
  planned_repayment_week?: string | null;
  planned_repayment_note?: string | null;
};

export async function createDriverLoan(
  client: PoolClient,
  orgId: string,
  driverId: string,
  userId: string,
  input: CreateDriverLoanInput,
): Promise<DriverLoanRow> {
  const principal = roundMoney(input.principal);
  if (principal <= 0) {
    throw new LoanError("principal must be greater than zero", 400);
  }

  const existing = await getActiveDriverLoan(client, orgId, driverId);
  if (existing && Number(existing.remaining_balance) > 0.02) {
    throw new LoanError("Driver already has an active loan", 409);
  }

  const disbursedAt = input.disbursed_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  const { rows } = await client.query<DriverLoanRow>(
    `INSERT INTO driver_loans (
       organization_id, driver_id, principal, remaining_balance, status,
       disbursed_at, reference, notes,
       planned_repayment_week, planned_repayment_note, created_by
     ) VALUES (
       $1::uuid, $2::uuid, $3, $3, 'active',
       $4::date, $5, $6,
       $7::date, $8, $9::uuid
     )
     RETURNING ${LOAN_SELECT}`,
    [
      orgId,
      driverId,
      principal,
      disbursedAt,
      input.reference?.trim() || null,
      input.notes?.trim() || null,
      input.planned_repayment_week?.slice(0, 10) || null,
      input.planned_repayment_note?.trim() || null,
      userId,
    ],
  );
  const row = rows[0];
  if (!row) throw new LoanError("Failed to create loan", 500);
  return mapLoanRow(row);
}

export type UpdateLoanPlanInput = {
  planned_repayment_week?: string | null;
  planned_repayment_note?: string | null;
};

export async function updateLoanPlan(
  client: PoolClient,
  orgId: string,
  driverId: string,
  loanId: string,
  input: UpdateLoanPlanInput,
): Promise<DriverLoanRow> {
  const sets: string[] = ["updated_at = NOW()"];
  const params: unknown[] = [loanId, orgId, driverId];
  let p = 4;

  if (input.planned_repayment_week !== undefined) {
    sets.push(`planned_repayment_week = $${p++}::date`);
    params.push(input.planned_repayment_week?.slice(0, 10) ?? null);
  }
  if (input.planned_repayment_note !== undefined) {
    sets.push(`planned_repayment_note = $${p++}`);
    params.push(input.planned_repayment_note?.trim() || null);
  }

  const { rows } = await client.query<DriverLoanRow>(
    `UPDATE driver_loans
     SET ${sets.join(", ")}
     WHERE id = $1::uuid AND organization_id = $2::uuid AND driver_id = $3::uuid
     RETURNING ${LOAN_SELECT}`,
    params,
  );
  const row = rows[0];
  if (!row) throw new LoanError("Loan not found", 404);
  return mapLoanRow(row);
}

export class LoanError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "LoanError";
  }
}

type ApplyRepaymentResult = {
  repayment: DriverLoanRepaymentRow;
  loan: DriverLoanRow;
};

async function lockActiveLoan(
  client: PoolClient,
  orgId: string,
  driverId: string,
  loanId?: string,
): Promise<DriverLoanRow> {
  const { rows } = await client.query<DriverLoanRow>(
    loanId
      ? `SELECT ${LOAN_SELECT}
         FROM driver_loans
         WHERE id = $1::uuid AND organization_id = $2::uuid AND driver_id = $3::uuid
         FOR UPDATE`
      : `SELECT ${LOAN_SELECT}
         FROM driver_loans
         WHERE organization_id = $1::uuid AND driver_id = $2::uuid AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1
         FOR UPDATE`,
    loanId ? [loanId, orgId, driverId] : [orgId, driverId],
  );
  const loan = rows[0];
  if (!loan) throw new LoanError("Active loan not found", 404);
  if (loan.status !== "active") throw new LoanError("Loan is not active", 400);
  return loan;
}

export function resolveRepaymentStatus(
  repaymentType: LoanRepaymentType,
  balanceAfter: number,
  isFullForgive: boolean,
): DriverLoanStatus {
  if (balanceAfter > 0.02) return "active";
  if (repaymentType === "forgive" && isFullForgive) return "written_off";
  return "paid";
}

async function applyLoanRepayment(
  client: PoolClient,
  orgId: string,
  driverId: string,
  loan: DriverLoanRow,
  repaymentType: LoanRepaymentType,
  amount: number,
  userId: string,
  opts?: {
    driverPayoutId?: string | null;
    periodStart?: string | null;
    periodEnd?: string | null;
    notes?: string | null;
    loanRepaymentIdForAdjustment?: string;
  },
): Promise<ApplyRepaymentResult> {
  const balanceBefore = roundMoney(Number(loan.remaining_balance));
  if (balanceBefore <= 0.02) {
    throw new LoanError("Loan is already fully repaid", 400);
  }
  const repayAmount = roundMoney(amount);
  if (repayAmount <= 0) {
    throw new LoanError("amount must be greater than zero", 400);
  }
  if (repayAmount > balanceBefore + 0.02) {
    throw new LoanError(`Amount cannot exceed remaining balance (${balanceBefore.toFixed(2)})`, 400);
  }

  const balanceAfter = roundMoney(balanceBefore - repayAmount);
  const isFullForgive = repaymentType === "forgive" && balanceAfter <= 0.02;
  const newStatus = resolveRepaymentStatus(repaymentType, balanceAfter, isFullForgive);

  const ins = await client.query<DriverLoanRepaymentRow>(
    `INSERT INTO driver_loan_repayments (
       organization_id, loan_id, repayment_type, amount,
       balance_before, balance_after,
       driver_payout_id, payment_period_start, payment_period_end,
       notes, created_by
     ) VALUES (
       $1::uuid, $2::uuid, $3, $4,
       $5, $6,
       $7::uuid, $8::date, $9::date,
       $10, $11::uuid
     )
     RETURNING ${REPAYMENT_SELECT}`,
    [
      orgId,
      loan.id,
      repaymentType,
      repayAmount,
      balanceBefore,
      balanceAfter,
      opts?.driverPayoutId ?? null,
      opts?.periodStart?.slice(0, 10) ?? null,
      opts?.periodEnd?.slice(0, 10) ?? null,
      opts?.notes?.trim() || null,
      userId,
    ],
  );
  const repayment = ins.rows[0];
  if (!repayment) throw new LoanError("Failed to record repayment", 500);

  if (repaymentType === "from_payout" && opts?.driverPayoutId) {
    await client.query(
      `INSERT INTO driver_payout_adjustments (
         driver_payout_id, organization_id, fee_name, fee_type, amount,
         source, loan_repayment_id, notes, created_by
       ) VALUES ($1::uuid, $2::uuid, 'Loan repayment', 'deduction', $3, 'loan', $4::uuid, $5, $6::uuid)`,
      [
        opts.driverPayoutId,
        orgId,
        repayAmount,
        repayment.id,
        opts.notes?.trim() || null,
        userId,
      ],
    );
  }

  const { rows: updatedLoans } = await client.query<DriverLoanRow>(
    `UPDATE driver_loans
     SET remaining_balance = $1, status = $2, updated_at = NOW()
     WHERE id = $3::uuid AND organization_id = $4::uuid
     RETURNING ${LOAN_SELECT}`,
    [balanceAfter, newStatus, loan.id, orgId],
  );
  const updatedLoan = updatedLoans[0];
  if (!updatedLoan) throw new LoanError("Failed to update loan", 500);

  return {
    repayment: mapRepaymentRow(repayment),
    loan: mapLoanRow(updatedLoan),
  };
}

export type RecordCashOrForgiveInput = {
  type: "cash" | "forgive";
  amount?: number;
  settle_full?: boolean;
  notes?: string | null;
};

export async function recordCashOrForgiveRepayment(
  client: PoolClient,
  orgId: string,
  driverId: string,
  loanId: string,
  userId: string,
  input: RecordCashOrForgiveInput,
): Promise<ApplyRepaymentResult> {
  const loan = await lockActiveLoan(client, orgId, driverId, loanId);
  const remaining = roundMoney(Number(loan.remaining_balance));
  let amount: number;
  if (input.settle_full) {
    amount = remaining;
  } else {
    const amountNum = Number(input.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      throw new LoanError("amount must be a positive number", 400);
    }
    amount = roundMoney(amountNum);
  }

  return applyLoanRepayment(client, orgId, driverId, loan, input.type, amount, userId, {
    notes: input.notes,
  });
}

export type RecordFromPayoutInput = {
  payment_period_start: string;
  payment_period_end: string;
  amount?: number;
  settle_full?: boolean;
  notes?: string | null;
};

export async function recordLoanRepaymentFromPayout(
  client: PoolClient,
  orgId: string,
  driverId: string,
  userId: string,
  input: RecordFromPayoutInput,
): Promise<ApplyRepaymentResult> {
  const ps = input.payment_period_start.slice(0, 10);
  const pe = input.payment_period_end.slice(0, 10);

  const loan = await lockActiveLoan(client, orgId, driverId);
  const remaining = roundMoney(Number(loan.remaining_balance));
  if (remaining <= 0.02) {
    throw new LoanError("Loan is already fully repaid", 400);
  }

  const anchorPayoutId = await selectWeeklyFeeAnchorPayoutId(client, orgId, driverId, ps, pe);
  if (!anchorPayoutId) {
    throw new LoanError("No payout found for this payment week", 404);
  }

  const pr = await client.query<{ payment_status: string; raw_net_amount: string | null }>(
    `SELECT payment_status, raw_net_amount::text
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid AND driver_id = $3::uuid
     FOR UPDATE`,
    [anchorPayoutId, orgId, driverId],
  );
  const payoutRow = pr.rows[0];
  if (!payoutRow) {
    throw new LoanError("Anchor payout not found for this week", 404);
  }
  if (isFrozenPayoutStatus(payoutRow.payment_status)) {
    throw new LoanError("Cannot apply loan repayment to a paid or approved payout", 400);
  }

  const availableNet = roundMoney(Number(payoutRow.raw_net_amount ?? "0"));
  if (availableNet <= 0.02) {
    throw new LoanError("No positive net payout available this week for loan repayment", 400);
  }

  let requestedAmount: number;
  if (input.settle_full) {
    requestedAmount = remaining;
  } else {
    const amountNum = Number(input.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      throw new LoanError("amount must be a positive number", 400);
    }
    requestedAmount = roundMoney(amountNum);
  }

  const repayAmount = roundMoney(Math.min(requestedAmount, remaining, availableNet));
  if (repayAmount <= 0.02) {
    throw new LoanError("Repayment amount must be greater than zero after capping to available net", 400);
  }

  const result = await applyLoanRepayment(
    client,
    orgId,
    driverId,
    loan,
    "from_payout",
    repayAmount,
    userId,
    {
      driverPayoutId: anchorPayoutId,
      periodStart: ps,
      periodEnd: pe,
      notes: input.notes,
    },
  );

  await recomputeDriverPayoutAfterCustomFees(client, orgId, anchorPayoutId);

  return result;
}

export type WeekLoanRepaymentItem = {
  id: string;
  repayment_type: LoanRepaymentType;
  amount: string;
  balance_before: string;
  balance_after: string;
  driver_payout_id: string | null;
  notes: string | null;
  created_at: string;
  loan_id: string;
  loan_reference: string | null;
};

export async function listLoanRepaymentsForDriverWeek(
  client: PoolClient,
  orgId: string,
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<WeekLoanRepaymentItem[]> {
  const ps = periodStart.slice(0, 10);
  const pe = periodEnd.slice(0, 10);

  const { rows } = await client.query<WeekLoanRepaymentItem & { loan_reference: string | null }>(
    `SELECT r.id::text, r.repayment_type, r.amount::text, r.balance_before::text, r.balance_after::text,
            r.driver_payout_id::text, r.notes, r.created_at::text,
            r.loan_id::text, l.reference AS loan_reference
     FROM driver_loan_repayments r
     INNER JOIN driver_loans l ON l.id = r.loan_id AND l.organization_id = r.organization_id
     WHERE r.organization_id = $1::uuid
       AND l.driver_id = $2::uuid
       AND r.payment_period_start = $3::date
       AND r.payment_period_end = $4::date
     ORDER BY r.created_at ASC, r.id ASC`,
    [orgId, driverId, ps, pe],
  );

  return rows.map((r) => ({
    ...r,
    amount: roundMoney(Number(r.amount)).toFixed(2),
    balance_before: roundMoney(Number(r.balance_before)).toFixed(2),
    balance_after: roundMoney(Number(r.balance_after)).toFixed(2),
  }));
}

export async function listOutstandingLoanBalancesByDriver(
  client: PoolClient,
  orgId: string,
  driverIds?: string[],
): Promise<Map<string, number>> {
  const params: unknown[] = [orgId];
  let filter = "";
  if (driverIds?.length) {
    filter = "AND driver_id = ANY($2::uuid[])";
    params.push(driverIds);
  }

  const { rows } = await client.query<{ driver_id: string; balance: string }>(
    `SELECT driver_id::text, COALESCE(SUM(remaining_balance), 0)::text AS balance
     FROM driver_loans
     WHERE organization_id = $1::uuid AND status = 'active'
     ${filter}
     GROUP BY driver_id`,
    params,
  );

  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.driver_id, roundMoney(Number(r.balance)));
  }
  return map;
}

export type OrgLoansSummary = {
  totalDisbursed: number;
  totalOutstanding: number;
  driversWithActiveLoans: number;
};

export async function getOrgLoansSummary(
  client: PoolClient,
  orgId: string,
): Promise<OrgLoansSummary> {
  const { rows } = await client.query<{
    total_disbursed: string;
    total_outstanding: string;
    drivers_with_active_loans: string;
  }>(
    `SELECT
       COALESCE(SUM(principal), 0)::text AS total_disbursed,
       COALESCE(SUM(remaining_balance) FILTER (
         WHERE status = 'active' AND remaining_balance > 0
       ), 0)::text AS total_outstanding,
       COUNT(DISTINCT driver_id) FILTER (
         WHERE status = 'active' AND remaining_balance > 0
       )::text AS drivers_with_active_loans
     FROM driver_loans
     WHERE organization_id = $1::uuid`,
    [orgId],
  );

  const row = rows[0];
  return {
    totalDisbursed: roundMoney(Number(row?.total_disbursed ?? 0)),
    totalOutstanding: roundMoney(Number(row?.total_outstanding ?? 0)),
    driversWithActiveLoans: parseInt(row?.drivers_with_active_loans ?? "0", 10),
  };
}
