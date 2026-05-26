/** Brand-inspired platform marks (Bolt green lightning, Glovo yellow/green). */

import type { ComponentType } from "react";
import { PLATFORM_ID_LABELS, PLATFORM_IDS } from "../../constants/platformIds";

const LOGO_BOX = "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm";

export type PlatformBadgeKey = "bolt" | "glovo" | "uber" | "wolt";

const PLATFORM_LABELS: Record<PlatformBadgeKey, string> = {
  bolt: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT],
  glovo: PLATFORM_ID_LABELS[PLATFORM_IDS.GLOVO],
  uber: PLATFORM_ID_LABELS[PLATFORM_IDS.UBER],
  wolt: PLATFORM_ID_LABELS[PLATFORM_IDS.WOLT],
};

export function BoltPlatformLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`${LOGO_BOX} bg-[#34D186] ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="#FFFFFF"
          d="M13.5 2.5L6.5 13.5h4.5l-1 8.5 7-11h-4.5l1-8.5z"
        />
      </svg>
    </span>
  );
}

export function GlovoPlatformLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`${LOGO_BOX} bg-[#FFC244] ring-1 ring-[#00A082]/25 ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="#00A082"
          d="M12 3.5c-3.5 0-6.5 2.8-6.5 6.2 0 2.1 1.1 4 2.8 5.1L7.5 20h3.2l.6-3.2c.2 0 .5.1.7.1 3.5 0 6.5-2.8 6.5-6.2S15.5 3.5 12 3.5zm0 9.5c-1.8 0-3.2-1.4-3.2-3.2S10.2 6.6 12 6.6s3.2 1.4 3.2 3.2-1.4 3.2-3.2 3.2z"
        />
      </svg>
    </span>
  );
}

export function UberPlatformLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`${LOGO_BOX} bg-ink ${className}`} aria-hidden>
      <span className="text-[10px] font-bold tracking-tight text-white">U</span>
    </span>
  );
}

export function WoltPlatformLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`${LOGO_BOX} bg-brand-dark ${className}`} aria-hidden>
      <span className="text-[10px] font-bold text-white">W</span>
    </span>
  );
}

const LOGO_BY_PLATFORM: Record<PlatformBadgeKey, ComponentType<{ className?: string }>> = {
  bolt: BoltPlatformLogo,
  glovo: GlovoPlatformLogo,
  uber: UberPlatformLogo,
  wolt: WoltPlatformLogo,
};

export function PlatformBadge({ platform }: { platform: PlatformBadgeKey }) {
  const Logo = LOGO_BY_PLATFORM[platform];
  const label = PLATFORM_LABELS[platform];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg py-0.5 pr-1.5">
      <Logo />
      <span className="whitespace-nowrap text-xs font-medium text-ink">{label}</span>
    </span>
  );
}
