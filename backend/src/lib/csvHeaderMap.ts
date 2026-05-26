export function normalizeCsvHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[%]/g, "")
    .replace(/[\s_-]+/g, "");
}

export function buildColumnIndexMap(
  headers: string[],
  aliases: Record<string, string>,
): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = normalizeCsvHeaderKey(h);
    const field = aliases[key];
    if (field && map[field] === undefined) {
      map[field] = i;
    }
  });
  return map;
}

export function cellAt(cells: string[], colMap: Record<string, number>, field: string): string {
  const idx = colMap[field];
  if (idx === undefined) return "";
  return String(cells[idx] ?? "").trim();
}
