import { useQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { getRentalBookings } from "../../api/rentals";
import { QuickWeeklyRentalModal } from "./QuickWeeklyRentalModal";
import { useQuickWeeklyRentalModal } from "../../hooks/useQuickWeeklyRentalModal";
import { useCanManageRentals } from "../../lib/rentalsPermissions";
import { bookingStatusClass, formatBookingStatus } from "./rentalStatus";
import { formatCurrency } from "../../utils/currency";
import { btnPrimary } from "../../theme/classNames";

export function VehicleRentalHistoryPanel({ vehicleId }: { vehicleId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canManage = useCanManageRentals();
  const { quickWeeklyModal, openQuickWeeklyRental, closeQuickWeeklyRental } = useQuickWeeklyRentalModal();
  const { data, isLoading } = useQuery({
    queryKey: ["rentals", "bookings", "vehicle", vehicleId],
    queryFn: () => getRentalBookings({ vehicleId }).then((r) => r.data),
  });

  const active = (data ?? []).find((b) => b.status === "active" || b.status === "confirmed");

  return (
    <section className="rounded-[16px] border border-border/70 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t("pages.vehicleDetail.externalRentalsTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("pages.vehicleDetail.externalRentalsDesc")}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className={`${btnPrimary} !text-xs`}
            onClick={() => openQuickWeeklyRental({ vehicleId })}
          >
            {t("pages.vehicleDetail.quickWeeklyRentalButton")}
          </button>
        )}
      </div>

      {active && (
        <p className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900 ring-1 ring-sky-200/60">
          <Trans
            i18nKey="pages.vehicleDetail.activeUpcomingBookingPrefix"
            values={{ bookingNumber: active.booking_number, status: formatBookingStatus(active.status) }}
            components={{ b: <strong /> }}
          />
        </p>
      )}

      {isLoading && <p className="text-sm text-slate-500">{t("common.loading")}</p>}
      {!isLoading && (data ?? []).length === 0 && (
        <p className="text-sm text-slate-500">{t("pages.vehicleDetail.noRentalBookingsForVehicle")}</p>
      )}
      <ul className="space-y-2">
        {(data ?? []).map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm">
            <div>
              <Link to={`/rentals/bookings/${b.id}`} className="font-medium text-brand hover:underline">
                {b.booking_number}
              </Link>
              <span className="ml-2 text-slate-600">{b.customer_name}</span>
              <p className="text-xs text-slate-500">
                {b.start_at.slice(0, 10)} – {b.end_at.slice(0, 10)} · {formatCurrency(Number(b.total_amount))}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${bookingStatusClass(b.status)}`}
            >
              {formatBookingStatus(b.status)}
            </span>
          </li>
        ))}
      </ul>
      <QuickWeeklyRentalModal
        open={quickWeeklyModal.open}
        onClose={closeQuickWeeklyRental}
        initialCustomerId={quickWeeklyModal.customerId}
        initialVehicleId={quickWeeklyModal.vehicleId ?? vehicleId}
        initialStartAt={quickWeeklyModal.startAt}
        onSuccess={(bookingId) => navigate(`/rentals/bookings/${bookingId}`)}
      />
    </section>
  );
}
