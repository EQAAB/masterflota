import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PayoutIntegrityRow } from "../../../api/earnings";
import { DriversPagination } from "../../drivers/DriversPagination";
import { EmptyState } from "../../theme/EmptyState";
import { transitionDefault } from "../../../theme/classNames";
import { formatCurrency } from "../../../utils/currency";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";

const tableCell = "px-4 py-4 lg:px-5 lg:py-[1.125rem] align-middle whitespace-nowrap";
const tableHeaderCell = `${tableCell} text-left`;
const headerLabel = "text-[11px] font-semibold uppercase tracking-wider text-ink-muted";

function toNum(v: string | null): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type PayoutIntegrityTableProps = {
  rows: PayoutIntegrityRow[];
  isLoading?: boolean;
};

export function PayoutIntegrityTable({ rows, isLoading }: PayoutIntegrityTableProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-card">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <span
            className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent"
            role="status"
            aria-label={t("pages.earningsOverview.loadingIntegrityRowsAria")}
          />
          <p className="text-sm text-ink-muted">{t("pages.earningsOverview.loadingPayoutIntegrityEllipsis")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-card">
      <div className="border-b border-border/60 px-5 py-5 sm:px-6">
        <h3 className="text-sm font-semibold text-ink">{t("pages.earningsOverview.driverPayoutIntegrityTitle")}</h3>
        <p className="mt-1 max-w-4xl text-xs leading-relaxed text-ink-muted">
          {t("pages.earningsOverview.expectedPayoutFormulaDesc")}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t("pages.earningsOverview.noIntegrityRowsTitle")}
          description={t("pages.earningsOverview.noIntegrityRowsDesc")}
          className="border-0 py-16"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] table-fixed text-sm">
              <thead className="bg-[#F7F8FC]">
                <tr>
                  <th className={`${tableHeaderCell} w-[88px]`}><span className={headerLabel}>{t("common.status")}</span></th>
                  <th className={`${tableHeaderCell} w-[100px]`}><span className={headerLabel}>{t("pages.earningsOverview.colDate")}</span></th>
                  <th className={`${tableHeaderCell} w-[100px]`}><span className={headerLabel}>{t("pages.earningsOverview.platformLabel")}</span></th>
                  <th className={tableHeaderCell}><span className={headerLabel}>{t("pages.earningsOverview.colTvt")}</span></th>
                  <th className={tableHeaderCell}><span className={headerLabel}>{t("pages.earningsOverview.colAcctFee")}</span></th>
                  <th className={tableHeaderCell}><span className={headerLabel}>{t("pages.earningsOverview.colCommBase")}</span></th>
                  <th className={tableHeaderCell}><span className={headerLabel}>{t("pages.earningsOverview.colCommission")}</span></th>
                  <th className={tableHeaderCell}><span className={headerLabel}>{t("pages.earningsOverview.colVehicleRental")}</span></th>
                  <th className={tableHeaderCell}><span className={headerLabel}>{t("pages.earningsOverview.colDriverPayout")}</span></th>
                  <th className={tableHeaderCell}><span className={headerLabel}>{t("pages.earningsOverview.colExpected")}</span></th>
                  <th className={tableHeaderCell}><span className={headerLabel}>{t("pages.earningsOverview.colDelta")}</span></th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((r, index) => {
                  const payout = toNum(r.driver_payout);
                  const expected = toNum(r.expected_payout);
                  const delta = payout - expected;
                  const isEven = index % 2 === 1;
                  return (
                    <tr
                      key={r.id}
                      className={`${transitionDefault} ${isEven ? "bg-[#FAFBFD]" : "bg-white"} hover:bg-brand-mint/25`}
                    >
                      <td className={tableCell}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            r.ok ? "bg-success/10 text-success ring-1 ring-success/20" : "bg-danger/10 text-danger ring-1 ring-danger/20"
                          }`}
                        >
                          {r.ok ? t("pages.earningsOverview.integrityOk") : t("pages.earningsOverview.integrityBroken")}
                        </span>
                      </td>
                      <td className={`${tableCell} tabular-nums text-ink-muted`}>{r.trip_date}</td>
                      <td className={`${tableCell} lowercase text-ink`}>
                        {earningsPlatformLabel(r.platform).toLowerCase()}
                      </td>
                      <td className={`${tableCell} tabular-nums`}>
                        {r.total_transfer_earnings != null
                          ? formatCurrency(toNum(r.total_transfer_earnings))
                          : "—"}
                      </td>
                      <td className={`${tableCell} tabular-nums text-ink-muted`}>
                        {r.account_opening_fee != null && toNum(r.account_opening_fee) > 0
                          ? `−${formatCurrency(toNum(r.account_opening_fee))}`
                          : "—"}
                      </td>
                      <td className={`${tableCell} tabular-nums text-ink-muted`}>
                        {r.commission_base != null && r.commission_base !== ""
                          ? formatCurrency(toNum(r.commission_base))
                          : "—"}
                      </td>
                      <td className={`${tableCell} tabular-nums`}>
                        {formatCurrency(toNum(r.company_commission))}
                      </td>
                      <td className={`${tableCell} tabular-nums text-ink-muted`}>
                        {r.vehicle_rental_fee != null && toNum(r.vehicle_rental_fee) !== 0
                          ? formatCurrency(toNum(r.vehicle_rental_fee))
                          : "—"}
                      </td>
                      <td className={`${tableCell} tabular-nums`}>{formatCurrency(payout)}</td>
                      <td className={`${tableCell} tabular-nums`}>{formatCurrency(expected)}</td>
                      <td
                        className={`${tableCell} tabular-nums ${
                          Math.abs(delta) > 0.009 ? "font-semibold text-danger" : "text-ink-muted"
                        }`}
                      >
                        {formatCurrency(delta)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DriversPagination
            page={safePage}
            pageSize={pageSize}
            totalItems={rows.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            selectId="integrity-page-size"
          />
        </>
      )}
    </div>
  );
}
