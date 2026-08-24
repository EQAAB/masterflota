import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const tabs = [
  { to: "/rentals/bookings", key: "bookings" },
  { to: "/rentals/calendar", key: "calendar" },
  { to: "/rentals/customers", key: "customers" },
  { to: "/rentals/payments", key: "payments" },
] as const;

export function RentalQuickNavTabs() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="mb-6 fm-rental-dashboard__tabs" aria-label={t("pages.rentalDashboard.rentalSections")}>
      {tabs.map(({ to, key }) => {
        const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            className={`fm-rental-dashboard__tab ${active ? "fm-rental-dashboard__tab--active" : ""}`}
          >
            {t(`nav.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
