import { useTranslation } from "react-i18next";
import type { CustomerType } from "./customerFormUtils";

type CustomerTypeSegmentProps = {
  value: CustomerType;
  onChange: (v: CustomerType) => void;
};

const OPTIONS: { value: CustomerType; key: "typeIndividual" | "typeCompany" }[] = [
  { value: "individual", key: "typeIndividual" },
  { value: "company", key: "typeCompany" },
];

export function CustomerTypeSegment({ value, onChange }: CustomerTypeSegmentProps) {
  const { t } = useTranslation();
  return (
    <div className="fm-rental-customer-form__segment-group" role="group" aria-label={t("pages.bookingForm.customerTypeLabel")}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`fm-rental-customer-form__segment ${
            value === opt.value ? "fm-rental-customer-form__segment--active" : ""
          }`}
          onClick={() => onChange(opt.value)}
        >
          {t(`pages.customers.${opt.key}`)}
        </button>
      ))}
    </div>
  );
}
