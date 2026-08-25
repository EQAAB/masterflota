import i18n from "../../../i18n";

export type CustomerType = "individual" | "company";

export type CustomerFormValues = {
  legalName: string;
  customerType: CustomerType;
  contactName: string;
  email: string;
  phone: string;
  taxId: string;
  notes: string;
};

export type CustomerFormErrors = Partial<Record<keyof CustomerFormValues, string>>;

export function validateEmail(email: string): boolean {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  if (!phone.trim()) return true;
  return /^[\d\s+\-()]{8,}$/.test(phone.replace(/\s/g, ""));
}

export function validateCustomerForm(values: CustomerFormValues): CustomerFormErrors {
  const errors: CustomerFormErrors = {};
  if (!values.legalName.trim()) {
    errors.legalName = i18n.t("pages.bookingForm.legalNameRequired");
  }
  if (values.email.trim() && !validateEmail(values.email)) {
    errors.email = i18n.t("pages.bookingForm.invalidEmail");
  }
  if (values.phone.trim() && !validatePhone(values.phone)) {
    errors.phone = i18n.t("pages.bookingForm.invalidPhone");
  }
  return errors;
}

export function hasFormErrors(errors: CustomerFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export type CustomerPreviewDisplay = {
  initials: string;
  legalName: string;
  email: string;
  phone: string;
  contactName: string;
  taxId: string;
  typeLabel: string;
  isEmpty: boolean;
};

export function getPreviewDisplay(values: CustomerFormValues): CustomerPreviewDisplay {
  const legalName = values.legalName.trim();
  const parts = legalName.split(/\s+/).filter(Boolean);
  let initials = "?";
  if (parts.length === 1) initials = parts[0].slice(0, 2).toUpperCase();
  else if (parts.length > 1) {
    initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  const emDash = i18n.t("common.emDash");
  return {
    initials,
    legalName: legalName || emDash,
    email: values.email.trim() || emDash,
    phone: values.phone.trim() || emDash,
    contactName: values.contactName.trim() || emDash,
    taxId: values.taxId.trim() || emDash,
    typeLabel: values.customerType === "company" ? i18n.t("pages.customers.typeCompany") : i18n.t("pages.customers.typeIndividual"),
    isEmpty: !legalName,
  };
}
