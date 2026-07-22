import { useCallback, useMemo, useState } from "react";
import type { EarningsImportListItem } from "../../../api/earnings";
import { importProcessedRows, importTotalRows } from "../../../api/earnings";
import { PlatformBadge } from "../../drivers/platformLogos";
import { ActionMenuDropdown } from "../../theme/ActionMenuDropdown";
import { btnSecondary, transitionDefault } from "../../../theme/classNames";
import { DotsVerticalIcon } from "../../theme/actionMenuIcons";
import { buildImportActionMenuItems } from "./buildImportActionMenuItems";
import { ImportEmptyState, ImportFailedEmptyHint, ImportWhatsNextBanner } from "./ImportWhatsNextBanner";
import {
  earningsPlatformToBadgeKey,
  formatFileSizeLabel,
  formatImportDate,
  formatImportTime,
  formatPeriodDate,
  importProgressPct,
  importStatusDisplay,
  type ImportStatusTone,
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
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-mint/45 text-brand ring-1 ring-brand/10">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlatformCell({ platform }: { platform: string }) {
  const key = earningsPlatformToBadgeKey(platform);
  if (key) {
    return <PlatformBadge platform={key} compact />;
  }
  return (
    <span className="platform-table-badge">
      <span className="platform-table-badge__label capitalize">{platform.replace(/_/g, " ")}</span>
    </span>
  );
}

const STATUS_STYLES: Record<ImportStatusTone, string> = {
  success: "bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-200/60",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/60",
  purple: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
  muted: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
  processing: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60",
  pending: "bg-slate-50 text-slate-600 ring-1 ring-slate-200/60",
  validating: "bg-brand-mint/70 text-brand-dark ring-1 ring-brand/15",
  failed: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
};

function StatusBadge({ tone, label }: { tone: ImportStatusTone; label: string }) {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[10px] font-medium leading-none ${STATUS_STYLES[tone]}`}>
      {tone === "success" && <CheckIcon className="h-2.5 w-2.5 shrink-0" />}
      {(tone === "processing" || tone === "validating") && <SpinnerIcon className="h-2.5 w-2.5 shrink-0" />}
      {tone === "failed" && <XIcon className="h-2.5 w-2.5 shrink-0" />}
      {label}
    </span>
  );
}

const tableCell = "px-4 py-3.5 align-middle";
const tableHeaderCell = `${tableCell} text-left`;
const headerLabel = "text-[10px] font-semibold uppercase tracking-wider text-slate-500";

type RecentImportsTableProps = {
  rows: EarningsImportListItem[];
  isLoading: boolean;
  busy: boolean;
  canDeleteEmptyImport: boolean;
  canRevertImport: boolean;
  canResync?: boolean;
  onResync: () => void;
  resyncPending: boolean;
  onDelete: (id: string) => void;
  onRevert: (id: string) => void;
};

export function RecentImportsTable({
  rows,
  isLoading,
  busy,
  canDeleteEmptyImport,
  canRevertImport,
  canResync = false,
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

  const showImportActions = canDeleteEmptyImport || canRevertImport;

  const openRow = openMenuRowId ? rows.find((r) => r.id === openMenuRowId) : undefined;
  const hasFailedImports = rows.some((r) => r.status === "failed");

  const menuItems = useMemo(() => {
    if (!openRow) return [];
    const processed = importProcessedRows(openRow);
    const canDelete = processed === 0 && canDeleteEmptyImport;
    const canRevert = openRow.status === "completed" && processed > 0 && canRevertImport;
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
  }, [openRow, closeMenu, onDelete, onRevert, canDeleteEmptyImport, canRevertImport]);

  return (
    <section
      id="recent-imports"
      className="scroll-mt-4 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.07)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">Recent imports</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {rows.length > 0 ? `${rows.length} import${rows.length === 1 ? "" : "s"} · validation & processing status` : "Track validation, processing, and completion"}
          </p>
        </div>
        {canResync && (
        <button
          type="button"
          disabled={busy || resyncPending}
          onClick={onResync}
          className={`${btnSecondary} h-9 gap-2 rounded-xl border-border/60 px-3 text-sm shadow-sm ${transitionDefault} hover:shadow-md`}
        >
          <RefreshIcon className={`h-4 w-4 text-ink-muted ${resyncPending ? "animate-spin" : ""}`} />
          {resyncPending ? "Re-syncing…" : "Re-sync rentals"}
        </button>
        )}
      </div>

      {hasFailedImports && rows.length > 0 && <ImportFailedEmptyHint />}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <span
            className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent"
            role="status"
            aria-label="Loading imports"
          />
          <p className="text-sm text-ink-muted">Loading recent imports…</p>
        </div>
      ) : rows.length === 0 ? (
        <ImportEmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-sm">
            <thead className="sticky top-0 z-10 border-b border-border/50 bg-white/95 backdrop-blur-sm">
              <tr>
                <th className={`${tableHeaderCell} min-w-[220px]`}>
                  <span className={headerLabel}>File</span>
                </th>
                <th className={`${tableHeaderCell} w-[140px]`}>
                  <span className={headerLabel}>Platform</span>
                </th>
                <th className={`${tableHeaderCell} w-[128px]`}>
                  <span className={headerLabel}>Period</span>
                </th>
                <th className={`${tableHeaderCell} w-[108px]`}>
                  <span className={headerLabel}>Status</span>
                </th>
                <th className={`${tableHeaderCell} w-[96px] text-right`}>
                  <span className={headerLabel}>Processed</span>
                </th>
                <th className={`${tableHeaderCell} w-[116px]`}>
                  <span className={headerLabel}>Created</span>
                </th>
                {showImportActions && (
                  <th className={`${tableHeaderCell} w-[48px] text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/25">
              {rows.map((row) => {
                const processed = importProcessedRows(row);
                const total = importTotalRows(row);
                const pct = importProgressPct(row);
                const status = importStatusDisplay(row.status);
                const canDelete = processed === 0 && canDeleteEmptyImport;
                const canRevert = row.status === "completed" && processed > 0 && canRevertImport;
                const hasActions = showImportActions && (canDelete || canRevert);

                return (
                  <tr key={row.id} className={`bg-white ${transitionDefault} hover:bg-brand-mint/10`}>
                    <td className={tableCell}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CsvFileIcon />
                        <div className="min-w-0">
                          <p
                            className="truncate text-[13px] text-ink"
                            title={row.file_name ?? undefined}
                          >
                            {row.file_name ?? "—"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-ink-muted">{formatFileSizeLabel(row.file_name)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tableCell}>
                      <PlatformCell platform={row.platform} />
                    </td>
                    <td className={tableCell}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted/60" />
                        <div>
                          <p className="text-[13px] tabular-nums text-ink">{formatPeriodDate(row.week_start)}</p>
                          <p className="text-[10px] tabular-nums text-ink-muted">– {formatPeriodDate(row.week_end)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tableCell}>
                      <StatusBadge tone={status.tone} label={status.label} />
                    </td>
                    <td className={`${tableCell} text-right`}>
                      <p className="text-[13px] font-medium tabular-nums text-ink">
                        {processed}
                        <span className="font-normal text-ink-muted/80"> / {total}</span>
                      </p>
                      <p className="text-[10px] tabular-nums text-ink-muted/70">{pct}%</p>
                    </td>
                    <td className={tableCell}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <ClockIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted/60" />
                        <div>
                          <p className="text-[13px] tabular-nums text-ink">{formatImportDate(row.created_at)}</p>
                          <p className="text-[10px] tabular-nums text-ink-muted">{formatImportTime(row.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    {showImportActions && (
                      <td className={`${tableCell} text-right !pr-3`}>
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
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted ${transitionDefault} hover:bg-surface hover:text-ink ${openMenuRowId === row.id ? "bg-surface text-ink ring-2 ring-brand/12" : ""}`}
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
