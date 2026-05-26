export function ChartEmptyIllustration({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect x="8" y="56" width="12" height="28" rx="3" fill="currentColor" className="text-brand/25" />
      <rect x="28" y="40" width="12" height="44" rx="3" fill="currentColor" className="text-brand/40" />
      <rect x="48" y="28" width="12" height="56" rx="3" fill="currentColor" className="text-brand/55" />
      <rect x="68" y="44" width="12" height="40" rx="3" fill="currentColor" className="text-brand/35" />
      <path
        d="M12 32 L36 24 L56 36 L84 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-brand"
      />
      <circle cx="12" cy="32" r="3" fill="currentColor" className="text-brand" />
      <circle cx="36" cy="24" r="3" fill="currentColor" className="text-brand" />
      <circle cx="56" cy="36" r="3" fill="currentColor" className="text-brand" />
      <circle cx="84" cy="18" r="3" fill="currentColor" className="text-brand" />
    </svg>
  );
}
