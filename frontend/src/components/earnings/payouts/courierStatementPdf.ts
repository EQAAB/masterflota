import type { ConsolidatedDriverPayout, PayoutListItem } from "../../../api/earnings";
import type { WeekLoanRepayment } from "../../../api/driverLoans";
import i18n from "../../../i18n";
import { getAppBranding } from "../../../lib/appBranding";
import { formatCurrency } from "../../../utils/currency";
import { computeUnifiedBreakdown } from "./payoutBreakdownUtils";
import type { WeekFeeBreakdown } from "./payoutFeeBreakdown";
import { buildCourierStatementModel } from "./courierStatementModel";
import {
  formatStatementDay,
  formatStatementWeek,
  statementFinalAmountKey,
  statementGeneratedBy,
  statementDisplayId,
  statementPayoutDateIso,
  statementSummaryId,
} from "./courierStatementFormat";

function pdfText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\u202f/g, " ").replace(/\u2013|\u2014/g, "-");
}

function money(amount: number): string {
  return pdfText(formatCurrency(amount));
}

export async function downloadCourierStatementPdf(params: {
  row: ConsolidatedDriverPayout;
  payoutItems: PayoutListItem[];
  weekFeeBreakdown?: WeekFeeBreakdown;
  loanRepayments?: WeekLoanRepayment[];
  filename: string;
}): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { row, payoutItems, weekFeeBreakdown, loanRepayments = [] } = params;
  const brand = getAppBranding();
  const breakdown = computeUnifiedBreakdown(row, payoutItems);
  const model = buildCourierStatementModel({
    breakdown,
    payoutItems,
    weekFeeBreakdown,
    loanRepayments,
  });

  const pageW = 148;
  const margin = 12;
  const left = margin;
  const right = pageW - margin;
  const contentW = right - left;
  const summaryRows = 4;
  const platformBlock = model.multiPlatform ? 8 + model.platforms.length * 7 : 0;
  const pageH = margin + 22 + summaryRows * 9 + 10 + platformBlock + 12 + model.lines.length * 9 + 28 + 22 + margin;

  const pdf = new jsPDF({ unit: "mm", format: [pageW, pageH], orientation: "portrait" });
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageW, pageH, "F");

  let y = margin + 6;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.title")), pageW / 2, y, { align: "center" });

  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.subtitle")).toUpperCase(), pageW / 2, y, { align: "center" });

  const courierId = statementSummaryId(model.courierIds, model.multiPlatform);
  const driverName = `${row.first_name} ${row.last_name}`.trim() || "-";
  const weekLabel = formatStatementWeek(row.payment_period_start, row.payment_period_end);
  const payoutDate = formatStatementDay(statementPayoutDateIso(row));
  const summary = [
    [i18n.t("pages.earningsPayouts.statement.courierId"), courierId],
    [i18n.t("pages.earningsPayouts.statement.courierName"), driverName],
    [i18n.t("pages.earningsPayouts.statement.weekLabel"), weekLabel],
    [i18n.t("pages.earningsPayouts.statement.payoutDate"), payoutDate],
  ];

  y += 6;
  const boxTop = y;
  const rowH = 8;
  const boxH = summary.length * rowH + 4;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(left, boxTop, contentW, boxH, 2, 2, "S");

  summary.forEach(([label, value], index) => {
    const rowY = boxTop + 6 + index * rowH;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(pdfText(label), left + 4, rowY);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    const valueLines = pdf.splitTextToSize(pdfText(value), contentW * 0.55);
    pdf.text(valueLines, right - 4, rowY, { align: "right" });
    if (index < summary.length - 1) {
      pdf.setDrawColor(226, 232, 240);
      pdf.line(left + 3, rowY + 3, right - 3, rowY + 3);
    }
  });

  y = boxTop + boxH + 8;

  if (model.multiPlatform) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.byPlatform")).toUpperCase(), left, y);
    for (const platform of model.platforms) {
      y += 6;
      const platformId = statementDisplayId(
        payoutItems.find((item) => (item.earnings_platform ?? "") === platform.platform)?.platform_id,
      );
      const platformLabel = platformId === "-" ? platform.label : `${platform.label}  ${platformId}`;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text(pdfText(platformLabel), left, y);
      pdf.text(money(platform.netIncome), right, y, { align: "right" });
    }
    y += 6;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.earningsHeading")).toUpperCase(), left, y);
  pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.currencyCode")), right, y, { align: "right" });

  y += 4;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(left, y, contentW, 8, "F");
  y += 5;
  pdf.setFontSize(8);
  pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.description")).toUpperCase(), left + 3, y);
  pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.amount")).toUpperCase(), right - 3, y, { align: "right" });

  for (const line of model.lines) {
    y += 9;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineDashPattern([0.4, 0.8], 0);
    pdf.line(left, y + 3, right, y + 3);
    pdf.setLineDashPattern([], 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    const labelLines = pdf.splitTextToSize(pdfText(line.label), contentW * 0.58);
    pdf.text(labelLines, left + 3, y);
    pdf.text(money(line.amount), right - 3, y, { align: "right" });
    if (labelLines.length > 1) y += (labelLines.length - 1) * 4;
  }

  y += 8;
  const payable = model.finalNet >= -0.02;
  if (payable) {
    pdf.setFillColor(236, 253, 245);
    pdf.setTextColor(6, 95, 70);
  } else {
    pdf.setFillColor(255, 241, 242);
    pdf.setTextColor(159, 18, 57);
  }
  pdf.roundedRect(left, y, contentW, 18, 2.5, 2.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  const finalLabel = i18n.t(statementFinalAmountKey(row.consolidated_status, model.finalNet));
  pdf.text(pdfText(finalLabel).toUpperCase(), pageW / 2, y + 6, { align: "center" });
  pdf.setFontSize(14);
  pdf.text(money(model.finalNet), pageW / 2, y + 13, { align: "center" });

  y += 26;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.thanks")), pageW / 2, y, { align: "center" });
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(pdfText(statementGeneratedBy(brand)), pageW / 2, y, { align: "center" });
  y += 4;
  pdf.text(pdfText(i18n.t("pages.earningsPayouts.statement.disclaimer")), pageW / 2, y, { align: "center" });

  pdf.save(params.filename);
}
