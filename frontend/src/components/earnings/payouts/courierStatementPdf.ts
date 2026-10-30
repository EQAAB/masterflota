import {
  STATEMENT_MARGIN_BOTTOM_MM,
  STATEMENT_MARGIN_TOP_MM,
  statementPaperDots,
  statementPaperMarginXMm,
  type StatementPaper,
} from "./courierStatementPaper";

/**
 * Download the same receipt the Print action uses.
 * The element must already be laid out inside `.payout-statement-print-root`.
 */
export async function downloadCourierStatementPdf(params: {
  element: HTMLElement;
  filename: string;
  paper: StatementPaper;
}): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const { element, filename, paper } = params;
  // Render at the printer's dot pitch so each canvas pixel maps to one 203 DPI dot.
  const scale = Math.max(2, statementPaperDots(paper) / element.scrollWidth);
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    x: 0,
    y: 0,
    scrollX: -window.scrollX,
    scrollY: -window.scrollY,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
  });

  const imgWidth = paper.printMm;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pageHeight = imgHeight + STATEMENT_MARGIN_TOP_MM + STATEMENT_MARGIN_BOTTOM_MM;
  const pdf = new jsPDF({ unit: "mm", format: [paper.pageMm, pageHeight], orientation: "portrait" });
  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    statementPaperMarginXMm(paper),
    STATEMENT_MARGIN_TOP_MM,
    imgWidth,
    imgHeight,
  );
  pdf.save(filename);
}
