import type { ReactNode } from "react";
import type { ActionMenuItemConfig } from "../../theme/ActionMenuDropdown";
import type { SubcontractorSettlementRow } from "../../../api/earnings";
import { canMarkSettlementPaid } from "./settlementsDisplayUtils";

function MenuIconWrap({ children, tone }: { children: ReactNode; tone: "brand" | "muted" | "success" }) {
  const toneClass =
    tone === "brand"
      ? "bg-brand/10 text-brand"
      : tone === "success"
        ? "bg-success/10 text-success"
        : "bg-ink/5 text-ink-muted";
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
      {children}
    </span>
  );
}

function ViewIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
    </svg>
  );
}

type BuildSettlementActionMenuItemsArgs = {
  row: SubcontractorSettlementRow;
  exportBusy: boolean;
  markPaidPending: boolean;
  onViewDetails: () => void;
  onMarkPaid: () => void;
  onExport: () => void;
};

export function buildSettlementActionMenuItems({
  row,
  exportBusy,
  markPaidPending,
  onViewDetails,
  onMarkPaid,
  onExport,
}: BuildSettlementActionMenuItemsArgs): ActionMenuItemConfig[] {
  const canPay = canMarkSettlementPaid(row);

  return [
    {
      id: "view-details",
      label: "View details",
      icon: (
        <MenuIconWrap tone="brand">
          <ViewIcon />
        </MenuIconWrap>
      ),
      onSelect: onViewDetails,
      hidden: !row.id,
    },
    {
      id: "mark-paid",
      label: "Mark paid",
      icon: (
        <MenuIconWrap tone="success">
          <CheckIcon />
        </MenuIconWrap>
      ),
      onSelect: onMarkPaid,
      hidden: !canPay,
      disabled: markPaidPending,
    },
    {
      id: "export-settlement",
      label: exportBusy ? "Exporting…" : "Export settlement",
      icon: (
        <MenuIconWrap tone="muted">
          <ExportIcon />
        </MenuIconWrap>
      ),
      onSelect: onExport,
      disabled: exportBusy,
    },
  ];
}
