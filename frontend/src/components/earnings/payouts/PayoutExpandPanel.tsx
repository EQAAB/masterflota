import { memo, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type TransitionEvent } from "react";

const ANIMATION_MS = 250;

type PayoutExpandPanelProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export const PayoutExpandPanel = memo(function PayoutExpandPanel({
  open,
  children,
  className = "",
}: PayoutExpandPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const [contentMounted, setContentMounted] = useState(open);
  const [maxHeight, setMaxHeight] = useState(0);
  const [opacity, setOpacity] = useState(open ? 1 : 0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (open) setContentMounted(true);
  }, [open]);

  const showContent = open || contentMounted;

  useLayoutEffect(() => {
    if (!showContent) {
      setMaxHeight(0);
      setOpacity(0);
      return;
    }

    const content = contentRef.current;
    if (!content) return;

    if (prefersReducedMotion) {
      setMaxHeight(open ? content.scrollHeight : 0);
      setOpacity(open ? 1 : 0);
      return;
    }

    if (open) {
      setOpacity(0);
      setMaxHeight(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!openRef.current) return;
          const target = content.scrollHeight;
          setMaxHeight(target);
          setOpacity(1);
        });
      });
      return;
    }

    const current = content.scrollHeight;
    setMaxHeight(current);
    setOpacity(1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (openRef.current) return;
        setMaxHeight(0);
        setOpacity(0);
      });
    });
  }, [open, showContent, prefersReducedMotion]);

  useLayoutEffect(() => {
    if (!open || !showContent || prefersReducedMotion) return;
    const content = contentRef.current;
    if (!content) return;

    const ro = new ResizeObserver(() => {
      if (openRef.current) setMaxHeight(content.scrollHeight);
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [open, showContent, prefersReducedMotion]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "max-height") return;
    if (!open) setContentMounted(false);
  };

  return (
    <div
      className={`fm-payout-expand overflow-hidden ${prefersReducedMotion ? "" : "transition-[max-height,opacity] ease-in-out"} motion-reduce:transition-none ${className}`}
      style={{
        maxHeight,
        opacity,
        transitionDuration: prefersReducedMotion ? undefined : `${ANIMATION_MS}ms`,
      }}
      aria-hidden={!open}
      onTransitionEnd={prefersReducedMotion ? undefined : handleTransitionEnd}
    >
      <div
        ref={contentRef}
        className="border-t border-border/80 bg-surface/40 px-4 py-4 [contain:layout]"
      >
        {showContent ? children : null}
      </div>
    </div>
  );
});
