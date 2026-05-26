import type { Subcontractor } from "../api/subcontractors";
import {
  formatJoinedDate,
  formatSubcontractorDisplayId,
  formatDriverCount,
} from "./subcontractorDisplay";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportSubcontractorsCsv(
  subcontractors: Subcontractor[],
  idIndexMap?: Map<string, number>,
): void {
  const headers = ["Company", "ID", "Phone", "Email", "Status", "Drivers", "Joined date"];

  const rows = subcontractors.map((s, index) => [
    s.legal_name,
    formatSubcontractorDisplayId(s, idIndexMap?.get(s.id) ?? index),
    s.phone ?? "",
    s.email ?? "",
    s.status,
    formatDriverCount(s.driver_count),
    formatJoinedDate(s.created_at),
  ]);

  const csv = [headers, ...rows].map((row) => row.map((c) => escapeCsv(String(c))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subcontractors-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
