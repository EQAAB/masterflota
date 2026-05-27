import type { EarningsPlatform } from "./detectPlatform";
import type { RowHints } from "./normalizeRow";

export type MatchMethod = "courier_id" | "phone" | "plate" | "driver_name" | "none";

export interface DriverMatchRow {
  id: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  uber_driver_id: string | null;
  bolt_driver_id: string | null;
  glovo_courier_id: string | null;
  bolt_courier_id: string | null;
  bolt_taxi_driver_uuid: string | null;
  wolt_courier_id: string | null;
  commission_type: string;
  commission_rate: string | null;
  fixed_commission_amount: string | null;
  minimum_commission: string | null;
  subcontractor_id?: string | null;
}

function digits(s: string): string {
  return s.replace(/\D/g, "");
}

function normPlate(s: string): string {
  return s.toUpperCase().replace(/\s+/g, "");
}

function normDriverName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export class DriverMatchIndex {
  private byCourier = new Map<string, { id: string; field: string }>();

  private phoneDigits = new Map<string, string>();

  private plateToDriver = new Map<string, string>();

  private byDriverName = new Map<string, string>();

  constructor(
    drivers: DriverMatchRow[],
    plates: { license_plate: string; current_driver_id: string }[],
  ) {
    for (const d of drivers) {
      const add = (val: string | null | undefined, field: string) => {
        if (!val) return;
        const k = val.trim().toLowerCase();
        if (k.length < 2) return;
        if (!this.byCourier.has(k)) this.byCourier.set(k, { id: d.id, field });
      };
      add(d.uber_driver_id, "uber_driver_id");
      add(d.bolt_driver_id, "bolt_driver_id");
      add(d.glovo_courier_id, "glovo_courier_id");
      add(d.bolt_courier_id, "bolt_courier_id");
      add(d.bolt_taxi_driver_uuid, "bolt_taxi_driver_uuid");
      add(d.wolt_courier_id, "wolt_courier_id");

      const ph = digits(d.phone);
      if (ph.length >= 9) {
        const tail = ph.slice(-9);
        if (!this.phoneDigits.has(tail)) this.phoneDigits.set(tail, d.id);
      }

      const fullName = normDriverName(`${d.first_name ?? ""} ${d.last_name ?? ""}`);
      if (fullName.length >= 3 && !this.byDriverName.has(fullName)) {
        this.byDriverName.set(fullName, d.id);
      }
    }
    for (const p of plates) {
      if (!p.current_driver_id) continue;
      const pl = normPlate(p.license_plate);
      if (pl.length >= 4 && !this.plateToDriver.has(pl)) this.plateToDriver.set(pl, p.current_driver_id);
    }
  }

  match(_platform: EarningsPlatform, hints: RowHints): { driverId: string | null; matchMethod: MatchMethod } {
    if (hints.courierId) {
      const k = hints.courierId.trim().toLowerCase();
      const hit = this.byCourier.get(k);
      if (hit) return { driverId: hit.id, matchMethod: "courier_id" };
    }
    if (hints.phone) {
      const ph = digits(hints.phone);
      if (ph.length >= 9) {
        const tail = ph.slice(-9);
        const id = this.phoneDigits.get(tail);
        if (id) return { driverId: id, matchMethod: "phone" };
      }
    }
    if (hints.driverName) {
      const nameKey = normDriverName(hints.driverName);
      const id = this.byDriverName.get(nameKey);
      if (id) return { driverId: id, matchMethod: "driver_name" };
    }
    if (hints.plate) {
      const pl = normPlate(hints.plate);
      const id = this.plateToDriver.get(pl);
      if (id) return { driverId: id, matchMethod: "plate" };
    }
    return { driverId: null, matchMethod: "none" };
  }
}
