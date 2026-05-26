export function ActivityEmptyIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1.5" className="text-brand/20" />
      <path
        d="M28 40h24M40 28v24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-brand/35"
      />
      <circle cx="40" cy="16" r="4" fill="currentColor" className="text-brand/50" />
      <circle cx="64" cy="40" r="4" fill="currentColor" className="text-brand/35" />
      <circle cx="40" cy="64" r="4" fill="currentColor" className="text-brand/25" />
    </svg>
  );
}
