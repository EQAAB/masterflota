/** Central Fleet Manager design-system class strings (Tailwind). */

export const transitionDefault = "transition-all duration-200 ease-out";

export const pageContainer = "max-w-[1600px] mx-auto w-full p-4 sm:p-6 space-y-6";

export const pageTitle = "text-xl sm:text-2xl font-semibold tracking-tight text-ink";

export const pageSubtitle = "text-sm text-ink-muted mt-1 leading-relaxed";

export const sectionLabel =
  "block text-xs font-medium uppercase tracking-wide text-ink-muted mb-1.5";

export const card =
  "rounded-card border border-border bg-white shadow-soft p-4 sm:p-5 " + transitionDefault;

export const cardHover =
  card + " hover:-translate-y-0.5 hover:shadow-soft-lg";

export const cardGlass =
  "rounded-card border border-white/40 bg-white/80 backdrop-blur-md shadow-soft p-4 sm:p-5 " +
  transitionDefault;

export const input =
  "w-full rounded-input border border-border bg-white px-3 py-2.5 text-sm text-ink shadow-sm outline-none placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/20 min-h-[44px]";

export const inputCompact = input.replace("min-h-[44px]", "min-h-0");

export const btnPrimary =
  "inline-flex items-center justify-center rounded-btn bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white shadow-soft " +
  transitionDefault +
  " hover:opacity-95 hover:shadow-soft-lg disabled:opacity-50 min-h-[44px] sm:min-h-0";

export const btnSecondary =
  "inline-flex items-center justify-center rounded-btn border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink " +
  transitionDefault +
  " hover:bg-surface disabled:opacity-50 min-h-[44px] sm:min-h-0";

export const btnNavy =
  "inline-flex items-center justify-center rounded-btn border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-soft " +
  transitionDefault +
  " hover:bg-slate-800 hover:border-slate-800 hover:shadow-soft-lg disabled:opacity-50 min-h-[44px] sm:min-h-0";

export const btnGhost =
  "inline-flex items-center justify-center rounded-btn border border-transparent px-3 py-2 text-xs font-medium text-ink-muted " +
  transitionDefault +
  " hover:bg-surface hover:text-ink disabled:opacity-50";

export const btnDangerOutline =
  "inline-flex items-center justify-center rounded-btn border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm font-medium text-danger " +
  transitionDefault +
  " hover:bg-danger/10 disabled:opacity-50";

export const tableWrap =
  "overflow-x-auto shadow-[inset_-8px_0_8px_-8px_rgba(0,0,0,0.08)]";

export const tableHeader =
  "sticky top-0 z-10 bg-surface/95 backdrop-blur text-xs font-medium uppercase tracking-wide text-ink-muted";

export const tableRow = "align-top text-ink hover:bg-surface/80";

export const tableRowAlert =
  "align-top text-ink bg-danger/5 shadow-[inset_3px_0_0_0_#ef4444] hover:bg-danger/10";

export const tableRowExpandable = "cursor-pointer hover:bg-surface/60";

/** Expanded payout row accent without layout-shifting borders */
export const tableRowExpandedAccent = "shadow-[inset_3px_0_0_0_#0b7a6e] bg-surface/30";

export const tableZebraEven = "even:bg-white";

export const tableZebraOdd = "odd:bg-surface/30";

export const tableCell = "px-3 py-2.5 lg:px-4 lg:py-3";

export const tableCellCompact = "px-3 py-2.5";

export const linkAccent = "text-brand font-medium hover:underline";

export const alertError =
  "rounded-card border border-danger/20 bg-danger/5 text-danger text-sm px-4 py-2.5";

export const alertSuccess =
  "rounded-card border border-success/20 bg-success/5 text-success text-sm px-4 py-2.5";

export const alertInfo =
  "rounded-card border border-brand-mint bg-brand-mint/50 text-ink text-sm px-4 py-2.5";

export const actionMenuTrigger =
  "inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-white text-ink-muted shadow-sm hover:bg-surface hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand/20";

export const actionMenuPanel =
  "rounded-[14px] border border-border bg-white p-2 shadow-soft-lg ring-1 ring-black/[0.04]";

export const actionMenuItem =
  "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-sm font-medium text-ink hover:bg-surface/90";

export const dashboardPage =
  "mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-10";

export const dashboardSectionTitle = "text-base font-semibold tracking-tight text-ink";

export const kpiCard =
  "flex min-h-[120px] flex-col rounded-2xl border border-border/80 bg-surface-card p-5 shadow-card " +
  transitionDefault;

export const kpiCardHover = kpiCard + " hover:-translate-y-0.5 hover:shadow-card-hover";

export const chartCard =
  "rounded-2xl border border-border/80 bg-surface-card p-5 shadow-card sm:p-6 " + transitionDefault;

export const emptyStateWrap =
  "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-elevated/80 px-6 py-12 text-center";

export const sidebarNavItem =
  "relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out min-h-[40px]";

export const sidebarNavActive =
  "bg-brand-mint text-ink shadow-sidebar-glow ring-1 ring-white/20";

export const sidebarNavInactive = "text-white/75 hover:bg-white/10 hover:text-white";

export const driversPage =
  "mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8";

export const driversFilterCard =
  "rounded-2xl border border-border/80 bg-surface-card p-4 shadow-card sm:p-5 " + transitionDefault;

export const driversTableCard =
  "overflow-hidden rounded-2xl border border-border/80 bg-surface-card shadow-card";

export const driversTableRowOdd = "bg-white";

export const driversTableRowEven = "bg-brand-mint/[0.04]";

export const driversTableRowHover = "hover:bg-surface/80 " + transitionDefault;

/** @deprecated Use imports from theme/classNames */
export const EARNINGS_SURFACE_CARD = cardGlass;
export const EARNINGS_INPUT = input;
export const EARNINGS_LABEL = sectionLabel;
