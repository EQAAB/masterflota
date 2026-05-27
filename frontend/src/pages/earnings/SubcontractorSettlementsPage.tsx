import { useMemo } from "react";
import { ActionMenuDropdown } from "../../components/theme/ActionMenuDropdown";
import { SettlementsPageHeader } from "../../components/earnings/settlements/SettlementsPageHeader";
import { SettlementsInfoCard } from "../../components/earnings/settlements/SettlementsInfoCard";
import { SettlementsFiltersCard } from "../../components/earnings/settlements/SettlementsFiltersCard";
import { SettlementsKpiCards } from "../../components/earnings/settlements/SettlementsKpiCards";
import { SettlementsTable } from "../../components/earnings/settlements/SettlementsTable";
import { buildSettlementActionMenuItems } from "../../components/earnings/settlements/buildSettlementActionMenuItems";
import { settlementRowKey } from "../../components/earnings/settlements/settlementsDisplayUtils";
import { useSettlementsPageState } from "../../components/earnings/settlements/useSettlementsPageState";

export function SubcontractorSettlementsPage() {
  const {
    canAccess,
    periodStart,
    periodEnd,
    setPeriodStart,
    setPeriodEnd,
    msg,
    query,
    rows,
    kpis,
    pendingIds,
    showEmpty,
    refreshMut,
    payMut,
    openMenuRowKey,
    menuAnchorEl,
    openMenuRow,
    exportBusyKey,
    closeActionMenu,
    handleActionMenuToggle,
    handleRefresh,
    handleMarkAllPaid,
    handleMarkOnePaid,
    handleViewDetails,
    handleExport,
  } = useSettlementsPageState();

  const openMenuItems = useMemo(() => {
    if (!openMenuRow) return [];
    const rowKey = settlementRowKey(openMenuRow);
    return buildSettlementActionMenuItems({
      row: openMenuRow,
      exportBusy: exportBusyKey === rowKey,
      markPaidPending: payMut.isPending,
      onViewDetails: () => {
        if (openMenuRow.id) handleViewDetails(openMenuRow.id);
      },
      onMarkPaid: () => {
        if (openMenuRow.id) handleMarkOnePaid(openMenuRow.id);
      },
      onExport: () => void handleExport(openMenuRow),
    });
  }, [openMenuRow, exportBusyKey, payMut.isPending, handleViewDetails, handleMarkOnePaid, handleExport]);

  if (!canAccess) {
    return <p className="p-6 text-ink-muted">You do not have access.</p>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-surface-elevated">
      <SettlementsPageHeader />

      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <SettlementsInfoCard />

        <SettlementsFiltersCard
          periodStart={periodStart}
          periodEnd={periodEnd}
          onPeriodStartChange={setPeriodStart}
          onPeriodEndChange={setPeriodEnd}
          onRefresh={handleRefresh}
          onMarkPaid={handleMarkAllPaid}
          refreshPending={refreshMut.isPending}
          markPaidPending={payMut.isPending}
          pendingCount={pendingIds.length}
        />

        {msg && (
          <div className="rounded-xl border border-brand-mint/60 bg-brand-mint/30 px-4 py-3 text-sm text-ink">
            {msg}
          </div>
        )}

        <SettlementsKpiCards summary={query.data ? kpis : undefined} loading={query.isLoading} />

        <SettlementsTable
          rows={rows}
          loading={query.isLoading}
          isError={query.isError}
          showEmpty={showEmpty}
          openMenuRowKey={openMenuRowKey}
          markPaidPending={payMut.isPending}
          onActionMenuToggle={handleActionMenuToggle}
          onRefresh={handleRefresh}
        />
      </div>

      <ActionMenuDropdown
        open={openMenuRowKey != null}
        anchorEl={menuAnchorEl}
        items={openMenuItems}
        align="right"
        disabled={payMut.isPending}
        onClose={closeActionMenu}
      />
    </div>
  );
}
