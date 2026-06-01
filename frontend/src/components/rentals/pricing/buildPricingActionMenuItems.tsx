import type { RentalPricing } from "../../../api/rentals";
import type { ActionMenuItemConfig } from "../../theme/ActionMenuDropdown";

function MenuIconWrap({ children, tone }: { children: React.ReactNode; tone: "brand" | "muted" | "danger" }) {
  const toneClass =
    tone === "brand"
      ? "bg-brand/10 text-brand"
      : tone === "danger"
        ? "bg-danger/10 text-danger"
        : "bg-ink/5 text-ink-muted";
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
      {children}
    </span>
  );
}

type BuildPricingActionMenuItemsArgs = {
  row: RentalPricing;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
};

export function buildPricingActionMenuItems({
  row,
  onEdit,
  onDuplicate,
  onArchive,
}: BuildPricingActionMenuItemsArgs): ActionMenuItemConfig[] {
  return [
    {
      id: "edit",
      label: "Edit pricing",
      icon: (
        <MenuIconWrap tone="brand">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onEdit,
    },
    {
      id: "duplicate",
      label: "Duplicate pricing",
      icon: (
        <MenuIconWrap tone="muted">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onDuplicate,
    },
    {
      id: "discount",
      label: "Add discount",
      icon: (
        <MenuIconWrap tone="muted">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: () => {},
      disabled: true,
    },
    {
      id: "history",
      label: "View history",
      icon: (
        <MenuIconWrap tone="muted">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: () => {},
      disabled: true,
    },
    {
      id: "archive",
      label: "Archive",
      icon: (
        <MenuIconWrap tone="danger">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onArchive,
      disabled: !row.is_active,
    },
  ];
}
