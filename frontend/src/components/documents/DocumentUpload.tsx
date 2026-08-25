import type { DragEvent, FormEvent, ChangeEvent } from "react";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  uploadDocument,
  type DocumentType,
} from "../../api/documents";

const DOCUMENT_TYPE_KEYS: { value: DocumentType; labelKey: string }[] = [
  { value: "trc_card", labelKey: "pages.driverDocuments.trcCardType" },
  { value: "drivers_license", labelKey: "pages.driverDocuments.driversLicenseType" },
  { value: "contract", labelKey: "pages.driverDocuments.contractType" },
  { value: "insurance", labelKey: "pages.driverDocuments.insuranceType" },
  { value: "vehicle_permit", labelKey: "pages.driverDocuments.vehiclePermitType" },
  { value: "passport", labelKey: "pages.driverDocuments.passportType" },
  { value: "other", labelKey: "pages.driverDocuments.otherType" },
];

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

function validateFile(file: File, t: (key: string) => string): string | null {
  if (file.size > MAX_SIZE) return t("pages.driverDocuments.fileTooLargeError");
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  const ok = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXT.includes(ext);
  if (!ok) return t("pages.driverDocuments.onlyPdfJpgPngError");
  return null;
}

interface DocumentUploadProps {
  driverId: string;
  onSuccess?: () => void;
}

export function DocumentUpload({ driverId, onSuccess }: DocumentUploadProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("drivers_license");
  const [expiryDate, setExpiryDate] = useState("");
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
      if (expiryDate) form.append("expiryDate", expiryDate);
      if (notes.trim()) form.append("notes", notes.trim());
      return uploadDocument(driverId, form, onProgress);
    },
    onSuccess: () => {
      setToast({ type: "success", message: t("pages.driverDocuments.documentUploadedSuccess") });
      setSelectedFile(null);
      setExpiryDate("");
      setNotes("");
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["driver", driverId] });
      queryClient.invalidateQueries({ queryKey: ["documents", driverId] });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setToast({
        type: "error",
        message: (err as Error).message || t("pages.driverDocuments.uploadFailedError"),
      });
      setUploadProgress(0);
    },
  });

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file, t);
    if (err) {
      setToast({ type: "error", message: err });
      return;
    }
    setSelectedFile(file);
    setToast(null);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, t);
    if (err) {
      setToast({ type: "error", message: err });
      return;
    }
    setSelectedFile(file);
    setToast(null);
    e.target.value = "";
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setToast({ type: "error", message: t("pages.driverDocuments.pleaseSelectFileError") });
      return;
    }
    setToast(null);
    mutation.mutate({
      file: selectedFile,
      onProgress: setUploadProgress,
    });
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setToast(null);
  };

  const isImage = selectedFile?.type.startsWith("image/");
  const isPdf = selectedFile?.type === "application/pdf";

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            rounded-[14px] border-2 border-dashed p-5 text-center transition-all duration-200
            ${dragOver ? "border-brand bg-brand-mint/35 shadow-sm" : "border-border/80 bg-brand-mint/10 hover:border-brand/40 hover:bg-brand-mint/20"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2.5">
              {isImage && (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="max-h-24 rounded object-cover"
                />
              )}
              {isPdf && (
                <div className="w-12 h-16 bg-red-100 rounded flex items-center justify-center text-red-600 text-xs font-medium">
                  PDF
                </div>
              )}
              {!isImage && !isPdf && (
                <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center text-ink-muted text-xs">
                  {t("pages.vehicleDocuments.fileSectionTitle")}
                </div>
              )}
              <p className="max-w-full truncate text-sm font-medium text-ink">
                {selectedFile.name}
              </p>
              <p className="text-xs text-ink-muted">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              {mutation.isPending && (
                <div className="w-full max-w-xs bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-brand-gradient transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {t("pages.driverDocuments.changeFileButton")}
                </button>
                {mutation.isPending && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-sm text-ink-muted hover:underline"
                  >
                    {t("common.cancel")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <span className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <UploadCloudIcon className="h-5 w-5" />
              </span>
              <p className="mb-1 text-sm font-medium text-slate-800">
                {t("pages.driverDocuments.dragDropOrClickText")}
              </p>
              <p className="mb-3 text-xs text-slate-500">{t("pages.driverDocuments.uploadInSecondsDesc")}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center rounded-xl border border-brand/60 bg-white px-4 text-sm font-medium text-brand shadow-sm transition-all duration-200 hover:border-brand hover:bg-brand-mint/20"
              >
                {t("pages.driverDocuments.selectFileButton")}
              </button>
              <p className="mt-2 text-xs text-slate-500">
                {t("pages.driverDocuments.pdfJpgPngMax10MbText")}
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("pages.driverDocuments.documentTypeRequiredLabel")}
            </label>
            <select
              required
              className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            >
              {DOCUMENT_TYPE_KEYS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("pages.driverDocuments.expiryDateOptionalLabel")}
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
            {t("pages.driverDocuments.notesOptionalLabel")}
          </label>
          <input
            type="text"
            className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("pages.driverDocuments.optionalNotesPlaceholder")}
          />
        </div>

        {toast && (
          <p
            className={`text-sm ${
              toast.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {toast.message}
          </p>
        )}

        <button
          type="submit"
          disabled={!selectedFile || mutation.isPending}
          className="inline-flex h-11 items-center rounded-xl bg-brand-gradient px-5 text-sm font-medium text-white shadow-sm hover:opacity-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              {t("pages.driverDetail.uploadingButton")}
            </>
          ) : (
            t("pages.driverDocuments.uploadButton")
          )}
        </button>
      </form>
    </div>
  );
}
