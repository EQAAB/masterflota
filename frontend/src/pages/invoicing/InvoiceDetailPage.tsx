import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  getInvoice,
  issueInvoice,
  cancelInvoice,
  submitInvoiceToAnaf,
  getInvoiceAnafStatus,
  downloadInvoiceXml,
} from "../../api/invoicing";
import { useAnyPermission } from "../../lib/permissions";
import { dashboardPage, btnPrimary, btnSecondary } from "../../theme/classNames";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  issued: "bg-blue-100 text-blue-700",
  submitted: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-500",
  storno: "bg-orange-100 text-orange-700",
};

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const canManage = useAnyPermission("invoicing.manage");
  const canAnaf = useAnyPermission("invoicing.anaf");

  const invoiceQuery = useQuery({
    queryKey: ["invoicing", "invoice", id],
    queryFn: () => getInvoice(id!).then((r) => r.data),
    enabled: !!id,
  });

  const issueMutation = useMutation({
    mutationFn: () => issueInvoice(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing"] }),
  });

  const submitAnafMutation = useMutation({
    mutationFn: () => submitInvoiceToAnaf(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing"] }),
  });

  const checkStatusMutation = useMutation({
    mutationFn: () => getInvoiceAnafStatus(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing"] }),
  });

  const handleDownloadXml = async () => {
    try {
      const resp = await downloadInvoiceXml(id!);
      const blob = new Blob([resp.data as BlobPart], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv?.series_prefix}${inv?.invoice_number}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* handled by UI */ }
  };

  const inv = invoiceQuery.data;

  if (invoiceQuery.isLoading) {
    return <div className={dashboardPage}><p className="text-ink-muted">Loading...</p></div>;
  }
  if (!inv) {
    return <div className={dashboardPage}><p className="text-ink-muted">Invoice not found</p></div>;
  }

  const isDraft = inv.status === "draft";
  const isIssued = inv.status === "issued";
  const isSubmitted = inv.status === "submitted";
  const isRejected = inv.status === "rejected";
  const canSubmitToAnaf = (isIssued || isRejected) && canAnaf;
  const canCheckStatus = (isSubmitted) && canAnaf;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <header className="mb-6">
          <Link
            to="/invoicing"
            className={`${btnSecondary} !mb-3 !inline-flex !min-h-0 !px-3 !py-1.5 !text-xs`}
          >
            ← Invoices
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ink">
                {inv.series_prefix}{inv.invoice_number}
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                Issued {new Date(inv.issue_date).toLocaleDateString("ro-RO")}
                {inv.due_date && ` — Due ${new Date(inv.due_date).toLocaleDateString("ro-RO")}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isDraft && canManage && (
                <>
                  <button
                    className={btnPrimary}
                    onClick={() => issueMutation.mutate()}
                    disabled={issueMutation.isPending}
                  >
                    {issueMutation.isPending ? "Issuing..." : "Issue invoice"}
                  </button>
                  <button
                    className={btnSecondary}
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel
                  </button>
                </>
              )}
              {canSubmitToAnaf && (
                <button
                  className={btnPrimary}
                  onClick={() => submitAnafMutation.mutate()}
                  disabled={submitAnafMutation.isPending}
                >
                  {submitAnafMutation.isPending ? "Submitting..." : "Submit to ANAF"}
                </button>
              )}
              {canCheckStatus && (
                <button
                  className={btnSecondary}
                  onClick={() => checkStatusMutation.mutate()}
                  disabled={checkStatusMutation.isPending}
                >
                  Check ANAF status
                </button>
              )}
              {inv.status !== "draft" && (
                <button className={btnSecondary} onClick={handleDownloadXml}>
                  Download XML
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Error messages */}
        {(issueMutation.error || submitAnafMutation.error || cancelMutation.error) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {(issueMutation.error as Error)?.message
              ?? (submitAnafMutation.error as Error)?.message
              ?? (cancelMutation.error as Error)?.message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Invoice details */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-white p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Invoice details</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <dt className="text-ink-muted">Status</dt>
                <dd>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? ""}`}>
                    {inv.status}
                  </span>
                </dd>
                <dt className="text-ink-muted">Currency</dt>
                <dd className="text-ink">{inv.currency}</dd>
                <dt className="text-ink-muted">Net amount</dt>
                <dd className="font-medium text-ink">{parseFloat(inv.net_amount).toFixed(2)}</dd>
                <dt className="text-ink-muted">VAT</dt>
                <dd className="font-medium text-ink">{parseFloat(inv.vat_amount).toFixed(2)}</dd>
                <dt className="text-ink-muted">Total</dt>
                <dd className="text-lg font-bold text-ink">{parseFloat(inv.total_amount).toFixed(2)} {inv.currency}</dd>
                {inv.notes && (
                  <>
                    <dt className="text-ink-muted">Notes</dt>
                    <dd className="text-ink">{inv.notes}</dd>
                  </>
                )}
                {inv.source_type && (
                  <>
                    <dt className="text-ink-muted">Source</dt>
                    <dd className="text-ink">{inv.source_type}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* ANAF status */}
            {inv.anaf_status && (
              <div className="rounded-xl border border-border bg-white p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">ANAF e-Factura</h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt className="text-ink-muted">ANAF status</dt>
                  <dd className="font-medium text-ink">{inv.anaf_status}</dd>
                  {inv.anaf_upload_index && (
                    <>
                      <dt className="text-ink-muted">Upload index</dt>
                      <dd className="text-ink">{inv.anaf_upload_index}</dd>
                    </>
                  )}
                  {inv.anaf_submitted_at && (
                    <>
                      <dt className="text-ink-muted">Submitted at</dt>
                      <dd className="text-ink">{new Date(inv.anaf_submitted_at).toLocaleString("ro-RO")}</dd>
                    </>
                  )}
                  {inv.anaf_error_message && (
                    <>
                      <dt className="text-ink-muted">Error</dt>
                      <dd className="text-red-600">{inv.anaf_error_message}</dd>
                    </>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Buyer details */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Buyer</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-ink-muted">Name</dt>
              <dd className="font-medium text-ink">{inv.buyer_name}</dd>
              {inv.buyer_cui && (
                <>
                  <dt className="text-ink-muted">CUI</dt>
                  <dd className="text-ink">{inv.buyer_cui}</dd>
                </>
              )}
              {inv.buyer_reg_com && (
                <>
                  <dt className="text-ink-muted">Reg. Com.</dt>
                  <dd className="text-ink">{inv.buyer_reg_com}</dd>
                </>
              )}
              <dt className="text-ink-muted">VAT payer</dt>
              <dd className="text-ink">{inv.buyer_is_vat_payer ? "Yes" : "No"}</dd>
              {(inv.buyer_address_street || inv.buyer_address_city) && (
                <>
                  <dt className="text-ink-muted">Address</dt>
                  <dd className="text-ink">
                    {[inv.buyer_address_street, inv.buyer_address_number].filter(Boolean).join(" ")}
                    {inv.buyer_address_city && `, ${inv.buyer_address_city}`}
                    {inv.buyer_address_county && `, ${inv.buyer_address_county}`}
                  </dd>
                </>
              )}
              {inv.buyer_email && (
                <>
                  <dt className="text-ink-muted">Email</dt>
                  <dd className="text-ink">{inv.buyer_email}</dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Line items */}
        {inv.lines && inv.lines.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Unit price</th>
                  <th className="px-4 py-3 text-right">VAT %</th>
                  <th className="px-4 py-3 text-right">Net</th>
                  <th className="px-4 py-3 text-right">VAT</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inv.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3 text-ink-muted">{line.line_number}</td>
                    <td className="px-4 py-3 text-ink">{line.description}</td>
                    <td className="px-4 py-3 text-right text-ink">{line.quantity}</td>
                    <td className="px-4 py-3 text-ink-muted">{line.unit}</td>
                    <td className="px-4 py-3 text-right text-ink">{parseFloat(line.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-ink-muted">{line.vat_rate}%</td>
                    <td className="px-4 py-3 text-right text-ink">{parseFloat(line.net_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-ink">{parseFloat(line.vat_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">{parseFloat(line.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
