const TIPS = [
  "Use legal name for invoices",
  "Add email for receipts",
  "Add phone for pickup coordination",
  "Tax ID is optional unless required for billing",
];

export function CustomerTipsCard() {
  return (
    <aside className="fm-rental-customer-form__tips">
      <div className="flex gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800"
          aria-hidden
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Customer profile tips</h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="text-brand" aria-hidden>
                  •
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
