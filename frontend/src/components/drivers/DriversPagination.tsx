import { useTranslation } from "react-i18next";
import { btnGhost, input, transitionDefault } from "../../theme/classNames";

const PAGE_SIZES = [10, 25, 50, 100] as const;

type DriversPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  selectId?: string;
};

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function DriversPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  selectId = "drivers-page-size",
}: DriversPaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col gap-3 border-t border-border/60 bg-surface-elevated/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${transitionDefault}`}
    >
      <div className="flex flex-wrap items-center gap-2.5 text-sm text-ink-muted">
        <label htmlFor={selectId} className="text-xs font-medium sm:text-sm">
          {t("pagination.rowsPerPage")}
        </label>
        <select
          id={selectId}
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={`${input} min-h-0 w-auto rounded-input py-1.5 text-sm shadow-sm`}
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-xs tabular-nums sm:text-sm">
          {t("pagination.range", { from, to, total: totalItems.toLocaleString() })}
        </span>
      </div>

      <nav className="flex items-center gap-0.5" aria-label={t("pagination.ariaLabel")}>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className={`${btnGhost} rounded-lg px-2.5 py-1.5 text-sm disabled:opacity-40`}
        >
          {t("pagination.prev")}
        </button>
        {pageNumbers(safePage, totalPages).map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1.5 text-ink-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-sm font-medium ${transitionDefault} ${
                p === safePage
                  ? "bg-brand text-white shadow-soft"
                  : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
              aria-current={p === safePage ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className={`${btnGhost} rounded-lg px-2.5 py-1.5 text-sm disabled:opacity-40`}
        >
          {t("pagination.next")}
        </button>
      </nav>
    </div>
  );
}
