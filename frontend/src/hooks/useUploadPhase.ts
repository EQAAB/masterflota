import { useEffect, useState } from "react";

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
  if (!isPending) return "Drag & drop your file here";
  switch (phase) {
    case "uploading":
      return "Uploading file…";
    case "validating":
      return "Validating columns…";
    case "processing":
      return "Processing rows…";
    default:
      return "Processing your file…";
  }
}

export function uploadPhaseDescription(phase: UploadPhase | null, isPending: boolean): string {
  if (!isPending) return "Supports CSV, XLSX, ZIP, XML, PDF · Max 25 MB";
  switch (phase) {
    case "uploading":
      return "Securely receiving your platform export";
    case "validating":
      return "Checking headers and matching drivers";
    case "processing":
      return "Building preview and calculating totals";
    default:
      return "This usually takes a few seconds";
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
