import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type CustomerFormHeaderProps = {
  title: string;
  subtitle: string;
};

export function CustomerFormHeader({ title, subtitle }: CustomerFormHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="mb-6">
      <Link to="/rentals/customers" className="fm-rental-customer-form__back mb-3 inline-flex">
        <span aria-hidden>←</span> {t("common.back")}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{subtitle}</p>
    </header>
  );
}
