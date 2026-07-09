import type { DriverLoanStatus } from "../../../api/driverLoans";

export function driverLoanDisplayName(first: string, last: string): string {
  return `${first} ${last}`.trim() || "—";
}

export function loanStatusBadgeClass(status: DriverLoanStatus): string {
  switch (status) {
    case "active":
      return "bg-sky-100 text-sky-800";
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    case "written_off":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
