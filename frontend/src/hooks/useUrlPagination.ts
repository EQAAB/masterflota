import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

type UseUrlPaginationOptions = {
  defaultPage?: number;
  defaultLimit?: number;
};

export function useUrlPagination(options: UseUrlPaginationOptions = {}) {
  const defaultPage = options.defaultPage ?? DEFAULT_PAGE;
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo(
    () => parsePositiveInt(searchParams.get("page"), defaultPage),
    [searchParams, defaultPage],
  );

  const limit = useMemo(
    () => parsePositiveInt(searchParams.get("limit"), defaultLimit),
    [searchParams, defaultLimit],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const safePage = Math.max(1, nextPage);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (safePage === defaultPage) {
            next.delete("page");
          } else {
            next.set("page", String(safePage));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaultPage],
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      const safeLimit = Math.max(1, nextLimit);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (safeLimit === defaultLimit) {
            next.delete("limit");
          } else {
            next.set("limit", String(safeLimit));
          }
          next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaultLimit],
  );

  return { page, limit, setPage, setLimit };
}
