import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  actionMenuItem,
  actionMenuPanel,
  actionMenuTrigger,
  transitionDefault,
} from "../../theme/classNames";
import { DotsVerticalIcon } from "./actionMenuIcons";

export type ActionMenuItemConfig = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  hidden?: boolean;
};

export type ActionMenuProps = {
  items: ActionMenuItemConfig[];
  align?: "left" | "right";
  disabled?: boolean;
  "aria-label"?: string;
};

type PanelPos = { top: number; left: number; minWidth: number };

function computePanelPos(
  trigger: HTMLElement,
  panel: HTMLElement | null,
  align: "left" | "right",
): PanelPos {
  const rect = trigger.getBoundingClientRect();
  const panelWidth = panel?.offsetWidth ?? 200;
  const gap = 6;
  let left = align === "right" ? rect.right - panelWidth : rect.left;
  left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
  const top = rect.bottom + gap;
  return { top, left, minWidth: Math.max(rect.width, 200) };
}

export function ActionMenu({
  items,
  align = "right",
  disabled = false,
  "aria-label": ariaLabel = "Row actions",
}: ActionMenuProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.filter((i) => !i.hidden);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPos(computePanelPos(triggerRef.current, panelRef.current, align));
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (visibleItems.length === 0) return null;

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        className={`${actionMenuTrigger} ${transitionDefault} disabled:opacity-50`}
      >
        <DotsVerticalIcon />
      </button>

      {open && pos && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          className={`${actionMenuPanel} ${transitionDefault}`}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            minWidth: pos.minWidth,
            maxWidth: 220,
          }}
        >
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled || disabled}
              onClick={() => {
                if (item.disabled || disabled) return;
                setOpen(false);
                item.onSelect();
                triggerRef.current?.focus();
              }}
              className={`${actionMenuItem} ${transitionDefault} disabled:opacity-50`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
