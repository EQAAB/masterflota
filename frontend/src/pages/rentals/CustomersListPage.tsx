import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getRentalCustomers, getRentalCustomersSummary } from "../../api/rentals";
import { CustomersKpiRow } from "../../components/rentals/customers/CustomersKpiRow";
import { CustomersPageHeader } from "../../components/rentals/customers/CustomersPageHeader";
import { CustomersTable } from "../../components/rentals/customers/CustomersTable";
import {
  CustomersToolbar,
  type CustomersFilters,
} from "../../components/rentals/customers/CustomersToolbar";
import { exportCustomersCsv } from "../../components/rentals/customers/customersListUtils";
import { dashboardPage } from "../../theme/classNames";

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function CustomersListPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<CustomersFilters>({
    q: "",
    customerType: "",
    rentalStatus: "",
    activeOnly: true,
    sort: "name",
  });

  const debouncedQ = useDebounce(filters.q, 300);

  const queryParams = useMemo(() => {
    const hasActiveRental =
      filters.rentalStatus === "active"
        ? true
        : filters.rentalStatus === "none"
          ? false
          : undefined;

    return {
      q: debouncedQ.trim() || undefined,
      active: filters.rentalStatus === "inactive" ? false : filters.activeOnly,
      customerType: filters.customerType || undefined,
      hasActiveRental,
      sort: filters.sort,
    };
  }, [debouncedQ, filters.customerType, filters.rentalStatus, filters.activeOnly, filters.sort]);

  const customersQuery = useQuery({
    queryKey: ["rentals", "customers", queryParams],
    queryFn: () => getRentalCustomers(queryParams).then((r) => r.data),
  });

  const summaryQuery = useQuery({
    queryKey: ["rentals", "customers", "summary"],
    queryFn: () => getRentalCustomersSummary().then((r) => r.data),
  });

  const customers = customersQuery.data ?? [];

  const patchFilters = (patch: Partial<CustomersFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  return (
    <div className="fm-rental-customers flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <CustomersPageHeader />

        <CustomersKpiRow summary={summaryQuery.data} loading={summaryQuery.isLoading} />

        <CustomersToolbar
          filters={filters}
          onChange={patchFilters}
          onExport={() => exportCustomersCsv(customers)}
          resultCount={customers.length}
        />

        {customersQuery.isError && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {t("pages.customers.failedToLoad")}
          </p>
        )}

        <CustomersTable customers={customers} loading={customersQuery.isLoading} />
      </div>
    </div>
  );
}
