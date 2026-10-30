import { describe, expect, it } from "vitest";
import { STATEMENT_PAPERS, statementPaperDots, statementPaperMarginXMm } from "./courierStatementPaper";

describe("CT-S4500 statement paper", () => {
  it("uses the full 832-dot head on a 112mm roll", () => {
    expect(statementPaperDots(STATEMENT_PAPERS[112])).toBe(832);
    expect(statementPaperMarginXMm(STATEMENT_PAPERS[112])).toBe(4);
  });

  it("uses 576 dots on an 80mm roll", () => {
    expect(statementPaperDots(STATEMENT_PAPERS[80])).toBe(576);
    expect(statementPaperMarginXMm(STATEMENT_PAPERS[80])).toBe(4);
  });
});
