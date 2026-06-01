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
    errors.legalName = "Legal name is required.";
  }
  if (values.email.trim() && !validateEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (values.phone.trim() && !validatePhone(values.phone)) {
    errors.phone = "Enter a valid phone number (at least 8 digits).";
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

  return {
    initials,
    legalName: legalName || "—",
    email: values.email.trim() || "—",
    phone: values.phone.trim() || "—",
    contactName: values.contactName.trim() || "—",
    taxId: values.taxId.trim() || "—",
    typeLabel: values.customerType === "company" ? "Company" : "Individual",
    isEmpty: !legalName,
  };
}
