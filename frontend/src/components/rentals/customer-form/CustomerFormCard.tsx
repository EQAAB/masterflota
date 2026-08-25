import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type CustomerFormCardProps = {
  children: ReactNode;
};

export function CustomerFormCard({ children }: CustomerFormCardProps) {
  const { t } = useTranslation();
  return (
    <section className="fm-rental-customer-form__card">
      <header className="mb-6">
        <h2 className="text-base font-semibold text-ink">{t("pages.bookingForm.customerDetailsTitle")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("pages.bookingForm.customerDetailsDesc")}</p>
      </header>
      {children}
    </section>
  );
}
