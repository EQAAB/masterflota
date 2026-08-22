import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { createRentalCustomer, getRentalCustomer, updateRentalCustomer } from "../../api/rentals";
import { CustomerFormCard } from "../../components/rentals/customer-form/CustomerFormCard";
import { CustomerFormFields } from "../../components/rentals/customer-form/CustomerFormFields";
import { CustomerFormFooter } from "../../components/rentals/customer-form/CustomerFormFooter";
import { CustomerFormHeader } from "../../components/rentals/customer-form/CustomerFormHeader";
import { CustomerPreviewPanel } from "../../components/rentals/customer-form/CustomerPreviewPanel";
import { CustomerTipsCard } from "../../components/rentals/customer-form/CustomerTipsCard";
import {
  getPreviewDisplay,
  hasFormErrors,
  validateCustomerForm,
  type CustomerFormErrors,
  type CustomerFormValues,
} from "../../components/rentals/customer-form/customerFormUtils";

const EMPTY_VALUES: CustomerFormValues = {
  legalName: "",
  customerType: "individual",
  contactName: "",
  email: "",
  phone: "",
  taxId: "",
  notes: "",
};

export function CustomerFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [values, setValues] = useState<CustomerFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CustomerFormValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const existing = useQuery({
    queryKey: ["rentals", "customer", id],
    queryFn: () => getRentalCustomer(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    const c = existing.data;
    if (!c) return;
    setValues({
      legalName: c.legal_name,
      customerType: c.customer_type,
      contactName: c.contact_name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      taxId: c.tax_id ?? "",
      notes: c.notes ?? "",
    });
  }, [existing.data]);

  const preview = useMemo(() => getPreviewDisplay(values), [values]);

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        legalName: values.legalName.trim(),
        customerType: values.customerType,
        contactName: values.contactName.trim() || undefined,
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
        taxId: values.taxId.trim() || undefined,
        notes: values.notes.trim() || undefined,
      };
      if (isEdit) return updateRentalCustomer(id!, body);
      return createRentalCustomer(body);
    },
    onSuccess: () => navigate("/rentals/customers"),
  });

  const handleChange = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (submitAttempted || touched[key]) {
        setErrors(validateCustomerForm(next));
      }
      return next;
    });
  };

  const handleBlur = (key: keyof CustomerFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors(validateCustomerForm(values));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const nextErrors = validateCustomerForm(values);
    setErrors(nextErrors);
    setTouched({
      legalName: true,
      email: true,
      phone: true,
    });
    if (hasFormErrors(nextErrors)) return;
    saveMut.mutate();
  };

  const displayTouched = submitAttempted
    ? { legalName: true, email: true, phone: true, ...touched }
    : touched;

  const subtitle = isEdit
    ? t("pages.customerForm.editSubtitle")
    : t("pages.customerForm.createSubtitle");

  return (
    <div className="fm-rental-customer-form flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <CustomerFormHeader
        title={isEdit ? t("pages.customerForm.editTitle") : t("pages.customerForm.createTitle")}
        subtitle={subtitle}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-8">
          <div>
            <CustomerFormCard>
              <CustomerFormFields
                values={values}
                errors={errors}
                touched={displayTouched}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <CustomerFormFooter
                isEdit={isEdit}
                pending={saveMut.isPending}
                onCancel={() => navigate(-1)}
              />
            </CustomerFormCard>
          </div>

          <div className="space-y-4">
            <CustomerPreviewPanel preview={preview} customerType={values.customerType} />
            <CustomerTipsCard />
          </div>
        </div>
      </form>

      {saveMut.isError && (
        <p className="mt-4 text-sm text-rose-700" role="alert">
          Could not save customer. Please try again.
        </p>
      )}
    </div>
  );
}
