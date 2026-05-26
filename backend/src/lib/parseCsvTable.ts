export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

export function splitCsvLine(line: string, delim: "," | ";"): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      q = !q;
    } else if (!q && ch === delim) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out.map((c) => c.replace(/^"|"$/g, ""));
}

export function parseDelimitedText(text: string): { table: ParsedTable; emptyLinesSkipped: number } {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.filter((l) => l.trim().length > 0);
  const emptyLinesSkipped = rawLines.length - lines.length;
  if (lines.length === 0) return { table: { headers: [], rows: [] }, emptyLinesSkipped };

  const first = lines[0];
  const delim: "," | ";" =
    first.includes(";") && first.split(";").length > first.split(",").length ? ";" : ",";
  const headers = splitCsvLine(lines[0], delim);
  const rows = lines.slice(1).map((line) => splitCsvLine(line, delim));
  return { table: { headers, rows }, emptyLinesSkipped };
}

export function parseCsvBuffer(buffer: Buffer): ParsedTable {
  return parseDelimitedText(buffer.toString("utf8")).table;
}
