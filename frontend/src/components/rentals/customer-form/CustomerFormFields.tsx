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
  const showError = (key: keyof CustomerFormValues) => touched[key] && errors[key];

  return (
    <div className="space-y-8">
      <section>
        <p className="fm-rental-customer-form__section-label mb-3">Customer type</p>
        <CustomerTypeSegment
          value={values.customerType}
          onChange={(v: CustomerType) => onChange("customerType", v)}
        />
      </section>

      <section>
        <p className="fm-rental-customer-form__section-label mb-4">Identity</p>
        <div className="space-y-4">
          <label className="block">
            <FieldLabel required>Legal name</FieldLabel>
            <input
              required
              className={inputClass(!!showError("legalName"))}
              placeholder="Full legal name for invoices"
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
            <FieldLabel>Contact name</FieldLabel>
            <input
              className="fm-rental-customer-form__input mt-1.5"
              placeholder="Primary contact person"
              value={values.contactName}
              onChange={(e) => onChange("contactName", e.target.value)}
              onBlur={() => onBlur("contactName")}
            />
          </label>
        </div>
      </section>

      <section>
        <p className="fm-rental-customer-form__section-label mb-4">Contact information</p>
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          <label className="block">
            <FieldLabel>Email</FieldLabel>
            <input
              type="email"
              className={inputClass(!!showError("email"))}
              placeholder="name@company.com"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              onBlur={() => onBlur("email")}
            />
            {showError("email") ? (
              <p className="fm-rental-customer-form__field-error" role="alert">
                {errors.email}
              </p>
            ) : (
              <p className="fm-rental-customer-form__field-hint">Used for receipts and notifications</p>
            )}
          </label>
          <label className="block">
            <FieldLabel>Phone</FieldLabel>
            <input
              type="tel"
              className={inputClass(!!showError("phone"))}
              placeholder="e.g. +40 712 000 111"
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              onBlur={() => onBlur("phone")}
            />
            {showError("phone") ? (
              <p className="fm-rental-customer-form__field-error" role="alert">
                {errors.phone}
              </p>
            ) : (
              <p className="fm-rental-customer-form__field-hint">For pickup coordination</p>
            )}
          </label>
        </div>
      </section>

      <section>
        <p className="fm-rental-customer-form__section-label mb-4">Billing details</p>
        <label className="block">
          <FieldLabel>Tax ID</FieldLabel>
          <input
            className="fm-rental-customer-form__input mt-1.5"
            placeholder="Optional — CUI / VAT number"
            value={values.taxId}
            onChange={(e) => onChange("taxId", e.target.value)}
            onBlur={() => onBlur("taxId")}
          />
          <p className="fm-rental-customer-form__field-hint">Optional unless required for billing</p>
        </label>
      </section>

      <section>
        <p className="fm-rental-customer-form__section-label mb-4">Notes</p>
        <label className="block">
          <FieldLabel>Notes</FieldLabel>
          <textarea
            rows={4}
            className="fm-rental-customer-form__textarea mt-1.5"
            placeholder="Internal notes about this customer"
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            onBlur={() => onBlur("notes")}
          />
        </label>
      </section>
    </div>
  );
}
