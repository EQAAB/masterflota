import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { getInvoices } from "../../api/invoicing";
import { useAnyPermission } from "../../lib/permissions";
import { dashboardPage, btnPrimary } from "../../theme/classNames";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  issued: "bg-blue-100 text-blue-700",
  submitted: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-500",
  storno: "bg-orange-100 text-orange-700",
};

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function InvoicesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canManage = useAnyPermission("invoicing.manage");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const debouncedQ = useDebounce(q, 300);

  const queryParams = useMemo(
    () => ({ status: status || undefined, q: debouncedQ.trim() || undefined }),
    [status, debouncedQ],
  );

  const invoicesQuery = useQuery({
    queryKey: ["invoicing", "invoices", queryParams],
    queryFn: () => getInvoices(queryParams).then((r) => r.data),
  });

  const invoices = invoicesQuery.data ?? [];

  const totals = useMemo(() => {
    let net = 0, vat = 0, total = 0;
    for (const inv of invoices) {
      if (inv.status !== "cancelled" && inv.status !== "storno") {
        net += parseFloat(inv.net_amount);
        vat += parseFloat(inv.vat_amount);
        total += parseFloat(inv.total_amount);
      }
    }
    return { net, vat, total, count: invoices.length };
  }, [invoices]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{t("pages.invoices.title")}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {t("pages.invoices.subtitle")}
            </p>
          </div>
          {canManage && (
            <Link to="/invoicing/new" className={btnPrimary}>
              {t("pages.invoices.add")}
            </Link>
          )}
        </header>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: t("pages.invoices.kpiTotalInvoices"), value: totals.count },
            { label: t("pages.invoiceDetail.netAmountLabel"), value: `${totals.net.toFixed(2)} RON` },
            { label: t("pages.invoiceDetail.vatLabel"), value: `${totals.vat.toFixed(2)} RON` },
            { label: t("pages.invoiceDetail.totalLabel"), value: `${totals.total.toFixed(2)} RON` },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-white p-4 shadow-card">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{kpi.label}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder={t("pages.invoices.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-[240px] rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">{t("pages.invoices.allStatusesOption")}</option>
            <option value="draft">{t("pages.invoiceDetail.status.draft")}</option>
            <option value="issued">{t("pages.invoiceDetail.status.issued")}</option>
            <option value="submitted">{t("pages.invoiceDetail.status.submitted")}</option>
            <option value="accepted">{t("pages.invoiceDetail.status.accepted")}</option>
            <option value="rejected">{t("pages.invoiceDetail.status.rejected")}</option>
            <option value="cancelled">{t("pages.invoiceDetail.status.cancelled")}</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">{t("pages.invoices.colNumber")}</th>
                <th className="px-4 py-3">{t("pages.invoices.colDate")}</th>
                <th className="px-4 py-3">{t("pages.invoiceDetail.buyerTitle")}</th>
                <th className="px-4 py-3">{t("pages.invoiceDetail.cuiLabel")}</th>
                <th className="px-4 py-3 text-right">{t("pages.invoiceDetail.totalLabel")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3">{t("pages.invoices.colAnaf")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoicesQuery.isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">{t("common.loading")}</td></tr>
              )}
              {!invoicesQuery.isLoading && invoices.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">{t("pages.invoices.noInvoicesFound")}</td></tr>
              )}
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="cursor-pointer transition-colors hover:bg-surface"
                  onClick={() => navigate(`/invoicing/${inv.id}`)}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                    {inv.series_prefix}{inv.invoice_number}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {new Date(inv.issue_date).toLocaleDateString("ro-RO")}
                  </td>
                  <td className="px-4 py-3 text-ink">{inv.buyer_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{inv.buyer_cui ?? "–"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink">
                    {parseFloat(inv.total_amount).toFixed(2)} {inv.currency}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? ""}`}>
                      {t(`pages.invoiceDetail.status.${inv.status}`, { defaultValue: inv.status })}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                    {inv.anaf_status ?? "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
