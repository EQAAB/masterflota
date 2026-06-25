import { api } from "../lib/api";

export interface EarningsOverviewResponse {
  kpis: {
    pendingPaymentsTotal: number;
    totalEarningsLast30Days: number;
    avgPayoutPaidLast90Days: number;
  };
  monthly: { month: string; totalEarnings: number; totalCommission: number }[];
}

export interface PayoutIntegrityRow {
  id: string;
  driver_id: string;
  trip_date: string;
  platform: string;
  net_earnings: string | null;
  driver_payout: string | null;
  company_commission: string | null;
  commission_base?: string | null;
  total_transfer_earnings: string | null;
  account_opening_fee: string | null;
  vehicle_rental_fee: string | null;
  vehicle_rental_id: string | null;
  expected_payout: string | null;
  ok: boolean;
}

export interface EarningsImportListItem {
  id: string;
  file_name: string | null;
  import_date: string;
  week_start: string;
  week_end: string;
  platform: string;
  record_count: number | null;
  total_rows?: number | null;
  processed_rows?: number | null;
  status: string;
  created_at: string;
  reverted_at?: string | null;
  reverted_by?: string | null;
}

export interface RevertEarningsImportResponse {
  importId: string;
  reversalRowCount: number;
  driversRecalculated: number;
}

export interface EarningsImportsResponse {
  items: EarningsImportListItem[];
  page: number;
  pageSize: number;
  total: number;
}

/** Payroll vehicle rent line items (synced on weekly earnings commit). */
export interface PayoutRentEntry {
  id: string;
  vehicle_rental_id: string | null;
  entry_type: "current_week" | "overdue" | "adjustment";
  amount: string;
  description: string | null;
}

export interface PayoutListItem {
  id: string;
  driver_id: string;
  platform_id: string | null;
  /** Earnings provider code from `earnings_records.platform` (e.g. uber, glovo). */
  earnings_platform?: string | null;
  driver_name?: string;
  payment_period_start: string;
  payment_period_end: string;
  period_start_label?: string;
  period_end_label?: string;
  net_driver_payout: string | null;
  raw_net_amount: string | null;
  debt_amount: string | null;
  debt_applied_amount: string | null;
  remaining_debt_amount: string | null;
  vehicle_rental_fee: string | null;
  rent_entries?: PayoutRentEntry[] | null;
  payment_status: string;
  payment_date: string | null;
  hold_reason?: string | null;
  hold_released_at?: string | null;
  hold_notes?: string | null;
  hold_released_by_name?: string | null;
  total_gross_earnings: string | null;
  /** Period sum of base earnings (income), excluding tips. */
  income: string | null;
  /** Period sum of tips. */
  tips: string | null;
  total_platform_fees: string | null;
  total_daily_cash: string | null;
  account_opening_fee: string | null;
  /** Glovo ladder: income + tips (period sum). */
  gross_income: string | null;
  /** Glovo ladder: gross_income − taxa (period sum). */
  net_income: string | null;
  /** Fleet commission (your cut). */
  company_commission: string | null;
  /** Subcontractor cut when driver is sub-managed. */
  commission_base: string | null;
  /** Fleet rate as decimal fraction (e.g. 0.2 for 20%). */
  commission_rate: string | null;
  commission_base_type: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  subcontractor_id?: string | null;
  subcontractor_payout_id?: string | null;
  subcontractor_legal_name?: string | null;
}

export interface EarningsPayoutsResponse {
  items: PayoutListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface EarningsReportRow {
  id: string;
  driver_id: string;
  driver_name: string;
  platform_id: string | null;
  payment_period_start: string;
  payment_period_end: string;
  period_start_label: string;
  period_end_label: string;
  total_gross_earnings: string | null;
  income: string | null;
  tips: string | null;
  total_platform_fees: string | null;
  total_daily_cash: string | null;
  account_opening_fee: string | null;
  gross_income: string | null;
  net_income: string | null;
  /** Fleet commission (single). */
  company_commission: string | null;
  commission_base: string | null;
  commission_rate: string | null;
  commission_base_type: string | null;
  vehicle_rental_fee: string | null;
  rent_entries?: PayoutRentEntry[] | null;
  net_driver_payout: string | null;
  raw_net_amount: string | null;
  debt_amount: string | null;
  debt_applied_amount: string | null;
  remaining_debt_amount: string | null;
  payment_status: string;
  payment_date: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export interface EarningsReportSummary {
  rowCount: number;
  totalNetPayout: number;
  totalVehicleRental: number;
  totalRevenue: number;
  totalDebt: number;
  /** Sum of period company_commission (same as total fleet commission for the report). */
  totalCommissionLegs: number;
  /** Sum of company_commission charged. */
  totalCompanyCommission: number;
}

export interface EarningsReportsResponse {
  items: EarningsReportRow[];
  summary: EarningsReportSummary;
  truncated: boolean;
  limit: number;
}

export interface CommissionByBaseTypeRow {
  commission_base_type: string;
  payoutCount: number;
  totalCompanyCommission: number;
  totalCommissionBase: number;
  avgCommissionRate: number;
}

export interface PayoutAssignmentDetail {
  payout_id: string;
  driver_id: string;
  vehicle_rental_fee: string | null;
  remaining_debt_amount?: string | null;
  has_vehicle_assigned: boolean;
  license_plate: string | null;
  weekly_rent: string | null;
}

/** @deprecated Use PayoutAssignmentDetail */
export type PayoutProrationDetail = PayoutAssignmentDetail;

export function getEarningsOverview() {
  return api.get<EarningsOverviewResponse>("/earnings/overview");
}

export function getPayoutIntegrityRows() {
  return api.get<PayoutIntegrityRow[]>("/earnings/records/payout-integrity");
}

export function getEarningsImports(page = 1, pageSize = 20) {
  return api.get<EarningsImportsResponse>("/earnings/imports", { params: { page, pageSize } });
}

export function revertEarningsImport(importId: string) {
  return api.post<RevertEarningsImportResponse>(`/earnings/imports/${importId}/revert`);
}

export function deleteEarningsImport(importId: string) {
  return api.delete(`/earnings/imports/${importId}`);
}

/** Committed earnings rows for an import (0 = safe to hard-delete). */
export function importProcessedRows(row: EarningsImportListItem): number {
  return row.processed_rows ?? row.record_count ?? 0;
}

export function importTotalRows(row: EarningsImportListItem): number {
  return row.total_rows ?? row.record_count ?? 0;
}

export interface ConsolidatedPlatformLine {
  payout_id: string;
  platform: string;
  net_driver_payout: string;
  raw_net_amount: string | null;
  payment_status: string;
}

export interface ConsolidatedDriverPayout {
  driver_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  payment_period_start: string;
  payment_period_end: string;
  total_amount: string;
  total_gross: string;
  total_fees: string;
  /** Sum of platform fees (Taxa) across linked platform payouts. */
  total_platform_fees?: string;
  /** Vehicle rent charged once for the driver week (max across legs). */
  total_vehicle_rent?: string;
  /** Same-week negative platform raw net offset by positive platforms. */
  total_debt_offset?: string;
  /** Platforms with negative raw net in this week. */
  debt_platforms?: string[];
  platforms: string[];
  platform_payout_ids: string[];
  platform_lines: ConsolidatedPlatformLine[];
  /** Max remaining collectible debt across platform legs. */
  remaining_debt?: string;
  /** Sum of manual debt reductions this week. */
  week_debt_adjusted_total?: string;
  consolidated_status: string;
  can_pay: boolean;
  driver_payment_id: string | null;
  paid_at: string | null;
}

export interface ConsolidatedPayoutsResponse {
  weekStart: string;
  weekEnd: string;
  items: ConsolidatedDriverPayout[];
  summary: {
    driver_count: number;
    total_amount: string;
    payable_count: number;
    paid_count: number;
    debt_count: number;
  };
}

export function getConsolidatedPayouts(params: {
  weekStart: string;
  weekEnd: string;
  q?: string;
  status?: string;
  driverId?: string;
  platform?: string;
}) {
  return api.get<ConsolidatedPayoutsResponse>("/earnings/payouts/consolidated", { params });
}

export function postPayDriverConsolidated(body: {
  driverId: string;
  weekStart: string;
  weekEnd: string;
  paymentMethod?: string;
  transactionRef?: string;
}) {
  return api.post<{
    driverId: string;
    totalAmount: number;
    platforms: string[];
    platformPayoutIds: string[];
    driverPaymentId: string;
    updatedPayoutRows: number;
  }>("/earnings/payouts/pay-driver", body);
}

export function postPayAllConsolidated(body: { weekStart: string; weekEnd: string }) {
  return api.post<{
    driversPaid: number;
    totalAmount: number;
    skipped: number;
  }>("/earnings/payouts/pay-all", body);
}

export function getEarningsPayouts(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  driverId?: string;
  excludeSubcontractorManaged?: boolean;
}) {
  return api.get<EarningsPayoutsResponse>("/earnings/payouts", { params });
}

export interface PayoutPlatformBreakdownRow {
  platform: string;
  gross: string;
  fees: string;
  net: string;
  row_count: number;
}

export function getPayoutPlatformBreakdown(payoutId: string) {
  return api.get<{ platforms: PayoutPlatformBreakdownRow[] }>(
    `/earnings/payouts/${payoutId}/platform-breakdown`,
  );
}

export function getEarningsReports(params: {
  from?: string;
  to?: string;
  q?: string;
  status?: string;
  driverId?: string;
  minVehicleRental?: number;
  platform?: string;
  limit?: number;
}) {
  return api.get<EarningsReportsResponse>("/earnings/reports", { params });
}

export function getCommissionByBaseTypeReport(params: {
  from?: string;
  to?: string;
  q?: string;
  status?: string;
  driverId?: string;
  minVehicleRental?: number;
  platform?: string;
}) {
  return api.get<{ items: CommissionByBaseTypeRow[] }>("/earnings/reports/commission-by-base-type", { params });
}

export function getPayoutsAssignmentDetails(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  driverId?: string;
  excludeSubcontractorManaged?: boolean;
}) {
  return api.get<{ items: PayoutAssignmentDetail[]; page: number; pageSize: number }>(
    "/earnings/payouts/assignment-details",
    { params },
  );
}

/** @deprecated Use getPayoutsAssignmentDetails */
export const getPayoutsWithProrationDetails = getPayoutsAssignmentDetails;

export interface BulkUpdatePayoutsResponse {
  updatedRows: number;
}

export function bulkUpdatePayouts(body: {
  ids: string[];
  paymentStatus?: string;
  paymentDate?: string;
  paymentMethod?: string;
  transactionRef?: string;
  holdReason?: string;
}) {
  return api.patch<BulkUpdatePayoutsResponse>("/earnings/payouts/bulk", body);
}

export type ReleaseHoldResponse = {
  ok: boolean;
  payoutId: string;
  paymentStatus: string;
  holdReleasedAt: string | null;
  payout?: AdjustDebtPayoutSnapshot | null;
};

export function postReleasePayoutHold(payoutId: string, body?: { notes?: string }) {
  return api.post<ReleaseHoldResponse>(
    `/earnings/payouts/${encodeURIComponent(payoutId)}/release-hold`,
    body ?? {},
  );
}

export function postReleasePayoutHoldBulk(body: { ids: string[]; notes?: string }) {
  return api.post<{ released: number; releasedIds: string[]; skipped: { id: string; message: string }[] }>(
    "/earnings/payouts/release-hold/bulk",
    body,
  );
}

export function downloadEarningsReportCsv(params: {
  from?: string;
  to?: string;
  q?: string;
  status?: string;
  driverId?: string;
  minVehicleRental?: number;
}) {
  return api.get<Blob>("/earnings/reports/export", {
    params: { ...params, format: "csv" },
    responseType: "blob",
  });
}

export function getEarningsReportPdfData(params: {
  from?: string;
  to?: string;
  q?: string;
  status?: string;
  driverId?: string;
  minVehicleRental?: number;
}) {
  return api.get<EarningsReportsResponse>("/earnings/reports/export", {
    params: { ...params, format: "pdf" },
  });
}

export function syncEarningsVehicleRentals(body?: { importId?: string; driverId?: string }) {
  return api.post<{ retouchedRecords: number; updatedPayouts: number }>("/earnings/sync-vehicles", body ?? {});
}

export interface DebtSummaryResponse {
  totalOutstanding: number;
  driversWithDebt: number;
  topDebtors: { driverId: string; name: string; outstanding: number; oldestPeriodEnd: string | null }[];
}

export function getDebtsSummary() {
  return api.get<DebtSummaryResponse>("/earnings/debts/summary");
}

export type DebtAdjustType = "adjust" | "forgive" | "cash_received" | "carry_forward";

/** Debt-related fields on `driver_payouts` after adjust-debt (post-propagation snapshot). */
export type AdjustDebtPayoutSnapshot = {
  raw_net_amount: string | null;
  debt_amount: string | null;
  debt_applied_amount: string | null;
  remaining_debt_amount: string | null;
  net_driver_payout: string | null;
  payment_status: string;
  updated_at: string | null;
};

export type AdjustDebtResponse = {
  ok: boolean;
  payoutId?: string;
  driverId?: string;
  type: string;
  previousRemaining?: number;
  remainingDebtAmount?: number;
  paymentStatus?: string;
  payout?: AdjustDebtPayoutSnapshot | null;
};

/** `forgive` / `cash_received`: positive amount reduces remaining debt. `adjust`: positive reduces remaining; negative increases (corrections). */
export function postPayoutAdjustDebt(
  payoutId: string,
  body: { type: DebtAdjustType; amount?: number; note?: string | null },
) {
  return api.post<AdjustDebtResponse>(`/earnings/payouts/${encodeURIComponent(payoutId)}/adjust-debt`, body);
}

/** Alias for `postPayoutAdjustDebt` (same endpoint and payload). */
export function adjustDebt(
  payoutId: string,
  body: { type: DebtAdjustType; amount?: number; note?: string | null },
) {
  return postPayoutAdjustDebt(payoutId, body);
}

export type CustomFeeType = "deduction" | "addition";

export type CustomFeeSource = "manual" | "recurring";

export interface DriverPayoutCustomFee {
  id: string;
  fee_name: string;
  fee_type: CustomFeeType;
  amount: string;
  source: CustomFeeSource;
  recurring_fee_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface DriverPayoutCustomFeesResponse {
  items: DriverPayoutCustomFee[];
  recurring_items: DriverPayoutCustomFee[];
  manual_items: DriverPayoutCustomFee[];
  base_raw_net: string;
  total_deductions: string;
  total_additions: string;
  raw_net_amount: string;
  net_driver_payout: string;
  is_weekly_fee_anchor?: boolean;
  weekly_fee_anchor_platform?: string | null;
}

export interface PayoutDebtAdjustment {
  id: string;
  payout_id: string;
  adjustment_type: DebtAdjustType;
  amount: string;
  reason: string | null;
  created_at: string;
  previous_remaining_debt: string | null;
  new_remaining_debt: string | null;
  applied_amount: string | null;
  platform?: string | null;
}

export function getPayoutWeekDebtAdjustments(params: { driverId: string; from: string; to: string }) {
  return api.get<{ items: PayoutDebtAdjustment[] }>("/earnings/payouts/debt-adjustments", { params });
}

export function getPayoutCustomFees(payoutId: string) {
  return api.get<DriverPayoutCustomFeesResponse>(
    `/earnings/payouts/${encodeURIComponent(payoutId)}/custom-fees`,
  );
}

export function postPayoutCustomFee(
  payoutId: string,
  body: { fee_name: string; fee_type: CustomFeeType; amount: number; notes?: string },
) {
  return api.post<DriverPayoutCustomFeesResponse & { id?: string }>(
    `/earnings/payouts/${encodeURIComponent(payoutId)}/custom-fees`,
    body,
  );
}

export function deletePayoutCustomFee(payoutId: string, adjustmentId: string) {
  return api.delete<DriverPayoutCustomFeesResponse & { ok: boolean }>(
    `/earnings/payouts/${encodeURIComponent(payoutId)}/custom-fees/${encodeURIComponent(adjustmentId)}`,
  );
}

export function postDebtsBulkCarryForward(body?: { driverIds?: string[]; from?: string; to?: string }) {
  return api.post<{ ok: boolean; driversProcessed: number }>("/earnings/debts/bulk-carry-forward", body ?? {});
}

export function getDebtsAging() {
  return api.get<{
    buckets: Record<string, { total: number; rowCount: number }>;
  }>("/earnings/debts/aging");
}

export function getDebtsCollectionSummary(params: { from: string; to: string }) {
  return api.get<{
    from: string;
    to: string;
    appliedFromPayouts: { periodEnd: string; collected: number }[];
    adjustmentsByType: Record<string, number>;
  }>("/earnings/debts/collection-summary", { params });
}

export function getDebtHistory(driverId: string) {
  return api.get<{
    adjustments: {
      id: string;
      payout_id: string;
      amount: string;
      reason: string | null;
      adjustment_type: string;
      created_at: string;
      period_start: string | null;
      period_end: string | null;
      previous_remaining_debt: string | null;
      new_remaining_debt: string | null;
      applied_amount: string | null;
    }[];
    payouts: {
      id: string;
      payment_period_start: string;
      payment_period_end: string;
      raw_net_amount: string | null;
      debt_amount: string | null;
      remaining_debt_amount: string | null;
      debt_applied_amount: string | null;
      net_driver_payout: string | null;
      payment_status: string;
    }[];
  }>(`/earnings/debts/history/${encodeURIComponent(driverId)}`);
}

export interface SubcontractorSettlementRow {
  id: string | null;
  subcontractor_id: string;
  legal_name: string;
  status: string;
  driver_payout_count: number | null;
  total_gross_income: string;
  total_tips: string;
  /** SUM(driver_payouts.company_commission) for the period. */
  total_commission: string;
  total_vehicle_rent: string;
  total_account_opening_fee: string;
  total_platform_fees: string;
  total_daily_cash: string;
  total_custom_deductions: string;
  total_custom_additions: string;
  total_payable: string | null;
  amount_payable: string | null;
  payment_status: string | null;
  payment_date: string | null;
  /** Snapshot when settlement was marked paid. */
  paid_amount: string | null;
}

export type SettlementReportResponse = {
  periodStart: string;
  periodEnd: string;
  subcontractorId: string;
  rows: SubcontractorSettlementRow[];
};

export function getSettlementReport(params: {
  periodStart: string;
  periodEnd: string;
  subcontractorId?: string;
}) {
  return api.get<SettlementReportResponse>("/earnings/subcontractors/settlements", {
    params: {
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      subcontractorId: params.subcontractorId ?? "all",
    },
  });
}

/** @alias getSettlementReport */
export function getSubcontractorSettlements(params: {
  periodStart: string;
  periodEnd: string;
  subcontractorId?: string;
}) {
  return getSettlementReport(params);
}

export function postRefreshSubcontractorRentCharges(body: { periodStart: string; periodEnd: string }) {
  return api.post<{ updatedSubcontractors: number }>("/earnings/subcontractors/refresh-rent-charges", body);
}
