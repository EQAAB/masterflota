import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  actionMenuItem,
  actionMenuPanel,
  transitionDefault,
} from "../../theme/classNames";

export type ActionMenuItemConfig = {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  hidden?: boolean;
};

export function actionMenuHasVisibleItems(items: ActionMenuItemConfig[]): boolean {
  return items.some((item) => !item.hidden);
}

export type ActionMenuDropdownProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  items: ActionMenuItemConfig[];
  align?: "left" | "right";
  disabled?: boolean;
  onClose: () => void;
};

type PanelPos = {
  top: number;
  left: number;
  placement: "bottom" | "top";
};

const MENU_WIDTH = 190;
const MENU_GAP = 8;
const VIEWPORT_PAD = 8;
const Z_BACKDROP = 9998;
const Z_PANEL = 9999;
const ITEM_HEIGHT_ESTIMATE = 44;

function isValidAnchorRect(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
}

export function computeActionMenuPosition(
  trigger: DOMRect,
  panelHeight: number,
  align: "left" | "right",
): PanelPos | null {
  if (!isValidAnchorRect(trigger)) return null;

  let left = align === "right" ? trigger.right - MENU_WIDTH : trigger.left;
  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_PAD));

  const belowTop = trigger.bottom + MENU_GAP;
  const aboveTop = trigger.top - panelHeight - MENU_GAP;
  const fitsBelow = belowTop + panelHeight <= window.innerHeight - VIEWPORT_PAD;
  const fitsAbove = aboveTop >= VIEWPORT_PAD;

  let top: number;
  let placement: "bottom" | "top";
  if (fitsBelow || (!fitsAbove && trigger.bottom <= window.innerHeight / 2)) {
    top = belowTop;
    placement = "bottom";
  } else {
    top = Math.max(VIEWPORT_PAD, aboveTop);
    placement = "top";
  }

  if (top + panelHeight > window.innerHeight - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, window.innerHeight - panelHeight - VIEWPORT_PAD);
  }

  return { top, left, placement };
}

export function ActionMenuDropdown({
  open,
  anchorEl,
  items,
  align = "right",
  disabled = false,
  onClose,
}: ActionMenuDropdownProps) {
  const menuDomId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PanelPos | null>(null);

  const visibleItems = items.filter((i) => !i.hidden);

  const updatePosition = useCallback(() => {
    if (!anchorEl || !open) {
      setPos(null);
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const panelHeight =
      panelRef.current?.offsetHeight ?? visibleItems.length * ITEM_HEIGHT_ESTIMATE + 16;
    const next = computeActionMenuPosition(rect, panelHeight, align);
    setPos(next);
  }, [anchorEl, open, align, visibleItems.length]);

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setPos(null);
      return;
    }

    const rect = anchorEl.getBoundingClientRect();
    if (!isValidAnchorRect(rect)) {
      setPos(null);
      onClose();
      return;
    }

    const estimated = visibleItems.length * ITEM_HEIGHT_ESTIMATE + 16;
    const initial = computeActionMenuPosition(rect, estimated, align);
    if (!initial) {
      setPos(null);
      onClose();
      return;
    }
    setPos(initial);

    const raf = requestAnimationFrame(() => updatePosition());
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, anchorEl, align, visibleItems.length, updatePosition, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !anchorEl || visibleItems.length === 0 || !pos) {
    return null;
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/[0.06] fm-action-menu-backdrop"
        style={{ zIndex: Z_BACKDROP }}
        aria-hidden
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        ref={panelRef}
        id={menuDomId}
        role="menu"
        className={`${actionMenuPanel} fm-action-menu-panel`}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: MENU_WIDTH,
          zIndex: Z_PANEL,
          transformOrigin:
            pos.placement === "top"
              ? align === "right"
                ? "bottom right"
                : "bottom left"
              : align === "right"
                ? "top right"
                : "top left",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {visibleItems.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled || disabled}
            onClick={() => {
              if (item.disabled || disabled) return;
              onClose();
              item.onSelect();
            }}
            className={`${actionMenuItem} ${transitionDefault} disabled:opacity-50`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </>,
    document.body,
  );
}
