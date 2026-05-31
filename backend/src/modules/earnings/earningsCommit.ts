import type { PoolClient } from "pg";
import type { EarningsPlatform } from "./detectPlatform";
import type { DriverMatchRow } from "./matchDriver";
import { DriverMatchIndex } from "./matchDriver";
import { query } from "../../db/pool";
import type { EarningsStagingPayload } from "./normalizeRow";
import { roundMoney } from "./debtAllocation";
import { calculatePayout, parseCommissionBaseType } from "./calculatePayout";
import { payoutPlatformIdForDriver } from "./payoutPlatformId";
import { applyWeeklyCustomFees } from "./driverPayoutCustomFees";
import { isBoltWeeklyImportMeta, recomputeDriverPayoutsForPaymentWeek } from "./recomputeDriverPayoutRollup";
import { mapBoltWeeklyAmounts } from "./mapBoltWeeklyAmounts";
import { mapUberTaxiAmounts } from "./mapUberTaxiAmounts";
import {
  readOrgDefaultAccountOpeningFee,
  readOrgDefaultPlatformFee,
  resolveAccountOpeningFeeForEarningsRow,
  resolvePlatformFeeWithGrossNetInference,
} from "./accountOpeningFee";

export type EarningsCommitTotals = {
  gross: number;
  fee: number;
  net: number;
  comm: number;
  payout: number;
  trips: number;
};

export type EarningsCommitResult = {
  insertedRows: number;
  skippedNoDriver: number;
  skippedNoDate: number;
  skippedNoMoney: number;
  totals: EarningsCommitTotals;
  warnings: string[];
};

/** Keep trip_date inside the payment week (Uber exports often lack a date column; filename fallback can drift). */
export function clampTripDateToPaymentWeek(
  tripDate: string,
  weekStart: string,
  weekEnd: string,
): string {
  if (tripDate < weekStart) return weekStart;
  if (tripDate > weekEnd) return weekEnd;
  return tripDate;
}

async function loadMatchIndex(orgId: string): Promise<DriverMatchIndex> {
  const { rows: drivers } = await query<DriverMatchRow>(
    `SELECT id, phone, first_name, last_name, uber_driver_id, bolt_driver_id, glovo_courier_id, bolt_courier_id,
            bolt_taxi_driver_uuid::text AS bolt_taxi_driver_uuid, wolt_courier_id,
            commission_type, commission_rate::text, fixed_commission_amount::text, minimum_commission::text
     FROM drivers WHERE organization_id = $1`,
    [orgId],
  );
  const { rows: plates } = await query<{ license_plate: string; current_driver_id: string }>(
    `SELECT license_plate, current_driver_id::text
     FROM vehicles
     WHERE organization_id = $1 AND current_driver_id IS NOT NULL`,
    [orgId],
  );
  return new DriverMatchIndex(drivers, plates);
}

type InsertRow = {
  driver_id: string;
  platform_id: string | null;
  trip_date: string;
  trip_count: number | null;
  gross: number | null;
  fee: number | null;
  net: number | null;
  total_transfer_earnings: number | null;
  daily_cash: number | null;
  account_opening_fee: number | null;
  company_commission: number;
  tips: number | null;
  driver_payout: number;
  commission_type: string;
  glovo_gross_income: number;
  glovo_net_income: number;
  commission_base: number;
  commission_rate_frac: number;
  platform_metadata: Record<string, string>;
};

/** Build rows and write earnings_records, driver_payouts rollup, finalize import (same transaction as caller). */
export async function runEarningsCommitFromStaging(
  client: PoolClient,
  orgId: string,
  importId: string,
  platformEff: EarningsPlatform,
  weekStartEff: string,
  weekEndEff: string,
): Promise<EarningsCommitResult> {
  const staging = await client.query<{ row_index: number; payload: EarningsStagingPayload }>(
    `SELECT row_index, payload FROM earnings_import_staging WHERE import_id = $1 ORDER BY row_index`,
    [importId],
  );

  const impMetaRes = await client.query<{ detection_meta: unknown }>(
    `SELECT detection_meta FROM earnings_imports WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [importId, orgId],
  );
  const detectionMeta = impMetaRes.rows[0]?.detection_meta;
  const commissionBaseType =
    platformEff === "glovo"
      ? parseCommissionBaseType(
          (detectionMeta as Record<string, unknown> | null)?.glovoCommissionBaseType,
        )
      : "net_income";
  const isBoltWeekly =
    platformEff === "bolt_courier" && isBoltWeeklyImportMeta(detectionMeta);

  const index = await loadMatchIndex(orgId);
  const driversRes = await client.query<DriverMatchRow & { id: string }>(
    `SELECT d.id, d.phone, d.first_name, d.last_name, d.uber_driver_id, d.bolt_driver_id, d.glovo_courier_id,
            d.bolt_courier_id, d.bolt_taxi_driver_uuid::text AS bolt_taxi_driver_uuid, d.wolt_courier_id,
            d.commission_type, d.commission_rate::text, d.fixed_commission_amount::text, d.minimum_commission::text,
            d.subcontractor_id::text
     FROM drivers d
     WHERE d.organization_id = $1`,
    [orgId],
  );
  const driverById = new Map(driversRes.rows.map((d) => [d.id, d]));

  const metaDefault = (detectionMeta as Record<string, unknown> | null)?.defaultAccountOpeningFee;
  const orgDefaultOpeningFee =
    platformEff === "glovo"
      ? typeof metaDefault === "number" && Number.isFinite(metaDefault)
        ? metaDefault
        : await readOrgDefaultAccountOpeningFee(orgId)
      : 0;
  const defaultOpeningApplied = new Set<string>();
  const metaPlatformDefault = (detectionMeta as Record<string, unknown> | null)?.defaultPlatformFee;
  const orgDefaultPlatformFee =
    platformEff === "glovo"
      ? typeof metaPlatformDefault === "number" && Number.isFinite(metaPlatformDefault)
        ? metaPlatformDefault
        : await readOrgDefaultPlatformFee(orgId)
      : 0;
  const defaultPlatformApplied = new Set<string>();

  const toInsert: InsertRow[] = [];
  let skippedNoDriver = 0;
  let skippedNoDate = 0;
  let skippedNoMoney = 0;

  for (const row of staging.rows) {
    const p = row.payload;
    const { driverId } = index.match(platformEff, p.hints);
    if (!driverId) {
      skippedNoDriver += 1;
      continue;
    }
    let tripDateIso = p.tripDateIso ?? weekEndEff;
    if (tripDateIso) {
      tripDateIso = clampTripDateToPaymentWeek(tripDateIso, weekStartEff, weekEndEff);
    }
    if (!tripDateIso) {
      skippedNoDate += 1;
      continue;
    }
    const gross = p.amounts.gross;
    const net = p.amounts.net;
    const fee = p.amounts.platformFee;
    const transferTotalRaw = p.amounts.transferTotal ?? null;
    if (isBoltWeekly) {
      if (gross === null && net === null) {
        skippedNoMoney += 1;
        continue;
      }
    } else if (gross === null && net === null && transferTotalRaw === null) {
      skippedNoMoney += 1;
      continue;
    }

    const drv = driverById.get(driverId);
    if (!drv) {
      skippedNoDriver += 1;
      continue;
    }

    if (isBoltWeekly) {
      const bolt = mapBoltWeeklyAmounts({
        adjustedEarningsWithVat: gross ?? 0,
        adjustedEarningsWithoutVat: p.amounts.boltAdjustedWithoutVat ?? 0,
        courierTipsWithVat: p.amounts.tips ?? 0,
        courierTipsWithoutVat: p.amounts.boltTipsWithoutVat ?? 0,
      });

      const courierUid = p.hints.courierId?.trim();
      if (courierUid && !drv.bolt_courier_id) {
        await client.query(
          `UPDATE drivers SET bolt_courier_id = $1
           WHERE id = $2::uuid AND organization_id = $3::uuid AND (bolt_courier_id IS NULL OR TRIM(bolt_courier_id) = '')`,
          [courierUid, driverId, orgId],
        );
        drv.bolt_courier_id = courierUid;
      }

      toInsert.push({
        driver_id: driverId,
        platform_id: payoutPlatformIdForDriver(drv, platformEff) ?? courierUid ?? null,
        trip_date: tripDateIso,
        trip_count: p.amounts.tripCount,
        gross: bolt.income,
        fee: 0,
        net: bolt.net_income,
        total_transfer_earnings: null,
        daily_cash: p.amounts.dailyCash ?? null,
        account_opening_fee: 0,
        company_commission: 0,
        tips: bolt.tips,
        driver_payout: 0,
        commission_type: drv.commission_type || "percentage",
        glovo_gross_income: bolt.gross_income,
        glovo_net_income: bolt.net_income,
        commission_base: 0,
        commission_rate_frac: 0,
        platform_metadata: p.amounts.platformMetadata ?? {},
      });
      continue;
    }

    if (platformEff === "bolt_taxi") {
      const courierUid = p.hints.courierId?.trim();
      if (courierUid && !drv.bolt_taxi_driver_uuid) {
        const uuidRe =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRe.test(courierUid)) {
          await client.query(
            `UPDATE drivers SET bolt_taxi_driver_uuid = $1::uuid
             WHERE id = $2::uuid AND organization_id = $3::uuid AND bolt_taxi_driver_uuid IS NULL`,
            [courierUid, driverId, orgId],
          );
          drv.bolt_taxi_driver_uuid = courierUid;
        }
      }
    }

    if (platformEff === "uber") {
      const courierUid = p.hints.courierId?.trim();
      if (courierUid && !drv.uber_driver_id) {
        await client.query(
          `UPDATE drivers SET uber_driver_id = $1
           WHERE id = $2::uuid AND organization_id = $3::uuid AND (uber_driver_id IS NULL OR TRIM(uber_driver_id) = '')`,
          [courierUid, driverId, orgId],
        );
        drv.uber_driver_id = courierUid;
      }
    }

    const tipsVal = p.amounts.tips ?? null;
    const accountOpeningRaw = resolveAccountOpeningFeeForEarningsRow({
      platform: platformEff,
      csvFee: p.amounts.accountOpeningFee,
      orgDefault: orgDefaultOpeningFee,
      driverId,
      defaultAppliedForDriver: defaultOpeningApplied,
    });

    if (platformEff === "uber") {
      const uber = mapUberTaxiAmounts({
        castigurileTale: p.amounts.castigurileTale ?? net,
        receivedTotal: p.amounts.receivedTotal ?? null,
        platformFee: fee ?? p.amounts.platformFee ?? null,
        dailyCash: p.amounts.dailyCash,
        tips: tipsVal,
        gross,
        driver: drv,
        commission_base_type: commissionBaseType,
      });
      toInsert.push({
        driver_id: driverId,
        platform_id: payoutPlatformIdForDriver(drv, platformEff),
        trip_date: tripDateIso,
        trip_count: p.amounts.tripCount,
        gross: uber.gross,
        fee: uber.platform_fee,
        net: uber.net,
        total_transfer_earnings: transferTotalRaw,
        daily_cash: p.amounts.dailyCash ?? null,
        account_opening_fee: accountOpeningRaw,
        company_commission: uber.company_commission,
        tips: tipsVal,
        driver_payout: uber.driver_payout,
        commission_type: uber.commission_type,
        glovo_gross_income: uber.gross_income,
        glovo_net_income: uber.net_income,
        commission_base: roundMoney(uber.commission_base),
        commission_rate_frac: uber.commission_rate,
        platform_metadata: p.amounts.platformMetadata ?? {},
      });
      continue;
    }

    let g = gross;
    let n = net;
    const resolvedPlatformFee = resolvePlatformFeeWithGrossNetInference({
      platform: platformEff,
      csvFee: fee,
      gross: g,
      net: n,
      tips: tipsVal,
      orgDefault: orgDefaultPlatformFee,
      driverId,
      defaultAppliedForDriver: defaultPlatformApplied,
    });
    let f = resolvedPlatformFee;
    if (g === null && n !== null && f != null) g = n + Math.abs(f);
    if (n === null && g !== null && f != null) n = g - Math.abs(f);
    if (f == null && g !== null && n != null && platformEff !== "glovo" && platformEff !== "bolt_taxi") {
      f = Math.abs(g + (tipsVal ?? 0) - n);
    }
    if (f != null) f = Math.abs(f);

    const taxaForCalc = platformEff === "bolt_taxi" ? 0 : f;
    const calc = calculatePayout({
      income: g,
      tips: tipsVal,
      taxa_aplicatie: taxaForCalc,
      plata_zilnica_cash: p.amounts.dailyCash,
      transferTotal: transferTotalRaw,
      resolvedPlatformNet: n,
      driver: drv,
      commission_base_type: commissionBaseType,
    });

    toInsert.push({
      driver_id: driverId,
      platform_id: payoutPlatformIdForDriver(drv, platformEff),
      trip_date: tripDateIso,
      trip_count: p.amounts.tripCount,
      gross: g,
      fee: platformEff === "bolt_taxi" ? null : f,
      net: n ?? calc.net_income,
      total_transfer_earnings: transferTotalRaw,
      daily_cash: p.amounts.dailyCash ?? null,
      account_opening_fee: accountOpeningRaw,
      company_commission: calc.company_commission,
      tips: tipsVal,
      driver_payout: calc.driver_payout,
      commission_type: calc.commission_type,
      glovo_gross_income: calc.gross_income,
      glovo_net_income: calc.net_income,
      commission_base: roundMoney(calc.commission_base),
      commission_rate_frac: calc.commission_rate,
      platform_metadata: p.amounts.platformMetadata ?? {},
    });
  }

  const batch = 200;
  for (let i = 0; i < toInsert.length; i += batch) {
    const slice = toInsert.slice(i, i + batch);
    const values: unknown[] = [];
    const ph: string[] = [];
    let p = 1;
    for (const r of slice) {
      ph.push(
        `($${p++}::uuid, $${p++}::uuid, $${p++}, $${p++}::date, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}::jsonb)`,
      );
      values.push(
        importId,
        r.driver_id,
        platformEff,
        r.trip_date,
        r.trip_count,
        r.gross,
        r.fee,
        r.net,
        r.total_transfer_earnings,
        r.daily_cash,
        r.account_opening_fee,
        r.company_commission,
        r.commission_base,
        r.tips,
        r.driver_payout,
        r.commission_type,
        JSON.stringify(r.platform_metadata ?? {}),
      );
    }
    await client.query(
      `INSERT INTO earnings_records (
          import_id, driver_id, platform, trip_date, trip_count,
          gross_earnings, platform_fee, net_earnings,
          total_transfer_earnings, daily_cash, account_opening_fee,
          company_commission, commission_base, tips, driver_payout, commission_type,
          platform_metadata
        ) VALUES ${ph.join(",")}`,
      values,
    );
  }

  const totals = toInsert.reduce(
    (acc, r) => {
      acc.gross += r.gross ?? 0;
      acc.fee += r.fee ?? 0;
      acc.net += r.net ?? 0;
      acc.comm += r.company_commission;
      acc.payout += r.driver_payout;
      acc.trips += r.trip_count ?? 1;
      return acc;
    },
    { gross: 0, fee: 0, net: 0, comm: 0, payout: 0, trips: 0 },
  );

  const stagingCountRes = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM earnings_import_staging WHERE import_id = $1::uuid`,
    [importId],
  );
  const stagingRowCount = parseInt(stagingCountRes.rows[0]?.c ?? "0", 10);

  await client.query(
    `UPDATE earnings_imports SET
        status = 'completed',
        record_count = $2,
        processed_rows = $2,
        total_rows = GREATEST(COALESCE(total_rows, 0), $5),
        total_gross = $3,
        total_trips = $4
       WHERE id = $1`,
    [importId, toInsert.length, totals.gross, totals.trips, stagingRowCount],
  );

  const touchedDriverIds = [...new Set(toInsert.map((r) => r.driver_id))];
  await recomputeDriverPayoutsForPaymentWeek(
    client,
    orgId,
    driverById,
    weekStartEff,
    weekEndEff,
    platformEff,
  );

  await applyWeeklyCustomFees(client, orgId, weekStartEff, weekEndEff);

  const driverIds = touchedDriverIds;
  const warnings: string[] = [];
  if (driverIds.length > 0) {
    const zeroWeeklyRent = await client.query<{ first_name: string; last_name: string; license_plate: string }>(
      `SELECT DISTINCT d.first_name, d.last_name, v.license_plate
       FROM drivers d
       INNER JOIN vehicles v ON v.id = d.current_vehicle_id AND v.organization_id = d.organization_id
       WHERE d.organization_id = $1::uuid
         AND d.id = ANY($2::uuid[])
         AND d.current_vehicle_id IS NOT NULL
         AND COALESCE(v.weekly_rent, 0) = 0
       ORDER BY d.last_name, d.first_name, v.license_plate`,
      [orgId, driverIds],
    );
    for (const r of zeroWeeklyRent.rows) {
      warnings.push(
        `${r.first_name} ${r.last_name}: assigned vehicle (${r.license_plate}) has no weekly rent — fee not deducted; set Weekly rent on the vehicle.`,
      );
    }
  }

  await client.query(`DELETE FROM earnings_import_staging WHERE import_id = $1`, [importId]);

  await client.query(`SELECT refresh_subcontractor_payouts($1::uuid, $2::date, $3::date)`, [
    orgId,
    weekStartEff,
    weekEndEff,
  ]);

  return {
    insertedRows: toInsert.length,
    skippedNoDriver,
    skippedNoDate,
    skippedNoMoney,
    totals,
    warnings,
  };
}
