import { useCallback, useMemo, useState } from "react";
import type { EarningsImportListItem } from "../../../api/earnings";
import { importProcessedRows, importTotalRows } from "../../../api/earnings";
import {
  BoltPlatformLogo,
  GlovoPlatformLogo,
  UberPlatformLogo,
  WoltPlatformLogo,
} from "../../drivers/platformLogos";
import { ActionMenuDropdown } from "../../theme/ActionMenuDropdown";
import { EmptyState } from "../../theme/EmptyState";
import { actionMenuTrigger, btnSecondary, transitionDefault } from "../../../theme/classNames";
import { DotsVerticalIcon } from "../../theme/actionMenuIcons";
import { buildImportActionMenuItems } from "./buildImportActionMenuItems";
import { ImportWhatsNextBanner } from "./ImportWhatsNextBanner";
import {
  earningsPlatformToBadgeKey,
  formatFileSizeLabel,
  formatImportDate,
  formatImportTime,
  formatPeriodDate,
  importProgressPct,
  importStatusDisplay,
} from "./importDisplayUtils";

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 4v5h5M20 20v-5h-5M20 8a8 8 0 00-14.9-3M4 16a8 8 0 0014.9 3"
      />
    </svg>
  );
}

function CsvFileIcon() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </span>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlatformCell({ platform }: { platform: string }) {
  const key = earningsPlatformToBadgeKey(platform);
  const Logo =
    key === "uber"
      ? UberPlatformLogo
      : key === "glovo"
        ? GlovoPlatformLogo
        : key === "bolt"
          ? BoltPlatformLogo
          : key === "wolt"
            ? WoltPlatformLogo
            : null;

  return (
    <div className="flex items-center gap-2">
      {Logo ? <Logo /> : null}
      <span className="text-sm lowercase text-ink">{platform.replace(/_/g, " ")}</span>
    </div>
  );
}

const STATUS_STYLES = {
  success: "bg-success/10 text-success ring-1 ring-success/20",
  warning: "bg-warning/10 text-warning ring-1 ring-warning/20",
  purple: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
  muted: "bg-surface text-ink-muted ring-1 ring-border",
} as const;

const tableCell = "px-4 py-4 lg:px-5 lg:py-[1.125rem] align-middle";
const tableHeaderCell = `${tableCell} text-left`;
const headerLabel = "text-[11px] font-semibold uppercase tracking-wider text-ink-muted";

type RecentImportsTableProps = {
  rows: EarningsImportListItem[];
  isLoading: boolean;
  busy: boolean;
  isAdmin: boolean;
  onResync: () => void;
  resyncPending: boolean;
  onDelete: (id: string) => void;
  onRevert: (id: string) => void;
};

export function RecentImportsTable({
  rows,
  isLoading,
  busy,
  isAdmin,
  onResync,
  resyncPending,
  onDelete,
  onRevert,
}: RecentImportsTableProps) {
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuRowId(null);
    setMenuAnchorEl(null);
  }, []);

  const openRow = openMenuRowId ? rows.find((r) => r.id === openMenuRowId) : undefined;

  const menuItems = useMemo(() => {
    if (!openRow) return [];
    const processed = importProcessedRows(openRow);
    const canDelete = processed === 0;
    const canRevert = openRow.status === "completed" && processed > 0;
    return buildImportActionMenuItems({
      canDelete,
      canRevert,
      onDelete: () => {
        closeMenu();
        onDelete(openRow.id);
      },
      onRevert: () => {
        closeMenu();
        onRevert(openRow.id);
      },
    });
  }, [openRow, closeMenu, onDelete, onRevert]);

  return (
    <section id="recent-imports" className="scroll-mt-6 overflow-hidden rounded-[20px] border border-border/80 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold tracking-tight text-ink">Recent imports</h2>
        <button
          type="button"
          disabled={busy || resyncPending}
          onClick={onResync}
          className={`${btnSecondary} gap-2 text-sm ${transitionDefault}`}
        >
          <RefreshIcon className="h-4 w-4 text-ink-muted" />
          {resyncPending ? "Re-syncing…" : "Re-sync vehicle rentals"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <span
            className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent"
            role="status"
            aria-label="Loading imports"
          />
          <p className="text-sm text-ink-muted">Loading recent imports…</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No imports yet"
          description="Upload your first earnings file to see import history here."
          className="border-0 py-16"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-sm">
            <thead className="bg-[#F7F8FC]">
              <tr>
                <th className={`${tableHeaderCell} min-w-[240px]`}><span className={headerLabel}>File</span></th>
                <th className={`${tableHeaderCell} w-[120px]`}><span className={headerLabel}>Platform</span></th>
                <th className={`${tableHeaderCell} w-[140px]`}><span className={headerLabel}>Period</span></th>
                <th className={`${tableHeaderCell} w-[120px]`}><span className={headerLabel}>Status</span></th>
                <th className={`${tableHeaderCell} w-[120px]`}><span className={headerLabel}>Processed / Total</span></th>
                <th className={`${tableHeaderCell} w-[120px]`}><span className={headerLabel}>Created</span></th>
                {isAdmin && (
                  <th className={`${tableHeaderCell} w-[56px] text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const processed = importProcessedRows(row);
                const total = importTotalRows(row);
                const pct = importProgressPct(row);
                const status = importStatusDisplay(row.status);
                const isEven = index % 2 === 1;
                const canDelete = processed === 0;
                const canRevert = row.status === "completed" && processed > 0;
                const hasActions = isAdmin && (canDelete || canRevert);

                return (
                  <tr
                    key={row.id}
                    className={`${transitionDefault} ${isEven ? "bg-[#FAFBFD]" : "bg-white"} hover:bg-brand-mint/25`}
                  >
                    <td className={tableCell}>
                      <div className="flex min-w-0 items-center gap-3">
                        <CsvFileIcon />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink" title={row.file_name ?? undefined}>
                            {row.file_name ?? "—"}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted">{formatFileSizeLabel(row.file_name)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tableCell}>
                      <PlatformCell platform={row.platform} />
                    </td>
                    <td className={tableCell}>
                      <div className="flex items-start gap-2 whitespace-nowrap">
                        <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted/80" />
                        <div>
                          <p className="tabular-nums text-ink">{formatPeriodDate(row.week_start)}</p>
                          <p className="text-xs text-ink-muted">– {formatPeriodDate(row.week_end)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tableCell}>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status.tone]}`}
                      >
                        {status.tone === "success" && <CheckIcon className="h-3 w-3" />}
                        {status.label}
                      </span>
                    </td>
                    <td className={tableCell}>
                      <p className="font-medium tabular-nums text-ink">
                        {processed} / {total}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">{pct}%</p>
                    </td>
                    <td className={tableCell}>
                      <div className="flex items-start gap-2 whitespace-nowrap">
                        <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted/80" />
                        <div>
                          <p className="tabular-nums text-ink">{formatImportDate(row.created_at)}</p>
                          <p className="text-xs tabular-nums text-ink-muted">{formatImportTime(row.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className={`${tableCell} text-right`}>
                        {hasActions ? (
                          <button
                            type="button"
                            aria-label="Import actions"
                            aria-haspopup="menu"
                            aria-expanded={openMenuRowId === row.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuRowId === row.id) {
                                closeMenu();
                                return;
                              }
                              setOpenMenuRowId(row.id);
                              setMenuAnchorEl(e.currentTarget);
                            }}
                            className={`${actionMenuTrigger} ${transitionDefault} ${openMenuRowId === row.id ? "ring-2 ring-brand/25" : ""}`}
                          >
                            <DotsVerticalIcon />
                          </button>
                        ) : null}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ImportWhatsNextBanner />

      <ActionMenuDropdown
        open={openMenuRowId !== null && menuAnchorEl !== null}
        anchorEl={menuAnchorEl}
        items={menuItems}
        align="right"
        onClose={closeMenu}
      />
    </section>
  );
}
