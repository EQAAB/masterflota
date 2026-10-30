const RECEIPT_WIDTH_MM = 72;
const PAGE_WIDTH_MM = 80;
const MARGIN_X_MM = (PAGE_WIDTH_MM - RECEIPT_WIDTH_MM) / 2;
const MARGIN_Y_MM = 2;

/**
 * Download the same receipt the Print action uses.
 * The element must already be laid out inside `.payout-statement-print-root`.
 */
export async function downloadCourierStatementPdf(params: {
  element: HTMLElement;
  filename: string;
}): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const { element, filename } = params;
  const canvas = await html2canvas(element, {
    scale: 2,
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

  const imgWidth = RECEIPT_WIDTH_MM;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pageHeight = imgHeight + MARGIN_Y_MM * 2;
  const pdf = new jsPDF({ unit: "mm", format: [PAGE_WIDTH_MM, pageHeight], orientation: "portrait" });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", MARGIN_X_MM, MARGIN_Y_MM, imgWidth, imgHeight);
  pdf.save(filename);
}
