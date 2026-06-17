import { useCallback, useState } from "react";

export type QuickWeeklyRentalModalState = {
  open: boolean;
  customerId?: string;
  vehicleId?: string;
  startAt?: string;
};

export function useQuickWeeklyRentalModal() {
  const [state, setState] = useState<QuickWeeklyRentalModalState>({ open: false });

  const openQuickWeeklyRental = useCallback(
    (opts?: Omit<QuickWeeklyRentalModalState, "open">) => {
      setState({ open: true, ...opts });
    },
    [],
  );

  const closeQuickWeeklyRental = useCallback(() => {
    setState({ open: false });
  }, []);

  return {
    quickWeeklyModal: state,
    openQuickWeeklyRental,
    closeQuickWeeklyRental,
  };
}
