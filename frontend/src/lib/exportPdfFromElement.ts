type CapturePdfOptions = {
  orientation?: "landscape" | "portrait";
  filename: string;
  scale?: number;
  /** Page height matches the element so a short receipt is not stuck on a blank A4. */
  fitContent?: boolean;
};

/** Loads jspdf + html2canvas on demand (keeps them out of the main bundle). */
export async function exportPdfFromElement(
  element: HTMLElement,
  { orientation = "landscape", filename, scale = 1.5, fitContent = false }: CapturePdfOptions,
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    ...(fitContent
      ? {
          width: element.scrollWidth,
          height: element.scrollHeight,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        }
      : {}),
  });
  const imgData = canvas.toDataURL("image/png");

  if (fitContent) {
    const margin = 8;
    const pageWidth = 190;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = imgHeight + margin * 2;
    const pdf = new jsPDF({ unit: "mm", format: [pageWidth, pageHeight], orientation: "portrait" });
    pdf.setFillColor(244, 246, 248);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
    pdf.save(filename);
    return;
  }

  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  const fittedHeight = Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 10);
  pdf.addImage(imgData, "PNG", 5, 5, pdfWidth - 10, fittedHeight);
  pdf.save(filename);
}
