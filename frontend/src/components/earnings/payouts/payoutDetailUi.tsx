import type { ReactNode } from "react";
import i18n from "../../../i18n";
import {
  BoltPlatformLogo,
  PlatformBadge,
  UberPlatformLogo,
  type PlatformBadgeKey,
} from "../../drivers/platformLogos";

export function platformAdjustmentLabel(platform: string): string {
  if (platform.toLowerCase().includes("bolt")) {
    return i18n.t("pages.earningsPayouts.detail.platformNetAdjustmentBolt");
  }
  return i18n.t("pages.earningsPayouts.detail.platformNetAdjustment");
}

export function platformAdjustmentHint(platform: string): string {
  if (platform.toLowerCase().includes("bolt")) {
    return i18n.t("pages.earningsPayouts.detail.boltNetIncomeHint");
  }
  return i18n.t("pages.earningsPayouts.detail.grossMinusTaxaHint");
}

function platformBadgeKey(platform: string): PlatformBadgeKey | null {
  const p = platform.toLowerCase();
  if (p === "bolt" || p === "bolt_taxi" || p === "glovo" || p === "uber" || p === "wolt") return p;
  return null;
}

export function PlatformLogo({ platform, size = "md" }: { platform: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "!h-7 !w-7 !rounded-lg" : "!h-9 !w-9 !rounded-xl";
  const p = platform.toLowerCase();
  if (p === "uber") return <UberPlatformLogo className={cls} />;
  if (p === "bolt" || p === "bolt_taxi") return <BoltPlatformLogo className={cls} />;
  const key = platformBadgeKey(platform);
  if (key) return <PlatformBadge platform={key} compact />;
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-600">
      {platform.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function LineRow({
  label,
  value,
  variant = "neutral",
  bold,
  hint,
}: {
  label: string;
  value: ReactNode;
  variant?: "neutral" | "deduction" | "positive";
  bold?: boolean;
  hint?: string;
}) {
  const valueClass =
    variant === "deduction"
      ? "text-rose-700"
      : variant === "positive"
        ? "text-emerald-800 font-semibold"
        : "text-ink";
  return (
    <div className={`fm-payout-detail-line ${bold ? "fm-payout-detail-line--bold" : ""}`}>
      <div className="min-w-0">
        <span className="fm-payout-detail-line__label">{label}</span>
        {hint && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{hint}</p>}
      </div>
      <span className={`fm-payout-detail-line__value tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}
