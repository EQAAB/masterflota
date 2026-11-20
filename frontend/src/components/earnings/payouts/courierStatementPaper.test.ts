import { describe, expect, it } from "vitest";
import {
  STATEMENT_PAPERS,
  statementPaperDots,
  statementPaperMarginXMm,
  statementPrintPageHeightMm,
} from "./courierStatementPaper";

describe("CT-S4500 statement paper", () => {
  it("uses the full 832-dot head on a 112mm roll", () => {
    expect(statementPaperDots(STATEMENT_PAPERS[112])).toBe(832);
    expect(statementPaperMarginXMm(STATEMENT_PAPERS[112])).toBe(4);
  });

  it("uses 576 dots on an 80mm roll", () => {
    expect(statementPaperDots(STATEMENT_PAPERS[80])).toBe(576);
    expect(statementPaperMarginXMm(STATEMENT_PAPERS[80])).toBe(4);
  });

  it("sizes the page to the receipt instead of an A4-tall feed", () => {
    // ~380 CSS px ≈ 100mm content → roughly 105mm page with tight margins
    const height = statementPrintPageHeightMm(380);
    expect(height).toBeGreaterThanOrEqual(90);
    expect(height).toBeLessThan(130);
    expect(statementPrintPageHeightMm(0)).toBe(40);
    expect(statementPrintPageHeightMm(5000)).toBe(220);
  });
});
