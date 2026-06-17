import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import { btnPrimary } from "../../../theme/classNames";

type RentalDashboardHeaderProps = {
  onQuickWeekly?: () => void;
};

export function RentalDashboardHeader({ onQuickWeekly }: RentalDashboardHeaderProps) {
  const canManage = useCanManageRentals();
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">Rental Dashboard</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Manage external vehicle rentals, customers, bookings, payments, and availability.
        </p>
      </div>
      {canManage && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {onQuickWeekly && (
            <button type="button" className={btnPrimary} onClick={onQuickWeekly}>
              Quick weekly rental
            </button>
          )}
        </div>
      )}
    </header>
  );
}
