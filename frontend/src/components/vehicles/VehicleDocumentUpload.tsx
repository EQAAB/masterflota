import type { DragEvent, FormEvent, ChangeEvent } from "react";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadVehicleDocument } from "../../api/vehicleDocuments";
import {
  VEHICLE_DOCUMENT_TYPES,
  type VehicleDocumentType,
} from "../../constants/vehicleDocumentTypes";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png"];

function UploadCloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 11v7m0-7l-3 3m3-3l3 3"
      />
    </svg>
  );
}

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE) return "File must be 10MB or smaller.";
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  const ok = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXT.includes(ext);
  if (!ok) return "Only PDF, JPG and PNG files are allowed.";
  return null;
}

interface VehicleDocumentUploadProps {
  vehicleId: string;
  onSuccess?: () => void;
}

export function VehicleDocumentUpload({ vehicleId, onSuccess }: VehicleDocumentUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<VehicleDocumentType>("insurance");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress: (p: number) => void;
    }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", documentType);
      if (documentNumber.trim()) form.append("documentNumber", documentNumber.trim());
      if (expiryDate) form.append("expiryDate", expiryDate);
      if (issueDate) form.append("issueDate", issueDate);
      if (notes.trim()) form.append("notes", notes.trim());
      return uploadVehicleDocument(vehicleId, form, onProgress);
    },
    onSuccess: () => {
      setToast({ type: "success", message: "Document uploaded successfully." });
      setSelectedFile(null);
      setDocumentNumber("");
      setExpiryDate("");
      setIssueDate("");
      setNotes("");
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["vehicleDocuments", vehicleId] });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setToast({
        type: "error",
        message: (err as Error).message || "Upload failed.",
      });
      setUploadProgress(0);
    },
  });

  const onFileSelected = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const err = validateFile(file);
    if (err) {
      setToast({ type: "error", message: err });
      setSelectedFile(null);
      return;
    }
    setToast(null);
    setSelectedFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setToast({ type: "error", message: "Please select a file first." });
      return;
    }
    mutation.mutate({
      file: selectedFile,
      onProgress: (p) => setUploadProgress(p),
    });
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileSelected(file);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-[12px] border border-brand-mint/45 bg-brand-mint/15 px-3 py-2">
        <p className="text-sm font-medium text-slate-800">Upload vehicle document</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Add insurance, registration, and permit files with expiry tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Document type</label>
          <select
            className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as VehicleDocumentType)}
          >
            {VEHICLE_DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Document number <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Issue date <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Expiry date <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Notes <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          rows={2}
          className="w-full rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div
        className={`mt-1 flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed px-4 py-6 text-center transition-all duration-200 ${
          dragOver
            ? "border-brand bg-brand-mint/35 shadow-sm"
            : "border-border/80 bg-brand-mint/10 hover:border-brand/35 hover:bg-brand-mint/20"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/jpg,image/png"
          onChange={onFileInputChange}
        />
        <span className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
          <UploadCloudIcon className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-slate-800">Drag &amp; drop file here</p>
        <p className="mt-0.5 text-xs text-slate-500">PDF, JPG, PNG up to 10MB</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 inline-flex h-10 items-center rounded-xl border border-brand/60 bg-white px-4 text-sm font-medium text-brand shadow-sm transition-all duration-200 hover:border-brand hover:bg-brand-mint/20"
        >
          Browse files
        </button>
        {selectedFile && (
          <p className="mt-3 text-xs text-slate-600">
            Selected: <span className="font-medium text-slate-800">{selectedFile.name}</span>
          </p>
        )}
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-2">
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-gradient transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="mt-1 text-xs text-ink-muted">Uploading... {uploadProgress}%</p>
        </div>
      )}

      {toast && (
        <p
          className={`text-xs mt-1 ${
            toast.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {toast.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex h-11 items-center rounded-xl bg-brand-gradient px-5 text-sm font-medium text-white shadow-sm hover:opacity-95 hover:shadow-md disabled:opacity-60"
        >
          {mutation.isPending ? "Uploading..." : "Upload document"}
        </button>
      </div>
    </form>
  );
}

