import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getVehicleDocuments,
  deleteVehicleDocument,
  verifyVehicleDocument,
  downloadVehicleDocument,
  type VehicleDocument,
} from "../../api/vehicleDocuments";
import { VEHICLE_DOCUMENT_LABELS, type VehicleDocumentType } from "../../constants/vehicleDocumentTypes";

const DOC_TYPE_COLORS: Record<string, string> = {
  insurance: "bg-purple-100 text-purple-800",
  registration: "bg-blue-100 text-blue-800",
  maintenance: "bg-amber-100 text-amber-800",
  inspection: "bg-emerald-100 text-emerald-800",
  permit: "bg-slate-100 text-ink",
  other: "bg-gray-100 text-gray-800",
};

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = value.split("T")[0];
  return d || "—";
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

interface VehicleDocumentListProps {
  vehicleId: string;
}

export function VehicleDocumentList({ vehicleId }: VehicleDocumentListProps) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "expiry">("newest");

  const { data: docsResponse, isLoading, isError } = useQuery({
    queryKey: ["vehicleDocuments", vehicleId],
    queryFn: () => getVehicleDocuments(vehicleId),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteVehicleDocument(vehicleId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleDocuments", vehicleId] });
      setDeleteConfirm(null);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ docId, verified }: { docId: string; verified: boolean }) =>
      verifyVehicleDocument(vehicleId, docId, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleDocuments", vehicleId] });
    },
  });

  const handleDownload = async (doc: VehicleDocument) => {
    const blob = await downloadVehicleDocument(vehicleId, doc.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name || "document";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const docs = docsResponse?.data ?? [];

  const filteredDocs = docs
    .filter((doc) => {
      if (typeFilter !== "all" && doc.document_type !== typeFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const hay = `${doc.file_name ?? ""} ${doc.document_number ?? ""} ${doc.document_type ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "expiry") {
        const aExp = a.expiry_date ? new Date(a.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bExp = b.expiry_date ? new Date(b.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
        return aExp - bExp;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-sm text-ink-muted">Loading documents...</p>}
      {isError && <p className="text-sm text-red-600">Failed to load documents.</p>}
      {!isLoading && !isError && docs.length === 0 && (
        <div className="rounded-[14px] border border-dashed border-border/80 bg-brand-mint/10 px-6 py-8 text-center">
          <span className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
            <FileIcon className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-slate-800">No vehicle documents yet</p>
          <p className="mt-1 text-sm text-slate-500">Upload the first document using the form above.</p>
        </div>
      )}
      {!isLoading && !isError && docs.length > 0 && (
        <div className="overflow-hidden rounded-[14px] border border-border/70 bg-white shadow-soft">
          <div className="border-b border-border/70 px-4 py-2.5">
            <p className="text-sm font-medium text-slate-800">Vehicle documents</p>
            <p className="text-xs text-slate-500">{docs.length} file{docs.length === 1 ? "" : "s"} uploaded</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 border-b border-border/70 bg-slate-50/70 px-4 py-2.5 sm:grid-cols-[1fr_11rem_11rem]">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file name, number, type…"
              className="h-10 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            >
              <option value="all">All types</option>
              {Object.entries(VEHICLE_DOCUMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "expiry")}
              className="h-10 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            >
              <option value="newest">Newest first</option>
              <option value="expiry">Expiry soonest</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Type</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Number</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">File</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Issue / Expiry</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Status</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const type = (doc.document_type as VehicleDocumentType) ?? "other";
                  const label = VEHICLE_DOCUMENT_LABELS[type] ?? doc.document_type;
                  const colorClass = DOC_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-800";
                  const expired = isExpired(doc.expiry_date);
                  return (
                    <tr key={doc.id} className="border-t border-border/70 bg-white hover:bg-brand-mint/15">
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ${colorClass}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-xs text-ink">{doc.document_number || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {doc.file_name ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
                          >
                            <FileIcon className="h-4 w-4 text-slate-500" />
                            <span className="truncate">{doc.file_name}</span>
                            {doc.file_size != null && (
                              <span className="text-xs text-ink-muted">({formatSize(doc.file_size)})</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-muted">No file</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-ink-muted">
                        <div>Issue: {formatDate(doc.issue_date)}</div>
                        <div>
                          Expiry: <span className={expired ? "font-medium text-red-600" : ""}>{formatDate(doc.expiry_date)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ${
                            doc.is_verified
                              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/70"
                              : "bg-amber-100 text-amber-800 ring-1 ring-amber-200/70"
                          }`}
                        >
                          {doc.is_verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => verifyMutation.mutate({ docId: doc.id, verified: !doc.is_verified })}
                            disabled={verifyMutation.isPending}
                            className="font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
                          >
                            {doc.is_verified ? "Mark unverified" : "Mark verified"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(doc.id)}
                            className="font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                      No documents match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-ink">Delete document?</h3>
            <p className="text-sm text-ink-muted mt-2">
              This will permanently delete the vehicle document and its file from the server.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteMutation.isPending}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

