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
  bolt: BoltPlatformLogo,
  wolt_courier: WoltPlatformLogo,
};

function platformDisplayLabel(config: ImportTemplateConfig): string {
  if (config.id === "glovo") return "Glovo Courier";
  if (config.id === "bolt_courier") return "Bolt Delivery";
  if (config.id === "wolt_courier") return "Wolt Courier";
  if (config.id === "uber") return "Uber";
  return "Bolt";
}

type ImportTemplateMiniCardProps = {
  config: ImportTemplateConfig;
};

function ImportTemplateMiniCard({ config }: ImportTemplateMiniCardProps) {
  const Logo = LOGO_BY_PLATFORM[config.id];

  return (
    <div
      className={`flex h-[118px] w-[118px] shrink-0 flex-col items-center justify-between rounded-2xl border border-[#E7ECEF] bg-white px-2 py-3 shadow-soft ${transitionDefault} hover:border-brand/30 hover:shadow-card`}
    >
      <div className="flex flex-col items-center gap-1">
        <Logo />
        <p className="text-xs font-semibold text-ink">{config.label}</p>
        <p className="text-[10px] text-ink-muted">{config.category}</p>
      </div>
      <button
        type="button"
        onClick={() => downloadPlatformImportTemplate(config.id)}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border border-brand/30 bg-white text-brand ${transitionDefault} hover:bg-brand-mint/30`}
        aria-label={`Download ${config.label} ${config.category} template`}
      >
        <DownloadIcon className="h-3.5 w-3.5" />
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
    <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-surface">
      <div className="flex min-w-0 items-center gap-2.5">
        <Logo />
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
    <div className="flex h-full flex-col rounded-2xl border border-[#E7ECEF] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">Download templates</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
            Choose your platform to get the correct import template.
          </p>
        </div>
        <div className="relative shrink-0" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setViewAllOpen((o) => !o)}
            className={`${linkAccent} inline-flex items-center gap-0.5 text-xs font-medium ${transitionDefault}`}
            aria-expanded={viewAllOpen}
            aria-haspopup="menu"
          >
            View all
            <ArrowIcon className="h-3 w-3" />
          </button>
          {viewAllOpen && (
            <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-xl border border-border bg-white p-1.5 shadow-card-hover">
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

      <div className="-mx-1 mt-3 flex flex-nowrap justify-between gap-2 overflow-x-auto px-1 pb-1 lg:gap-2.5">
        {FEATURED_IMPORT_TEMPLATES.map((config) => (
          <ImportTemplateMiniCard key={config.id} config={config} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-mint/25 px-3 py-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <InfoIcon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs leading-snug text-ink-muted">
          Using the right template helps prevent validation errors.
        </p>
      </div>
    </div>
  );
}
