import type { PoolClient } from "pg";
import { roundMoney } from "./debtAllocation";

/** Older week that originated driver debt (negative earnings). */
export type PriorDebtOrigin = {
  period_start: string;
  period_end: string;
  /** Original debt from negative raw net (|raw_net| / debt_amount). */
  original_debt: string;
  /** Still outstanding on that origin week. */
  remaining_debt: string;
};

/**
 * Load prior weeks (ending before `beforePeriodStart`) where the driver had negative
 * earnings / debt — used to label “previous week debt deducted” on later payouts.
 */
export async function loadPriorDebtOriginsByDriver(
  client: PoolClient,
  orgId: string,
  driverIds: string[],
  beforePeriodStart: string,
): Promise<Map<string, PriorDebtOrigin[]>> {
  const result = new Map<string, PriorDebtOrigin[]>();
  if (driverIds.length === 0) return result;

  const { rows } = await client.query<{
    driver_id: string;
    period_start: string;
    period_end: string;
    original_debt: string;
    remaining_debt: string;
  }>(
    `SELECT dp.driver_id::text,
            dp.payment_period_start::text AS period_start,
            dp.payment_period_end::text AS period_end,
            ROUND(SUM(
              GREATEST(
                COALESCE(dp.debt_amount, 0),
                CASE WHEN COALESCE(dp.raw_net_amount, 0) < 0
                  THEN ABS(dp.raw_net_amount) ELSE 0 END
              )
            )::numeric, 2)::text AS original_debt,
            ROUND(SUM(GREATEST(COALESCE(dp.remaining_debt_amount, 0), 0))::numeric, 2)::text AS remaining_debt
     FROM driver_payouts dp
     WHERE dp.organization_id = $1::uuid
       AND dp.driver_id = ANY($2::uuid[])
       AND dp.payment_period_end < $3::date
       AND (
         COALESCE(dp.debt_amount, 0) > 0.02
         OR COALESCE(dp.raw_net_amount, 0) < -0.02
         OR COALESCE(dp.remaining_debt_amount, 0) > 0.02
       )
     GROUP BY dp.driver_id, dp.payment_period_start, dp.payment_period_end
     HAVING SUM(
       GREATEST(
         COALESCE(dp.debt_amount, 0),
         CASE WHEN COALESCE(dp.raw_net_amount, 0) < 0
           THEN ABS(dp.raw_net_amount) ELSE 0 END
       )
     ) > 0.02
        OR SUM(GREATEST(COALESCE(dp.remaining_debt_amount, 0), 0)) > 0.02
     ORDER BY dp.payment_period_end DESC`,
    [orgId, driverIds, beforePeriodStart.slice(0, 10)],
  );

  for (const row of rows) {
    const list = result.get(row.driver_id) ?? [];
    list.push({
      period_start: row.period_start.slice(0, 10),
      period_end: row.period_end.slice(0, 10),
      original_debt: roundMoney(Number(row.original_debt)).toFixed(2),
      remaining_debt: roundMoney(Number(row.remaining_debt)).toFixed(2),
    });
    result.set(row.driver_id, list);
  }

  return result;
}
