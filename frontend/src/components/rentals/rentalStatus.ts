export function bookingStatusClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200/60";
    case "confirmed":
      return "bg-sky-100 text-sky-800 ring-sky-200/60";
    case "draft":
      return "bg-slate-100 text-slate-700 ring-slate-200/60";
    case "completed":
      return "bg-violet-100 text-violet-800 ring-violet-200/60";
    case "cancelled":
      return "bg-rose-100 text-rose-800 ring-rose-200/60";
    default:
      return "bg-amber-100 text-amber-900 ring-amber-200/60";
  }
}

export function formatBookingStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
