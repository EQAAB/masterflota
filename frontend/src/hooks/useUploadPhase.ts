import { useEffect, useState } from "react";
import i18n from "../i18n";

export type UploadPhase = "uploading" | "validating" | "processing";

const PHASE_ORDER: UploadPhase[] = ["uploading", "validating", "processing"];

export function useUploadPhase(isPending: boolean): UploadPhase | null {
  const [phase, setPhase] = useState<UploadPhase | null>(null);

  useEffect(() => {
    if (!isPending) {
      setPhase(null);
      return;
    }
    setPhase("uploading");
    const validatingTimer = window.setTimeout(() => setPhase("validating"), 700);
    const processingTimer = window.setTimeout(() => setPhase("processing"), 2000);
    return () => {
      window.clearTimeout(validatingTimer);
      window.clearTimeout(processingTimer);
    };
  }, [isPending]);

  return phase;
}

export function uploadPhaseLabel(phase: UploadPhase | null, isPending: boolean): string {
  if (!isPending) return i18n.t("pages.earningsImport.dragDropFileHereText");
  switch (phase) {
    case "uploading":
      return i18n.t("pages.earningsImport.uploadingFileEllipsis");
    case "validating":
      return i18n.t("pages.earningsImport.validatingColumnsEllipsis");
    case "processing":
      return i18n.t("pages.earningsImport.processingRowsEllipsis");
    default:
      return i18n.t("pages.earningsImport.processingYourFileEllipsis");
  }
}

export function uploadPhaseDescription(phase: UploadPhase | null, isPending: boolean): string {
  if (!isPending) return i18n.t("pages.earningsImport.supportsFileTypesDesc");
  switch (phase) {
    case "uploading":
      return i18n.t("pages.earningsImport.securelyReceivingDesc");
    case "validating":
      return i18n.t("pages.earningsImport.checkingHeadersDesc");
    case "processing":
      return i18n.t("pages.earningsImport.buildingPreviewDesc");
    default:
      return i18n.t("pages.earningsImport.usuallyTakesSecondsDesc");
  }
}

export function uploadPhaseProgress(phase: UploadPhase | null, isPending: boolean): number {
  if (!isPending) return 0;
  if (phase === "uploading") return 28;
  if (phase === "validating") return 62;
  if (phase === "processing") return 88;
  return 15;
}

export { PHASE_ORDER };
