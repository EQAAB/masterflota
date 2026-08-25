import { useTranslation } from "react-i18next";
import { getVehicleDocumentLabel } from "../../constants/vehicleDocumentTypes";
import type { VehicleDocument } from "../../api/vehicleDocuments";

interface VehicleDocumentDetailProps {
  document: VehicleDocument;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = value.split("T")[0];
  return d || "—";
}

export function VehicleDocumentDetail({ document }: VehicleDocumentDetailProps) {
  const { t } = useTranslation();
  const label = getVehicleDocumentLabel(document.document_type);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">{t("pages.vehicleDocuments.documentSectionTitle")}</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <dt className="text-ink-muted">{t("pages.vehicleDocuments.typeShortLabel")}</dt>
            <dd className="font-medium">{label}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("pages.vehicleDocuments.numberLabel")}</dt>
            <dd className="font-mono text-xs">{document.document_number || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("pages.vehicleDocuments.issueDateLabel")}</dt>
            <dd>{formatDate(document.issue_date)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("pages.vehicleDocuments.expiryDateShortLabel")}</dt>
            <dd>{formatDate(document.expiry_date)}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">{t("pages.vehicleDocuments.fileSectionTitle")}</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <dt className="text-ink-muted">{t("pages.vehicleDocuments.nameLabel")}</dt>
            <dd>{document.file_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("pages.vehicleDocuments.pathLabel")}</dt>
            <dd className="font-mono text-xs break-all">{document.file_path ?? "—"}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">{t("common.status")}</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <dt className="text-ink-muted">{t("pages.vehicleDocuments.verifiedLabel")}</dt>
            <dd>{document.is_verified ? t("common.yes") : t("common.no")}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("pages.vehicleDocuments.verifiedAtLabel")}</dt>
            <dd>{formatDate(document.verified_at)}</dd>
          </div>
        </dl>
      </div>
      {document.notes && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-1">{t("pages.invoiceDetail.notesLabel")}</h3>
          <p className="text-ink whitespace-pre-wrap">{document.notes}</p>
        </div>
      )}
    </div>
  );
}
