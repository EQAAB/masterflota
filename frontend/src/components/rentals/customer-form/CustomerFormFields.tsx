import { useTranslation } from "react-i18next";
import type { CustomerFormErrors, CustomerFormValues, CustomerType } from "./customerFormUtils";
import { CustomerTypeSegment } from "./CustomerTypeSegment";

type CustomerFormFieldsProps = {
  values: CustomerFormValues;
  errors: CustomerFormErrors;
  touched: Partial<Record<keyof CustomerFormValues, boolean>>;
  onChange: <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => void;
  onBlur: (key: keyof CustomerFormValues) => void;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-sm font-medium text-ink">
      {children}
      {required && <span className="text-rose-600"> *</span>}
    </span>
  );
}

function inputClass(hasError: boolean) {
  return `fm-rental-customer-form__input mt-1.5${hasError ? " fm-rental-customer-form__input--error" : ""}`;
}

export function CustomerFormFields({
  values,
  errors,
  touched,
  onChange,
  onBlur,
}: CustomerFormFieldsProps) {
  const { t } = useTranslation();
  const showError = (key: keyof CustomerFormValues) => touched[key] && errors[key];

  return (
    <div className="space-y-8">
      <section>
        <p className="fm-rental-customer-form__section-label mb-3">{t("pages.bookingForm.customerTypeLabel")}</p>
        <CustomerTypeSegment
          value={values.customerType}
          onChange={(v: CustomerType) => onChange("customerType", v)}
        />
      </section>

      <section>
        <p className="fm-rental-customer-form__section-label mb-4">{t("pages.bookingForm.identityLabel")}</p>
        <div className="space-y-4">
          <label className="block">
            <FieldLabel required>{t("pages.bookingForm.legalNameLabel")}</FieldLabel>
            <input
              required
              className={inputClass(!!showError("legalName"))}
              placeholder={t("pages.bookingForm.legalNamePlaceholder")}
              value={values.legalName}
              onChange={(e) => onChange("legalName", e.target.value)}
              onBlur={() => onBlur("legalName")}
            />
            {showError("legalName") && (
              <p className="fm-rental-customer-form__field-error" role="alert">
                {errors.legalName}
              </p>
            )}
          </label>
          <label className="block">
            <FieldLabel>{t("pages.bookingForm.contactNameLabel")}</FieldLabel>
            <input
              className="fm-rental-customer-form__input mt-1.5"
              placeholder={t("pages.bookingForm.contactNamePlaceholder")}
              value={values.contactName}
              onChange={(e) => onChange("contactName", e.target.value)}
              onBlur={() => onBlur("contactName")}
            />
          </label>
        </div>
      </section>

      <section>
        <p className="fm-rental-customer-form__section-label mb-4">{t("pages.bookingForm.contactInfoLabel")}</p>
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          <label className="block">
            <FieldLabel>{t("pages.customers.emailLabel")}</FieldLabel>
            <input
              type="email"
              className={inputClass(!!showError("email"))}
              placeholder={t("pages.bookingForm.emailPlaceholder")}
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              onBlur={() => onBlur("email")}
            />
            {showError("email") ? (
              <p className="fm-rental-customer-form__field-error" role="alert">
                {errors.email}
              </p>
            ) : (
              <p className="fm-rental-customer-form__field-hint">{t("pages.bookingForm.emailHint")}</p>
            )}
          </label>
          <label className="block">
            <FieldLabel>{t("pages.customers.phoneLabel")}</FieldLabel>
            <input
              type="tel"
              className={inputClass(!!showError("phone"))}
              placeholder={t("pages.bookingForm.phonePlaceholder")}
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              onBlur={() => onBlur("phone")}
            />
            {showError("phone") ? (
              <p className="fm-rental-customer-form__field-error" role="alert">
                {errors.phone}
              </p>
            ) : (
              <p className="fm-rental-customer-form__field-hint">{t("pages.bookingForm.phoneHint")}</p>
            )}
          </label>
        </div>
      </section>

      <section>
        <p className="fm-rental-customer-form__section-label mb-4">{t("pages.bookingForm.billingDetailsLabel")}</p>
        <label className="block">
          <FieldLabel>{t("pages.bookingForm.taxIdLabel")}</FieldLabel>
          <input
            className="fm-rental-customer-form__input mt-1.5"
            placeholder={t("pages.bookingForm.taxIdPlaceholder")}
            value={values.taxId}
            onChange={(e) => onChange("taxId", e.target.value)}
            onBlur={() => onBlur("taxId")}
          />
          <p className="fm-rental-customer-form__field-hint">{t("pages.bookingForm.taxIdHint")}</p>
        </label>
      </section>

      <section>
        <p className="fm-rental-customer-form__section-label mb-4">{t("pages.customers.notesTitle")}</p>
        <label className="block">
          <FieldLabel>{t("pages.customers.notesTitle")}</FieldLabel>
          <textarea
            rows={4}
            className="fm-rental-customer-form__textarea mt-1.5"
            placeholder={t("pages.bookingForm.notesPlaceholder")}
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            onBlur={() => onBlur("notes")}
          />
        </label>
      </section>
    </div>
  );
}
