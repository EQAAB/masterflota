import { useTranslation } from "react-i18next";
import { transitionDefault } from "../../../theme/classNames";
import type { UploadPhase } from "../../../hooks/useUploadPhase";
import { PHASE_ORDER } from "../../../hooks/useUploadPhase";

type UploadPhaseStepsProps = {
  phase: UploadPhase | null;
  active: boolean;
};

export function UploadPhaseSteps({ phase, active }: UploadPhaseStepsProps) {
  const { t } = useTranslation();
  const STEP_LABELS: Record<UploadPhase, string> = {
    uploading: t("pages.earningsImport.uploadStepLabel"),
    validating: t("pages.earningsImport.validateStepLabel"),
    processing: t("pages.earningsImport.processStepLabel"),
  };
  if (!active) return null;

  const currentIdx = phase ? PHASE_ORDER.indexOf(phase) : 0;

  return (
    <div className="mt-3 flex items-center gap-1.5">
      {PHASE_ORDER.map((step, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1.5">
            {idx > 0 && <span className="h-px w-3 bg-border/80" aria-hidden />}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${transitionDefault} ${
                done
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
                  : current
                    ? "bg-brand-mint/70 text-brand-dark ring-1 ring-brand/20"
                    : "bg-surface text-ink-muted ring-1 ring-border/60"
              }`}
            >
              {done && (
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {current && !done && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden />
              )}
              {STEP_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
