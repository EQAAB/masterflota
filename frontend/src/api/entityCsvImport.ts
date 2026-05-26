import { api } from "../lib/api";

export type CsvImportSummary = {
  imported: number;
  emptyRowsSkipped: number;
  invalidRowsSkipped: number;
  totalLinesInFile?: number;
};

export function importDriversCsv(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return api.post<CsvImportSummary>("/import/drivers-csv", fd);
}

export function importVehiclesCsv(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return api.post<CsvImportSummary>("/import/vehicles-csv", fd);
}

export function downloadDriversImportTemplate() {
  const headers = ["First name", "Last name", "Phone", "Status", "Commission %"];
  const sample = ["Jane", "Doe", "0712345678", "active", "10"];
  const csv = [headers.join(","), sample.join(",")].join("\r\n");
  triggerCsvDownload(csv, "drivers-import-template.csv");
}

export function downloadVehiclesImportTemplate() {
  const headers = ["Vehicle", "Type", "License plate", "VIN", "Status", "Daily rent", "Monthly rent"];
  const sample = ["Toyota Corolla", "Car", "B-123-ABC", "", "available", "0", "0"];
  const csv = [headers.join(","), sample.join(",")].join("\r\n");
  triggerCsvDownload(csv, "vehicles-import-template.csv");
}

function triggerCsvDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatCsvImportSummaryMessage(summary: CsvImportSummary): string {
  return `Imported ${summary.imported.toLocaleString()} row(s). Skipped ${summary.emptyRowsSkipped.toLocaleString()} empty and ${summary.invalidRowsSkipped.toLocaleString()} invalid row(s).`;
}
