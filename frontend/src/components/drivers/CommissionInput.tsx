import { useTranslation } from "react-i18next";
import type { CommissionType } from "./CommissionPreview";
import { CommissionPreview } from "./CommissionPreview";

export interface CommissionValues {
  commissionType: CommissionType;
  commissionRate: number;
  fixedCommissionAmount: number;
  minimumCommission: number;
}

export interface CommissionInputProps {
  commissionType: CommissionType;
  commissionRate: number;
  fixedCommissionAmount: number;
  minimumCommission: number;
  onChange: (values: Partial<CommissionValues>) => void;
  errors?: Partial<Record<keyof CommissionValues, string>>;
}

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const inputErrorClass =
  "w-full rounded-md border border-red-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500";

export function CommissionInput({
  commissionType,
  commissionRate,
  fixedCommissionAmount,
  minimumCommission,
  onChange,
  errors = {},
}: CommissionInputProps) {
  const { t } = useTranslation();
  const COMMISSION_TYPES: { value: CommissionType; label: string }[] = [
    { value: "percentage", label: t("pages.driverForm.percentageOption") },
    { value: "fixed_amount", label: t("pages.driverForm.fixedAmountOption") },
    { value: "hybrid", label: t("pages.driverForm.hybridOption") },
  ];
  const setType = (value: CommissionType) => onChange({ commissionType: value });
  const setRate = (value: number) => onChange({ commissionRate: value });
  const setFixed = (value: number) =>
    onChange({ fixedCommissionAmount: value });
  const setMin = (value: number) => onChange({ minimumCommission: value });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">
          {t("pages.driverForm.commissionTypeLabel")}
        </label>
        <select
          className={errors.commissionType ? inputErrorClass : inputClass}
          value={commissionType}
          onChange={(e) => setType(e.target.value as CommissionType)}
        >
          {COMMISSION_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.commissionType && (
          <p className="mt-1 text-xs text-red-600">{errors.commissionType}</p>
        )}
      </div>

      {(commissionType === "percentage" || commissionType === "hybrid") && (
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t("pages.driverForm.commissionRatePercentLabel")}
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            className={errors.commissionRate ? inputErrorClass : inputClass}
            value={commissionRate}
            onChange={(e) =>
              setRate(e.target.value === "" ? 0 : Number(e.target.value))
            }
          />
          {errors.commissionRate && (
            <p className="mt-1 text-xs text-red-600">{errors.commissionRate}</p>
          )}
        </div>
      )}

      {(commissionType === "fixed_amount" || commissionType === "hybrid") && (
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t("pages.driverForm.fixedCommissionAmountLabel")}
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            className={errors.fixedCommissionAmount ? inputErrorClass : inputClass}
            value={fixedCommissionAmount}
            onChange={(e) =>
              setFixed(
                e.target.value === "" ? 0 : Number(e.target.value)
              )
            }
          />
          {errors.fixedCommissionAmount && (
            <p className="mt-1 text-xs text-red-600">
              {errors.fixedCommissionAmount}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink mb-1">
          {t("pages.driverForm.minimumCommissionLabel")} <span className="text-slate-400">{t("pages.driverForm.optionalSuffix")}</span>
        </label>
        <input
          type="number"
          min={0}
          step={0.01}
          className={errors.minimumCommission ? inputErrorClass : inputClass}
          value={minimumCommission}
          onChange={(e) =>
            setMin(e.target.value === "" ? 0 : Number(e.target.value))
          }
        />
        {errors.minimumCommission && (
          <p className="mt-1 text-xs text-red-600">
            {errors.minimumCommission}
          </p>
        )}
      </div>

      <CommissionPreview
        commissionType={commissionType}
        commissionRate={commissionRate}
        fixedCommissionAmount={fixedCommissionAmount}
        minimumCommission={minimumCommission}
      />
    </div>
  );
}
