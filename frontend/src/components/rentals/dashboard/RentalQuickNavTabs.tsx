import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/rentals/bookings", label: "Bookings" },
  { to: "/rentals/calendar", label: "Calendar" },
  { to: "/rentals/customers", label: "Customers" },
  { to: "/rentals/payments", label: "Payments" },
];

export function RentalQuickNavTabs() {
  const location = useLocation();

  return (
    <nav className="mb-6 fm-rental-dashboard__tabs" aria-label="Rental sections">
      {tabs.map(({ to, label }) => {
        const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            className={`fm-rental-dashboard__tab ${active ? "fm-rental-dashboard__tab--active" : ""}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
