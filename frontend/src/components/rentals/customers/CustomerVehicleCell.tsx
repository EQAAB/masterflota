import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RentalCustomer } from "../../../api/rentals";
import {
  customerHasActiveVehicle,
  formatCustomerVehicleExtra,
  formatCustomerVehicleLabel,
  formatCustomerVehiclePlate,
  getCustomerVehicleLinkId,
} from "../../../utils/customerVehicleDisplay";

export function CustomerVehicleCell({ customer }: { customer: RentalCustomer }) {
  const { t } = useTranslation();
  if (!customerHasActiveVehicle(customer)) {
    return <span className="text-sm text-ink-muted">{t("common.emDash")}</span>;
  }

  const vehicleId = getCustomerVehicleLinkId(customer);
  const label = formatCustomerVehicleLabel(customer);
  const plate = formatCustomerVehiclePlate(customer);
  const extra = formatCustomerVehicleExtra(customer);

  if (!label) {
    return <span className="text-sm text-ink-muted">{t("common.emDash")}</span>;
  }

  const content = (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-ink">{label}</p>
      {plate && <p className="truncate text-xs text-ink-muted tabular-nums">{plate}</p>}
      {extra && <p className="truncate text-xs text-sky-700">{extra}</p>}
    </div>
  );

  if (vehicleId) {
    return (
      <Link to={`/vehicles/${vehicleId}`} className="block min-w-0 hover:text-brand" onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    );
  }

  return content;
}
