import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getSettlementReport } from "../../../api/earnings";
import { getSubcontractors } from "../../../api/subcontractors";
import { bulkUpdateSubcontractorPayouts, postRefreshSubcontractorPayouts } from "../../../api/subcontractorPayouts";
import { usePermission } from "../../../lib/permissions";
import { exportSettlementCsv } from "../../../utils/exportSettlementCsv";
import { getPreviousWeek, validatePaymentWeek } from "../../../utils/earningsImportWeek";
import {
  aggregateSettlementKpis,
  canMarkSettlementPaid,
  hasSettlementData,
  settlementRowKey,
} from "./settlementsDisplayUtils";

const ALL_SUBCONTRACTORS = "all";

export function useSettlementsPageState() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const previousWeek = useMemo(() => getPreviousWeek(), []);

  const [periodStart, setPeriodStart] = useState(previousWeek.start);
  const [periodEnd, setPeriodEnd] = useState(previousWeek.end);
  const [subcontractorId, setSubcontractorId] = useState(ALL_SUBCONTRACTORS);
  const [msg, setMsg] = useState<string | null>(null);
  const [openMenuRowKey, setOpenMenuRowKey] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [exportBusyKey, setExportBusyKey] = useState<string | null>(null);

  const canAccess = usePermission("subcontractors.settle");

  const periodValidation = useMemo(
    () => validatePaymentWeek(periodStart, periodEnd),
    [periodStart, periodEnd],
  );

  const applyPreviousWeek = useCallback(() => {
    const { start, end } = getPreviousWeek();
    setPeriodStart(start);
    setPeriodEnd(end);
  }, []);

  const subcontractorsQuery = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => getSubcontractors().then((r) => r.data),
    enabled: canAccess,
  });

  const query = useQuery({
    queryKey: ["earnings", "subcontractor-settlements", periodStart, periodEnd, subcontractorId],
    queryFn: () =>
      getSettlementReport({
        periodStart,
        periodEnd,
        subcontractorId,
      }).then((r) => r.data),
    enabled: canAccess && periodValidation.valid,
  });

  const rows = query.data?.rows ?? [];

  const kpis = useMemo(() => aggregateSettlementKpis(rows), [rows]);

  const pendingIds = useMemo(
    () => rows.filter(canMarkSettlementPaid).map((r) => r.id!),
    [rows],
  );

  const showEmpty = !query.isLoading && !query.isError && query.data != null && !hasSettlementData(rows);

  const refreshMut = useMutation({
    mutationFn: () => postRefreshSubcontractorPayouts({ periodStart, periodEnd }),
    onSuccess: (r) => {
      setMsg(
        `Refreshed ${r.data.updatedPayoutSettlements} settlement(s) and ${r.data.updatedRentSubcontractors} rent row(s).`,
      );
      void qc.invalidateQueries({ queryKey: ["earnings", "subcontractor-settlements"] });
    },
    onError: () => setMsg("Refresh failed."),
  });

  const payMut = useMutation({
    mutationFn: (ids: string[]) => bulkUpdateSubcontractorPayouts({ ids, paymentStatus: "paid" }),
    onSuccess: (r) => {
      setMsg(`Marked ${r.data.updated} settlement(s) as paid.`);
      void qc.invalidateQueries({ queryKey: ["earnings"] });
    },
    onError: () => setMsg("Mark paid failed."),
  });

  const closeActionMenu = useCallback(() => {
    setOpenMenuRowKey(null);
    setMenuAnchorEl(null);
  }, []);

  const handleActionMenuToggle = useCallback(
    (rowKey: string, event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (openMenuRowKey === rowKey) {
        closeActionMenu();
        return;
      }
      setOpenMenuRowKey(rowKey);
      setMenuAnchorEl(event.currentTarget);
    },
    [openMenuRowKey, closeActionMenu],
  );

  const openMenuRow = openMenuRowKey
    ? rows.find((r) => settlementRowKey(r) === openMenuRowKey)
    : undefined;

  const handleGenerateReport = useCallback(() => {
    setMsg(null);
    if (!periodValidation.valid) return;
    void query.refetch();
  }, [periodValidation.valid, query]);

  const handleRefresh = useCallback(() => {
    setMsg(null);
    refreshMut.mutate();
  }, [refreshMut]);

  const handleMarkAllPaid = useCallback(() => {
    if (pendingIds.length === 0) return;
    setMsg(null);
    payMut.mutate(pendingIds);
  }, [pendingIds, payMut]);

  const handleMarkOnePaid = useCallback(
    (id: string) => {
      setMsg(null);
      payMut.mutate([id]);
    },
    [payMut],
  );

  const handleViewDetails = useCallback(
    (id: string) => {
      navigate(`/earnings/subcontractors/settlements/${id}`);
    },
    [navigate],
  );

  const handleExport = useCallback(
    async (row: (typeof rows)[number]) => {
      const key = settlementRowKey(row);
      setExportBusyKey(key);
      try {
        await exportSettlementCsv(row, periodStart, periodEnd);
      } finally {
        setExportBusyKey(null);
      }
    },
    [periodStart, periodEnd],
  );

  return {
    canAccess,
    periodStart,
    periodEnd,
    setPeriodStart,
    setPeriodEnd,
    subcontractorId,
    setSubcontractorId,
    periodValidation,
    applyPreviousWeek,
    subcontractors: subcontractorsQuery.data ?? [],
    subcontractorsLoading: subcontractorsQuery.isLoading,
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
    handleGenerateReport,
    handleRefresh,
    handleMarkAllPaid,
    handleMarkOnePaid,
    handleViewDetails,
    handleExport,
  };
}
