import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRentalAvailability } from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";

export function VehicleAvailabilityPage() {
  const today = useMemo(() => new Date(), []);
  const from = today.toISOString().slice(0, 10);
  const to = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  }, [today]);

  const { data, isLoading } = useQuery({
    queryKey: ["rentals", "availability-matrix", from, to],
    queryFn: () => getRentalAvailability({ from, to }).then((r) => r.data),
  });

  const blockedByVehicle = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of data?.availability ?? []) {
      if (!a.is_available) {
        map.set(a.vehicle_id, (map.get(a.vehicle_id) ?? 0) + 1);
      }
    }
    return map;
  }, [data?.availability]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title="Vehicle availability"
        subtitle={`Next 14 days from ${from}`}
        backTo="/rentals"
      />
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.vehicles ?? []).map((v) => {
          const blocked = blockedByVehicle.get(v.id) ?? 0;
          const assigned = (v as { driver_assigned?: boolean }).driver_assigned;
          return (
            <article key={v.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="font-semibold text-ink">{v.license_plate}</p>
              <p className="text-sm text-slate-600">
                {v.make} {v.model}
              </p>
              <p className="mt-2 text-xs capitalize text-slate-500">Status: {v.status}</p>
              {assigned && <p className="mt-1 text-xs text-amber-700">Driver assigned — external rental may conflict</p>}
              {blocked > 0 && (
                <p className="mt-1 text-xs text-rose-700">{blocked} blocked day(s) in range</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
