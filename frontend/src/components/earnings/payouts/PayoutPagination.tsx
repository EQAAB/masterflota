import { Trans, useTranslation } from "react-i18next";
import { btnSecondary, transitionDefault } from "../../../theme/classNames";

type PayoutPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function PayoutPagination({ page, totalPages, total, onPageChange }: PayoutPaginationProps) {
  const { t } = useTranslation();
  const pages = buildPageList(page, totalPages);

  return (
    <footer
      className={`flex flex-col gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:px-5 ${transitionDefault}`}
    >
      <p className="text-sm text-ink-muted">
        <Trans
          i18nKey="pages.earningsPayouts.payoutsCount"
          count={total}
          values={{ count: total.toLocaleString() }}
          components={{ b: <span className="font-medium text-ink tabular-nums" /> }}
        />
        <span className="mx-2 text-slate-300">·</span>
        <Trans
          i18nKey="pages.earningsPayouts.pageOfPagesLine"
          values={{ page, totalPages }}
          components={{ b: <span className="font-medium text-ink tabular-nums" /> }}
        />
      </p>
      <nav className="flex items-center gap-1" aria-label={t("pages.earningsPayouts.paginationAriaLabel")}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className={`${btnSecondary} !min-h-[36px] !px-3 !py-1.5 !text-xs rounded-lg disabled:opacity-40`}
        >
          {t("common.previous")}
        </button>
        <div className="mx-1 hidden items-center gap-0.5 sm:flex">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-ink-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 rounded-lg text-xs font-medium tabular-nums transition-colors ${
                  p === page
                    ? "bg-brand text-white shadow-sm"
                    : "text-ink-muted hover:bg-slate-100 hover:text-ink"
                }`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="min-h-[36px] rounded-lg bg-brand-gradient px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-40"
        >
          {t("common.next")}
        </button>
      </nav>
    </footer>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  if (current > 3) out.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p += 1) {
    out.push(p);
  }
  if (current < total - 2) out.push("…");
  out.push(total);
  return out;
}
