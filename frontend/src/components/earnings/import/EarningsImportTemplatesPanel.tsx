import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import {
  BoltPlatformLogo,
  GlovoPlatformLogo,
  UberPlatformLogo,
  WoltPlatformLogo,
} from "../../drivers/platformLogos";
import { linkAccent, transitionDefault } from "../../../theme/classNames";
import {
  downloadPlatformImportTemplate,
  FEATURED_IMPORT_TEMPLATES,
  IMPORT_TEMPLATE_PLATFORMS,
  type ImportTemplateConfig,
  type ImportTemplatePlatform,
} from "./importDisplayUtils";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

const LOGO_BY_PLATFORM: Record<
  ImportTemplatePlatform,
  ComponentType<{ className?: string }>
> = {
  glovo: GlovoPlatformLogo,
  bolt_courier: BoltPlatformLogo,
  uber: UberPlatformLogo,
  bolt_taxi: BoltPlatformLogo,
  wolt_courier: WoltPlatformLogo,
};

function platformDisplayLabel(config: ImportTemplateConfig): string {
  if (config.id === "glovo") return "Glovo Courier";
  if (config.id === "bolt_courier") return "Bolt Delivery";
  if (config.id === "wolt_courier") return "Wolt Courier";
  if (config.id === "uber") return "Uber";
  if (config.id === "bolt_taxi") return "Bolt Taxi";
  return "Bolt";
}

type ImportTemplateMiniCardProps = {
  config: ImportTemplateConfig;
};

function ImportTemplateMiniCard({ config }: ImportTemplateMiniCardProps) {
  const Logo = LOGO_BY_PLATFORM[config.id];

  return (
    <div className="platform-template-card flex shrink-0 snap-start flex-col justify-between p-3">
      <div className="flex flex-col items-center gap-2">
        <div className="platform-template-card__logo flex items-center justify-center rounded-lg bg-surface/80 ring-1 ring-border/50">
          <Logo className="!h-[22px] !w-[22px] !rounded-md" />
        </div>
        <div className="platform-template-card__label w-full">
          <p className="platform-template-card__title text-[13px] font-semibold text-ink">{config.label}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
            {config.category}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => downloadPlatformImportTemplate(config.id)}
        className="platform-template-card__download inline-flex items-center justify-center gap-1 text-[11px] font-medium text-brand"
        aria-label={`Download ${config.label} ${config.category} template`}
      >
        <DownloadIcon className="h-3 w-3 shrink-0" />
        Download
      </button>
    </div>
  );
}

type ViewAllPopoverRowProps = {
  config: ImportTemplateConfig;
  onDownload: () => void;
};

function ViewAllPopoverRow({ config, onDownload }: ViewAllPopoverRowProps) {
  const Logo = LOGO_BY_PLATFORM[config.id];

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-surface">
      <div className="flex min-w-0 items-center gap-2.5">
        <Logo className="!h-7 !w-7" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{platformDisplayLabel(config)}</p>
          <p className="text-xs text-ink-muted">{config.category}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDownload}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/25 text-brand ${transitionDefault} hover:bg-brand-mint/30`}
        aria-label={`Download ${platformDisplayLabel(config)} template`}
      >
        <DownloadIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function EarningsImportTemplatesPanel() {
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setViewAllOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="flex h-full min-h-[148px] flex-col rounded-xl border border-border/50 bg-gradient-to-br from-surface/40 to-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">Download templates</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
            Correct CSV format per platform
          </p>
        </div>
        <div className="relative shrink-0" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setViewAllOpen((o) => !o)}
            className={`${linkAccent} inline-flex items-center gap-1 text-[11px] font-medium ${transitionDefault} hover:opacity-80`}
            aria-expanded={viewAllOpen}
            aria-haspopup="menu"
          >
            View all
            <ArrowIcon className="h-3 w-3" />
          </button>
          {viewAllOpen && (
            <div className="absolute right-0 z-50 mt-1.5 w-60 rounded-xl border border-border bg-white p-1.5 shadow-card-hover">
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                All platforms
              </p>
              <div className="max-h-64 overflow-y-auto">
                {IMPORT_TEMPLATE_PLATFORMS.map((config) => (
                  <ViewAllPopoverRow
                    key={config.id}
                    config={config}
                    onDownload={() => {
                      downloadPlatformImportTemplate(config.id);
                      setViewAllOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-2.5 flex-1">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-white/95 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/95 to-transparent"
          aria-hidden
        />
        <div className="platform-template-carousel flex flex-nowrap gap-3 px-1.5 [scrollbar-width:none] [-ms-overflow-style:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
          {FEATURED_IMPORT_TEMPLATES.map((config) => (
            <ImportTemplateMiniCard key={config.id} config={config} />
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-lg border border-brand-mint/40 bg-brand-mint/20 px-2.5 py-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <InfoIcon className="h-3 w-3" />
        </span>
        <p className="text-[11px] leading-snug text-slate-600">
          Using the right template prevents validation errors.
        </p>
      </div>
    </div>
  );
}
