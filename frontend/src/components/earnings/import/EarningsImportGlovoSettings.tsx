import { useTranslation } from "react-i18next";
import { input } from "../../../theme/classNames";
import { commissionBaseTypeLabel } from "../../../utils/commissionBaseLabels";

const GLOVO_COMMISSION_BASE_VALUES = [
  "net_income",
  "gross_income",
  "net_income_no_tips",
  "gross_income_no_tips",
  "net_income_no_bonuses",
  "gross_income_no_bonuses",
] as const;

type EarningsImportGlovoSettingsProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isAdmin: boolean;
};

export function EarningsImportGlovoSettings({
  value,
  onChange,
  disabled,
  isAdmin,
}: EarningsImportGlovoSettingsProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[20px] border border-warning/20 bg-warning/5 px-5 py-4 shadow-soft sm:px-6">
      <p className="text-sm font-semibold text-ink">{t("pages.earningsImport.glovoCommissionBaseTitle")}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        {t("pages.earningsImport.glovoCommissionBaseDesc")}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="glovo-commission-base" className="sr-only">
          {t("pages.earningsImport.commissionBaseTypeSrLabel")}
        </label>
        <select
          id="glovo-commission-base"
          className={`${input} max-w-md text-sm`}
          value={value}
          disabled={disabled || !isAdmin}
          onChange={(e) => onChange(e.target.value)}
        >
          {GLOVO_COMMISSION_BASE_VALUES.map((v) => (
            <option key={v} value={v}>
              {commissionBaseTypeLabel(v)}
            </option>
          ))}
        </select>
        {!isAdmin && (
          <span className="text-xs text-ink-muted">{t("pages.earningsImport.onlyAdminsCanChangeHint")}</span>
        )}
      </div>
    </div>
  );
}
