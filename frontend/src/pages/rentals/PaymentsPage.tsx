import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getRentalPayments,
  getRentalPaymentsActivity,
  getRentalPaymentsSummary,
} from "../../api/rentals";
import type { RentalPaymentListItem } from "../../api/rentals";
import { PaymentsActivityFeed } from "../../components/rentals/payments/PaymentsActivityFeed";
import { PaymentsKpiRow } from "../../components/rentals/payments/PaymentsKpiRow";
import { PaymentsPageHeader } from "../../components/rentals/payments/PaymentsPageHeader";
import { PaymentsTable } from "../../components/rentals/payments/PaymentsTable";
import { PaymentsToolbar } from "../../components/rentals/payments/PaymentsToolbar";
import { RecordPaymentModal } from "../../components/rentals/payments/RecordPaymentModal";
import {
  customerOptions,
  exportPaymentsCsv,
  filterAndSortPayments,
  type PaymentsFilters,
} from "../../components/rentals/payments/paymentsListUtils";
import { useCanManageRentals } from "../../lib/rentalsPermissions";
import { dashboardPage } from "../../theme/classNames";

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function PaymentsPage() {
  const canManage = useCanManageRentals();
  const [filters, setFilters] = useState<PaymentsFilters>({
    q: "",
    status: "",
    paymentType: "",
    customerId: "",
    from: "",
    to: "",
    sort: "date",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RentalPaymentListItem | null>(null);

  const debouncedQ = useDebounce(filters.q, 300);

  const queryParams = useMemo(
    () => ({
      status: filters.status || undefined,
      paymentType: filters.paymentType || undefined,
      customerId: filters.customerId || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      q: debouncedQ.trim() || undefined,
    }),
    [
      filters.status,
      filters.paymentType,
      filters.customerId,
      filters.from,
      filters.to,
      debouncedQ,
    ],
  );

  const paymentsQuery = useQuery({
    queryKey: ["rentals", "payments", queryParams],
    queryFn: () => getRentalPayments(queryParams).then((r) => r.data),
  });

  const summaryQuery = useQuery({
    queryKey: ["rentals", "payments", "summary"],
    queryFn: () => getRentalPaymentsSummary().then((r) => r.data),
  });

  const activityQuery = useQuery({
    queryKey: ["rentals", "payments", "activity"],
    queryFn: () => getRentalPaymentsActivity().then((r) => r.data),
  });

  const rows = paymentsQuery.data ?? [];
  const filtered = useMemo(
    () => filterAndSortPayments(rows, { ...filters, q: debouncedQ }),
    [rows, filters, debouncedQ],
  );
  const customers = useMemo(() => customerOptions(rows), [rows]);

  const openRecord = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: RentalPaymentListItem) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div className="fm-rental-payments flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <PaymentsPageHeader canManage={canManage} onRecord={openRecord} onExport={() => exportPaymentsCsv(filtered)} />

        <PaymentsKpiRow summary={summaryQuery.data} loading={summaryQuery.isLoading} />

        <PaymentsActivityFeed items={activityQuery.data} loading={activityQuery.isLoading} />

        <PaymentsToolbar
          filters={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          customers={customers}
          resultCount={filtered.length}
        />

        {paymentsQuery.isError && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Failed to load payments. Check your connection and try again.
          </p>
        )}

        <PaymentsTable
          rows={filtered}
          loading={paymentsQuery.isLoading}
          canManage={canManage}
          onRecord={openRecord}
          onEdit={openEdit}
        />
      </div>

      <RecordPaymentModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
