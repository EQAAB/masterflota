import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { VehicleListItem } from "../../api/vehicles";
import { getDriverDisplayId } from "../../utils/vehicleTypeDisplay";
import { DriverAvatar } from "../drivers/DriverAvatar";

function UnassignedIcon() {
  return (
    <svg className="h-4 w-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM4 4l16 16"
      />
    </svg>
  );
}

export function VehicleDriverCell({ vehicle }: { vehicle: VehicleListItem }) {
  const { t } = useTranslation();
  const hasDriver =
    vehicle.current_driver_id && (vehicle.driver_first_name || vehicle.driver_last_name);

  if (hasDriver) {
    const displayId = getDriverDisplayId(vehicle);
    return (
      <Link to={`/drivers/${vehicle.current_driver_id}`} className="group flex min-w-0 items-center gap-2.5">
        <DriverAvatar
          driverId={vehicle.current_driver_id!}
          profilePhotoUrl={vehicle.driver_profile_photo_url}
          firstName={vehicle.driver_first_name ?? ""}
          lastName={vehicle.driver_last_name ?? ""}
          size="sm"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink group-hover:text-brand">
            {`${vehicle.driver_first_name ?? ""} ${vehicle.driver_last_name ?? ""}`.trim()}
          </p>
          {displayId && (
            <p className="truncate text-xs text-ink-muted tabular-nums">{t("common.id")}: {displayId}</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-mint/60 ring-1 ring-border/60">
        <UnassignedIcon />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink-muted">{t("common.unassigned")}</p>
        <p className="truncate text-xs text-ink-muted/80">{t("pages.vehiclesList.noDriverAssigned")}</p>
      </div>
    </div>
  );
}
