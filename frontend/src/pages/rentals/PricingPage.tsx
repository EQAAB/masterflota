import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  getRentalPricing,
  getRentalPricingInsights,
  getRentalPricingSummary,
} from "../../api/rentals";
import type { RentalPricing } from "../../api/rentals";
import { PricingEditModal } from "../../components/rentals/pricing/PricingEditModal";
import { PricingInsightsRow } from "../../components/rentals/pricing/PricingInsightsRow";
import { PricingKpiRow } from "../../components/rentals/pricing/PricingKpiRow";
import { PricingPageHeader } from "../../components/rentals/pricing/PricingPageHeader";
import { PricingTable } from "../../components/rentals/pricing/PricingTable";
import { PricingToolbar } from "../../components/rentals/pricing/PricingToolbar";
import {
  exportPricingCsv,
  filterAndSortPricing,
  vehicleTypeOptions,
  type PricingFilters,
} from "../../components/rentals/pricing/pricingListUtils";
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

export function PricingPage() {
  const { t } = useTranslation();
  const canManage = useCanManageRentals();
  const [filters, setFilters] = useState<PricingFilters>({
    q: "",
    vehicleType: "",
    pricingType: "",
    vehicleStatus: "",
    activeOnly: true,
    sort: "plate",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RentalPricing | null>(null);

  const debouncedQ = useDebounce(filters.q, 300);

  const pricingQuery = useQuery({
    queryKey: ["rentals", "pricing", debouncedQ],
    queryFn: () =>
      getRentalPricing({ vehicleQ: debouncedQ.trim() || undefined }).then((r) => r.data),
  });

  const summaryQuery = useQuery({
    queryKey: ["rentals", "pricing", "summary"],
    queryFn: () => getRentalPricingSummary().then((r) => r.data),
  });

  const insightsQuery = useQuery({
    queryKey: ["rentals", "pricing", "insights"],
    queryFn: () => getRentalPricingInsights().then((r) => r.data),
  });

  const rows = pricingQuery.data ?? [];

  const filtered = useMemo(
    () => filterAndSortPricing(rows, { ...filters, q: debouncedQ }),
    [rows, filters, debouncedQ],
  );

  const types = useMemo(() => vehicleTypeOptions(rows), [rows]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: RentalPricing) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div className="fm-rental-pricing flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <PricingPageHeader canManage={canManage} onAdd={openAdd} onExport={() => exportPricingCsv(filtered)} />

        <PricingKpiRow summary={summaryQuery.data} loading={summaryQuery.isLoading} />

        <PricingToolbar
          filters={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          vehicleTypes={types}
          resultCount={filtered.length}
        />

        {pricingQuery.isError && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {t("pages.pricing.failedToLoad")}
          </p>
        )}

        <PricingTable
          rows={filtered}
          loading={pricingQuery.isLoading}
          canManage={canManage}
          onAdd={openAdd}
          onEdit={openEdit}
        />

        <PricingInsightsRow insights={insightsQuery.data} loading={insightsQuery.isLoading} />
      </div>

      <PricingEditModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
