import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { getSubcontractor } from "../../api/subcontractors";
import { usePermission } from "../../lib/permissions";
import { PageHeader } from "../../components/theme/PageHeader";
import { btnPrimary } from "../../theme/classNames";

const cardClass = "rounded-[16px] border border-border/70 bg-white p-5 shadow-soft sm:p-6";
const labelClass = "text-xs font-medium text-slate-500";
const valueClass = "mt-0.5 text-sm text-slate-900";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className={labelClass}>{label}</dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  );
}

export function SubcontractorDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const canEdit = usePermission("subcontractors.edit");

  const detailQ = useQuery({
    queryKey: ["subcontractors", id],
    queryFn: () => getSubcontractor(id!).then((r) => r.data),
    enabled: !!id,
  });

  const d = detailQ.data;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-100">
      <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <PageHeader
            title={d?.legal_name ?? t("pages.subcontractorDetail.title")}
            description={t("pages.subcontractorDetail.subtitle")}
            breadcrumbs={[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Subcontractors", to: "/subcontractors" },
              { label: d?.legal_name ?? "Detail" },
            ]}
            className="border-0 bg-transparent px-0 py-4 sm:py-5"
            actions={
              canEdit && id ? (
                <Link
                  to={`/subcontractors/${id}/edit`}
                  className={`${btnPrimary} text-sm`}
                >
                  {t("pages.subcontractorDetail.edit")}
                </Link>
              ) : undefined
            }
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1200px] flex-1 p-4 sm:p-6">
        {detailQ.isLoading && <p className="text-sm text-slate-500">Loading subcontractor…</p>}
        {detailQ.isError && (
          <p className="text-sm text-red-700">Could not load subcontractor.</p>
        )}

        {d && (
          <div className={`grid gap-4 ${d.drivers.length > 0 ? "lg:grid-cols-[1fr_320px]" : ""}`}>
            <article className={`${cardClass} space-y-5`}>
              <section>
                <h2 className="text-sm font-semibold text-slate-900">Business information</h2>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Legal name" value={d.legal_name} />
                  <Field label="Status" value={<span className="capitalize">{d.status}</span>} />
                  <Field label="Registration type" value={d.registration_type?.toUpperCase() ?? "—"} />
                  <Field label="Registration number" value={d.registration_number ?? "—"} />
                  <Field label="Tax ID" value={d.tax_id ?? "—"} />
                </dl>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Email" value={d.email ?? "—"} />
                  <Field label="Phone" value={d.phone ?? "—"} />
                  <div className="sm:col-span-2">
                    <Field label="Address" value={d.address ?? "—"} />
                  </div>
                </dl>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-slate-900">Banking</h2>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Bank name" value={d.bank_name ?? "—"} />
                  <Field label="IBAN" value={d.bank_account_iban ?? "—"} />
                </dl>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-slate-900">Contract</h2>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Start date" value={formatDate(d.contract_start_date)} />
                  <Field label="End date" value={formatDate(d.contract_end_date)} />
                </dl>
              </section>

              {d.notes && (
                <section>
                  <h2 className="text-sm font-semibold text-slate-900">Notes</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{d.notes}</p>
                </section>
              )}
            </article>

            {d.drivers.length > 0 && (
              <aside className={cardClass}>
                <h2 className="text-sm font-semibold text-slate-900">Linked drivers</h2>
                <p className="mt-0.5 text-xs text-slate-500">{d.drivers.length} assigned</p>
                <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
                  {d.drivers.map((driver) => (
                    <li key={driver.id}>
                      <Link
                        to={`/drivers/${driver.id}`}
                        className="block rounded-xl border border-border/70 bg-slate-50/60 px-3 py-2.5 text-sm font-medium text-brand hover:bg-brand-mint/15"
                      >
                        {driver.first_name} {driver.last_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
