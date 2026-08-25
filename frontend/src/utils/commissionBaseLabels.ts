import i18n from "../i18n";

/** Human-readable labels for `driver_payouts.commission_base_type` / org Glovo setting. */
export function commissionBaseTypeLabel(raw: string | null | undefined): string {
  switch (raw?.trim()) {
    case "net_income":
      return i18n.t("pages.earningsReports.commissionBaseType.netIncome");
    case "gross_income":
      return i18n.t("pages.earningsReports.commissionBaseType.grossIncome");
    case "net_income_no_tips":
      return i18n.t("pages.earningsReports.commissionBaseType.netIncomeNoTips");
    case "gross_income_no_tips":
      return i18n.t("pages.earningsReports.commissionBaseType.grossIncomeNoTips");
    case "net_income_no_bonuses":
      return i18n.t("pages.earningsReports.commissionBaseType.netIncomeNoBonuses");
    case "gross_income_no_bonuses":
      return i18n.t("pages.earningsReports.commissionBaseType.grossIncomeNoBonuses");
    default:
      return raw && raw.trim() ? raw : i18n.t("pages.earningsReports.commissionBaseType.netIncome");
  }
}
