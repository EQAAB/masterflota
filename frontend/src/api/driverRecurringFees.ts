import { api } from "../lib/api";
import i18n from "../i18n";
import type { CustomFeeType } from "./earnings";

export type RecurringFeeFrequency = "weekly" | "monthly_first_week";

export interface DriverRecurringFee {
  id: string;
  fee_name: string;
  fee_type: CustomFeeType;
  amount: string;
  frequency: RecurringFeeFrequency;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function getDriverRecurringFees(driverId: string) {
  return api.get<{ items: DriverRecurringFee[] }>(
    `/drivers/${encodeURIComponent(driverId)}/recurring-fees`,
  );
}

export function postDriverRecurringFee(
  driverId: string,
  body: {
    fee_name: string;
    fee_type: CustomFeeType;
    amount: number;
    frequency?: RecurringFeeFrequency;
    is_active?: boolean;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
  },
) {
  return api.post<DriverRecurringFee>(
    `/drivers/${encodeURIComponent(driverId)}/recurring-fees`,
    body,
  );
}

export function patchDriverRecurringFee(
  driverId: string,
  feeId: string,
  body: Partial<{
    fee_name: string;
    fee_type: CustomFeeType;
    amount: number;
    frequency: RecurringFeeFrequency;
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
  }>,
) {
  return api.patch<DriverRecurringFee>(
    `/drivers/${encodeURIComponent(driverId)}/recurring-fees/${encodeURIComponent(feeId)}`,
    body,
  );
}

export function deleteDriverRecurringFee(driverId: string, feeId: string) {
  return api.delete<{ ok: boolean }>(
    `/drivers/${encodeURIComponent(driverId)}/recurring-fees/${encodeURIComponent(feeId)}`,
  );
}

export function recurringFeeFrequencyLabel(frequency: RecurringFeeFrequency): string {
  switch (frequency) {
    case "monthly_first_week":
      return i18n.t("pages.driverDetail.monthlyFirstWeekBadge");
    case "weekly":
    default:
      return i18n.t("pages.driverDetail.weeklyOption");
  }
}
