import { api } from "../lib/api";

export type DriverLoanStatus = "active" | "paid" | "written_off";
export type LoanRepaymentType = "from_payout" | "cash" | "forgive";

export interface DriverLoanRepayment {
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
}

export interface DriverLoan {
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
  repayments?: DriverLoanRepayment[];
}

export interface WeekLoanRepayment {
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
}

export function getDriverLoans(driverId: string) {
  return api.get<{ items: DriverLoan[] }>(`/drivers/${encodeURIComponent(driverId)}/loans`);
}

export function getActiveDriverLoan(driverId: string) {
  return api.get<{ loan: DriverLoan | null }>(
    `/drivers/${encodeURIComponent(driverId)}/loans/active`,
  );
}

export function postDriverLoan(
  driverId: string,
  body: {
    principal: number;
    disbursed_at?: string;
    reference?: string | null;
    notes?: string | null;
    planned_repayment_week?: string | null;
    planned_repayment_note?: string | null;
  },
) {
  return api.post<DriverLoan>(`/drivers/${encodeURIComponent(driverId)}/loans`, body);
}

export function patchDriverLoanPlan(
  driverId: string,
  loanId: string,
  body: {
    planned_repayment_week?: string | null;
    planned_repayment_note?: string | null;
  },
) {
  return api.patch<DriverLoan>(
    `/drivers/${encodeURIComponent(driverId)}/loans/${encodeURIComponent(loanId)}/plan`,
    body,
  );
}

export function postLoanRepayment(
  driverId: string,
  loanId: string,
  body: {
    type: "cash" | "forgive";
    amount?: number;
    settle_full?: boolean;
    notes?: string | null;
  },
) {
  return api.post<{ repayment: DriverLoanRepayment; loan: DriverLoan }>(
    `/drivers/${encodeURIComponent(driverId)}/loans/${encodeURIComponent(loanId)}/repayments`,
    body,
  );
}

export function postLoanRepaymentFromPayout(
  driverId: string,
  body: {
    payment_period_start: string;
    payment_period_end: string;
    amount?: number;
    settle_full?: boolean;
    notes?: string | null;
  },
) {
  return api.post<{ repayment: DriverLoanRepayment; loan: DriverLoan }>(
    `/earnings/drivers/${encodeURIComponent(driverId)}/loan-repayments/from-payout`,
    body,
  );
}

export function getDriverWeekLoanRepayments(driverId: string, from: string, to: string) {
  return api.get<{ items: WeekLoanRepayment[] }>(
    `/earnings/drivers/${encodeURIComponent(driverId)}/loan-repayments`,
    { params: { from, to } },
  );
}

export function loanRepaymentTypeLabel(type: LoanRepaymentType): string {
  switch (type) {
    case "from_payout":
      return "From payout";
    case "cash":
      return "Cash / bank";
    case "forgive":
      return "Forgive / write-off";
    default:
      return type;
  }
}

export function loanStatusLabel(status: DriverLoanStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "paid":
      return "Paid off";
    case "written_off":
      return "Written off";
    default:
      return status;
  }
}
