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

/** Tight margins so the CT-S4500 does not feed a long blank form. */
export const STATEMENT_MARGIN_TOP_MM = 1;
export const STATEMENT_MARGIN_BOTTOM_MM = 3;

/** CSS px → mm at the standard 96 CSS dpi used by getBoundingClientRect / scrollHeight. */
export const STATEMENT_CSS_DPI = 96;

/**
 * Page height for one receipt cut: content + margins, clamped so a failed
 * measure cannot fall back to an A4-tall feed that wastes the roll.
 */
export function statementPrintPageHeightMm(contentHeightPx: number): number {
  const contentMm = Math.max(1, Math.ceil((contentHeightPx * 25.4) / STATEMENT_CSS_DPI));
  const heightMm = contentMm + STATEMENT_MARGIN_TOP_MM + STATEMENT_MARGIN_BOTTOM_MM + 1;
  return Math.min(220, Math.max(40, heightMm));
}

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
