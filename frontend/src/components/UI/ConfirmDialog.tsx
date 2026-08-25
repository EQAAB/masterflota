import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `primary` = sky actions; `danger` = destructive emphasis */
  confirmVariant?: "primary" | "danger";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  /** Merged onto the fixed root (e.g. `z-[110]` to stack above other overlays). */
  rootClassName?: string;
};

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  confirmVariant = "primary",
  isLoading = false,
  onConfirm,
  rootClassName = "",
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleConfirm = useCallback(async () => {
    if (isLoading) return;
    await onConfirm();
  }, [isLoading, onConfirm]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLButtonElement>('button[type="button"]')?.focus();
    }, 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isLoading, onClose]);

  if (!open) return null;

  const confirmClasses =
    confirmVariant === "danger"
      ? "bg-danger text-white hover:opacity-95 focus-visible:ring-danger/40"
      : "bg-brand-gradient text-white hover:opacity-95 focus-visible:ring-brand/40";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6 ${rootClassName}`.trim()}
      role="presentation"
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description || children ? descId : undefined}
        tabIndex={-1}
        className="relative z-[101] w-full max-w-md rounded-card border border-border bg-white p-5 shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:p-6"
        onKeyDown={(e) => {
          if (e.key === "Tab" && panelRef.current) {
            const focusables = panelRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            const list = [...focusables].filter((el) => el.offsetParent !== null || el === document.activeElement);
            if (list.length === 0) return;
            const first = list[0];
            const last = list[list.length - 1];
            if (e.shiftKey) {
              if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
              }
            } else if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        {(description || children) && (
          <div id={descId} className="mt-2 space-y-3 text-sm text-ink-muted">
            {description && <div>{description}</div>}
            {children}
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-btn border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel ?? t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void handleConfirm()}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-btn px-4 py-2.5 text-sm font-semibold shadow-soft focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${confirmClasses}`}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden
                />
                {t("common.pleaseWaitEllipsis")}
              </span>
            ) : (
              confirmLabel ?? t("common.confirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
