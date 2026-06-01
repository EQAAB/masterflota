import type { CustomerPreviewDisplay } from "./customerFormUtils";
import type { CustomerType } from "./customerFormUtils";

type CustomerPreviewPanelProps = {
  preview: CustomerPreviewDisplay;
  customerType: CustomerType;
};

export function CustomerPreviewPanel({ preview, customerType }: CustomerPreviewPanelProps) {
  const pillClass =
    customerType === "company"
      ? "fm-rental-customer-form__type-pill fm-rental-customer-form__type-pill--company"
      : "fm-rental-customer-form__type-pill fm-rental-customer-form__type-pill--individual";

  return (
    <aside className="fm-rental-customer-form__preview">
      <h2 className="text-base font-semibold text-ink">Customer preview</h2>

      {preview.isEmpty ? (
        <p className="fm-rental-customer-form__preview-empty mt-4">
          Customer information will appear here as you type.
        </p>
      ) : (
        <div className="mt-4 flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="fm-rental-customer-form__avatar">{preview.initials}</div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className={pillClass}>{preview.typeLabel}</span>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
              Draft profile
            </span>
          </div>
          <p className="mt-3 text-lg font-semibold text-ink">{preview.legalName}</p>
          {preview.contactName !== "—" && (
            <p className="text-sm text-ink-muted">{preview.contactName}</p>
          )}
        </div>
      )}

      <dl className="mt-5">
        <div className="fm-rental-customer-form__meta-row">
          <dt className="text-ink-muted">Email</dt>
          <dd className="truncate font-medium text-ink">{preview.email}</dd>
        </div>
        <div className="fm-rental-customer-form__meta-row">
          <dt className="text-ink-muted">Phone</dt>
          <dd className="font-medium text-ink">{preview.phone}</dd>
        </div>
        {preview.taxId !== "—" && (
          <div className="fm-rental-customer-form__meta-row">
            <dt className="text-ink-muted">Tax ID</dt>
            <dd className="font-medium text-ink">{preview.taxId}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
