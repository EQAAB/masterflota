import i18n from "../i18n";

export type VehicleDocumentType =
  | "insurance"
  | "registration"
  | "maintenance"
  | "inspection"
  | "permit"
  | "other";

export interface VehicleDocumentTypeMeta {
  value: VehicleDocumentType;
  label: string;
  colorClass: string;
}

const VEHICLE_DOCUMENT_TYPE_META: { value: VehicleDocumentType; labelKey: string; colorClass: string }[] = [
  { value: "insurance", labelKey: "pages.vehicleDocuments.insuranceType", colorClass: "bg-purple-100 text-purple-800" },
  { value: "registration", labelKey: "pages.vehicleDocuments.registrationType", colorClass: "bg-blue-100 text-blue-800" },
  { value: "maintenance", labelKey: "pages.vehicleDocuments.maintenanceType", colorClass: "bg-amber-100 text-amber-800" },
  { value: "inspection", labelKey: "pages.vehicleDocuments.inspectionType", colorClass: "bg-emerald-100 text-emerald-800" },
  { value: "permit", labelKey: "pages.vehicleDocuments.permitType", colorClass: "bg-slate-100 text-ink" },
  { value: "other", labelKey: "pages.vehicleDocuments.otherType", colorClass: "bg-gray-100 text-gray-800" },
];

export function getVehicleDocumentTypes(): VehicleDocumentTypeMeta[] {
  return VEHICLE_DOCUMENT_TYPE_META.map((m) => ({
    value: m.value,
    label: i18n.t(m.labelKey),
    colorClass: m.colorClass,
  }));
}

export function getVehicleDocumentLabel(type: VehicleDocumentType | string): string {
  const meta = VEHICLE_DOCUMENT_TYPE_META.find((m) => m.value === type);
  return meta ? i18n.t(meta.labelKey) : type;
}

export function getVehicleDocumentLabels(): Record<VehicleDocumentType, string> {
  return VEHICLE_DOCUMENT_TYPE_META.reduce(
    (acc, m) => {
      acc[m.value] = i18n.t(m.labelKey);
      return acc;
    },
    {} as Record<VehicleDocumentType, string>,
  );
}
