type CapturePdfOptions = {
  orientation?: "landscape" | "portrait";
  filename: string;
  scale?: number;
};

/** Loads jspdf + html2canvas on demand (keeps them out of the main bundle). */
export async function exportPdfFromElement(
  element: HTMLElement,
  { orientation = "landscape", filename, scale = 1.5 }: CapturePdfOptions,
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  const fittedHeight = Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 10);
  pdf.addImage(imgData, "PNG", 5, 5, pdfWidth - 10, fittedHeight);
  pdf.save(filename);
}
