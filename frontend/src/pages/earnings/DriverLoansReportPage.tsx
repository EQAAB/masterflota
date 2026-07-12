import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrgLoansList } from "../../api/driverLoans";
import { usePermission } from "../../lib/permissions";
import { PageHeader } from "../../components/theme/PageHeader";
import { LoansKpiCards } from "../../components/earnings/loans/LoansKpiCards";
import { LoansReportTable } from "../../components/earnings/loans/LoansReportTable";
import { CreateLoanModal } from "../../components/earnings/loans/CreateLoanModal";
import { invalidateLoanQueries } from "../../components/earnings/loans/invalidateLoanQueries";
import { DriversPagination } from "../../components/drivers/DriversPagination";
import { filterInputClass, filterSelectClass } from "../../components/earnings/payouts/PayoutFiltersCard";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "paid", label: "Paid off" },
  { value: "written_off", label: "Written off" },
];

export function DriverLoansReportPage() {
  const canAccess = usePermission("drivers.view");
  const canEdit = usePermission("drivers.edit");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search")?.trim() ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("search")?.trim();
    if (fromUrl) setSearch(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, hasBalanceOnly, pageSize]);

  const query = useQuery({
    queryKey: ["drivers", "loans", "list", debouncedSearch, status, hasBalanceOnly, page, pageSize],
    queryFn: () =>
      getOrgLoansList({
        search: debouncedSearch || undefined,
        status: status || undefined,
        has_balance: hasBalanceOnly || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort_by: "disbursed_at",
        sort_order: "desc",
      }).then((r) => r.data),
    enabled: canAccess,
  });

  const total = query.data?.total ?? 0;
  const rows = query.data?.items ?? [];

  if (!canAccess) {
    return <p className="p-6 text-ink-muted">You do not have access to driver loans.</p>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-surface-elevated">
      <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Driver loans"
            description="Fleet-wide view of cash loans given to drivers — principal, remaining balance, and status."
            breadcrumbs={[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Earnings", to: "/earnings" },
              { label: "Driver loans" },
            ]}
            className="border-0 bg-transparent px-0 py-4 sm:py-5"
            actions={
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex h-10 items-center rounded-full bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm hover:opacity-95"
                  >
                    Create loan
                  </button>
                )}
                <Link
                  to="/earnings/payouts"
                  className="inline-flex h-10 items-center rounded-full border border-border/80 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  Go to payouts
                </Link>
              </div>
            }
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <LoansKpiCards summary={query.data?.summary} loading={query.isLoading} />

        <div className="rounded-[14px] border border-border/70 bg-white p-4 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Search
              </label>
              <input
                type="search"
                className={filterInputClass}
                placeholder="Driver name, phone, reference…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Status
              </label>
              <select
                className={filterSelectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={hasBalanceOnly}
                  onChange={(e) => setHasBalanceOnly(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Outstanding balance only
              </label>
            </div>
          </div>
        </div>

        <LoansReportTable
          rows={rows}
          loading={query.isLoading}
          isError={query.isError}
          showEmpty={!query.isLoading && !query.isError && rows.length === 0}
        />

        {total > 0 && (
          <DriversPagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            selectId="loans-page-size"
          />
        )}
      </div>

      <CreateLoanModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(loanId) => {
          invalidateLoanQueries(qc);
          navigate(`/earnings/loans/${loanId}`);
        }}
      />
    </div>
  );
}
