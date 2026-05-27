export function settlementDetailStatusDisplay(status: string): {
  label: string;
  className: string;
} {
  const s = status.toLowerCase();
  if (s === "paid") {
    return { label: "Paid", className: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/60" };
  }
  if (s === "pending") {
    return { label: "Pending", className: "bg-amber-100 text-amber-900 ring-1 ring-amber-200/60" };
  }
  return { label: status, className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80" };
}

export function moneyAccentClass(amount: number, accentNegative = false): string {
  if (!accentNegative || amount >= 0) return "text-slate-900";
  return "text-red-600/90";
}
