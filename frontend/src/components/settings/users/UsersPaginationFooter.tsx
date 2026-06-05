import { transitionDefault } from "../../../theme/classNames";

type UsersPaginationFooterProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
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

export function UsersPaginationFooter({ page, pageSize, total, onPageChange }: UsersPaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  if (total === 0) return null;

  return (
    <footer className={`fm-settings-users__pagination ${transitionDefault}`}>
      <p className="text-sm text-ink-muted">
        Showing <span className="font-medium tabular-nums text-ink">{from}</span> to{" "}
        <span className="font-medium tabular-nums text-ink">{to}</span> of{" "}
        <span className="font-medium tabular-nums text-ink">{total}</span> user{total === 1 ? "" : "s"}
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            disabled={safePage <= 1}
            className="fm-settings-users__page-btn"
            onClick={() => onPageChange(safePage - 1)}
          >
            Prev
          </button>
          {pageNumbers(safePage, totalPages).map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e-${i}`} className="px-1.5 text-xs text-ink-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`fm-settings-users__page-btn ${p === safePage ? "fm-settings-users__page-btn--active" : ""}`}
                aria-current={p === safePage ? "page" : undefined}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={safePage >= totalPages}
            className="fm-settings-users__page-btn"
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </footer>
  );
}
