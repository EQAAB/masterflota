import { useCallback, useMemo, useState } from "react";
import type { EarningsImportListItem } from "../api/earnings";
import {
  getPreviousWeek,
  validatePaymentWeek,
  type PaymentWeekValidation,
} from "../utils/earningsImportWeek";

export function useEarningsImportPeriod(existingImports?: EarningsImportListItem[]) {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const applyPreviousWeek = useCallback(() => {
    const { start, end } = getPreviousWeek();
    setPeriodStart(start);
    setPeriodEnd(end);
  }, []);

  const validation: PaymentWeekValidation = useMemo(
    () =>
      validatePaymentWeek(periodStart, periodEnd, {
        existingImports,
      }),
    [periodStart, periodEnd, existingImports],
  );

  const validationForPlatform = useCallback(
    (platform: string) =>
      validatePaymentWeek(periodStart, periodEnd, {
        existingImports,
        platform,
      }),
    [periodStart, periodEnd, existingImports],
  );

  return {
    periodStart,
    periodEnd,
    setPeriodStart,
    setPeriodEnd,
    applyPreviousWeek,
    validation,
    validationForPlatform,
  };
}
