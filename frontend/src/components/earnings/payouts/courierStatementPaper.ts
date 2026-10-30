/**
 * Receipt paper for the Citizen CT-S4500 (203 DPI direct thermal, auto-cutter).
 * The printer takes a 112mm roll by default, or 80mm with the paper guide moved.
 */
export type StatementPaperWidth = 112 | 80;

export type StatementPaper = {
  /** Roll width, used as the page width. */
  pageMm: number;
  /** Printable width of the head at this roll width. */
  printMm: number;
};

export const STATEMENT_PAPERS: Record<StatementPaperWidth, StatementPaper> = {
  112: { pageMm: 112, printMm: 104 },
  80: { pageMm: 80, printMm: 72 },
};

/** "203 DPI" heads are 8 dots/mm (203.2 DPI): 832 dots across 104mm. */
export const STATEMENT_PRINTER_DOTS_PER_MM = 8;

/** Top margin; the bottom gets extra feed so the cutter clears the footer. */
export const STATEMENT_MARGIN_TOP_MM = 2;
export const STATEMENT_MARGIN_BOTTOM_MM = 8;

const PAPER_STORAGE_KEY = "fm.payoutStatement.paperWidth";

export function statementPaperMarginXMm(paper: StatementPaper): number {
  return (paper.pageMm - paper.printMm) / 2;
}

/** Printable width in printer dots (832 for 112mm, 576 for 80mm). */
export function statementPaperDots(paper: StatementPaper): number {
  return Math.round(paper.printMm * STATEMENT_PRINTER_DOTS_PER_MM);
}

export function loadStatementPaperWidth(): StatementPaperWidth {
  try {
    return localStorage.getItem(PAPER_STORAGE_KEY) === "80" ? 80 : 112;
  } catch {
    return 112;
  }
}

export function saveStatementPaperWidth(width: StatementPaperWidth): void {
  try {
    localStorage.setItem(PAPER_STORAGE_KEY, String(width));
  } catch {
    /* per-browser convenience only */
  }
}
