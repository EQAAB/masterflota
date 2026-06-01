const items = [
  { label: "Active", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-800 ring-emerald-200/60" },
  { label: "Completed", dot: "bg-violet-500", pill: "bg-violet-50 text-violet-800 ring-violet-200/60" },
  { label: "Upcoming", dot: "bg-sky-500", pill: "bg-sky-50 text-sky-800 ring-sky-200/60" },
  { label: "Pending", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-900 ring-amber-200/60" },
  { label: "Cancelled", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-800 ring-rose-200/60" },
];

export function CalendarLegend() {
  return (
    <div className="mb-4 flex flex-wrap gap-2" aria-label="Booking status legend">
      {items.map(({ label, dot, pill }) => (
        <span key={label} className={`fm-rental-calendar__legend-pill ${pill}`}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
