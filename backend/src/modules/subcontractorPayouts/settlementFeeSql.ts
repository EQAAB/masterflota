/**
 * Custom fee aggregation aligned with subcontractor_settlement_totals (migration 085).
 * Manual fees per driver_payout row; weekly recurring fees once on anchor platform payout per driver/week.
 * Requires aliases: dp (driver_payouts), sp (subcontractor_payouts) where anchor join is used.
 */

/** Per-row manual adjustments (source = manual only). */
export const MANUAL_FEE_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(CASE WHEN pa.fee_type = 'deduction' THEN pa.amount ELSE 0 END), 0) AS deductions,
      COALESCE(SUM(CASE WHEN pa.fee_type = 'addition' THEN pa.amount ELSE 0 END), 0) AS additions
    FROM driver_payout_adjustments pa
    WHERE pa.driver_payout_id = dp.id
      AND pa.source = 'manual'
  ) manual_fee ON true`;

/**
 * Anchor payout id for driver/week among payouts linked to settlement sp.id.
 * Platform priority: glovo → uber → bolt_taxi → bolt → other.
 */
export const ANCHOR_PAYOUT_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT dp_anchor.id AS payout_id
    FROM driver_payouts dp_anchor
    WHERE dp_anchor.organization_id = dp.organization_id
      AND dp_anchor.driver_id = dp.driver_id
      AND dp_anchor.payment_period_start = dp.payment_period_start
      AND dp_anchor.payment_period_end = dp.payment_period_end
      AND dp_anchor.subcontractor_payout_id = sp.id
    ORDER BY
      CASE dp_anchor.platform
        WHEN 'glovo' THEN 1
        WHEN 'uber' THEN 2
        WHEN 'bolt_taxi' THEN 3
        WHEN 'bolt' THEN 4
        ELSE 5
      END,
      dp_anchor.id
    LIMIT 1
  ) anchor_payout ON true`;

/** Weekly recurring fees for driver/week (applied on anchor payout row only). */
export const WEEKLY_FEE_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(CASE WHEN dwf.fee_type = 'deduction' THEN dwf.amount ELSE 0 END), 0) AS deductions,
      COALESCE(SUM(CASE WHEN dwf.fee_type = 'addition' THEN dwf.amount ELSE 0 END), 0) AS additions
    FROM driver_weekly_fees dwf
    WHERE dwf.organization_id = dp.organization_id
      AND dwf.driver_id = dp.driver_id
      AND dwf.payment_period_start = dp.payment_period_start
      AND dwf.payment_period_end = dp.payment_period_end
  ) weekly_fee ON true`;

/** SQL expression: total custom deductions for one driver_payout row. */
export const DRIVER_CUSTOM_DEDUCTIONS_EXPR = `(
  COALESCE(manual_fee.deductions, 0)
  + CASE WHEN anchor_payout.payout_id = dp.id THEN COALESCE(weekly_fee.deductions, 0) ELSE 0 END
)`;

/** SQL expression: total custom additions for one driver_payout row. */
export const DRIVER_CUSTOM_ADDITIONS_EXPR = `(
  COALESCE(manual_fee.additions, 0)
  + CASE WHEN anchor_payout.payout_id = dp.id THEN COALESCE(weekly_fee.additions, 0) ELSE 0 END
)`;

/** Joins required before using DRIVER_CUSTOM_*_EXPR (includes manual, anchor, weekly). */
export const DRIVER_FEE_JOINS = `
  ${MANUAL_FEE_LATERAL}
  ${ANCHOR_PAYOUT_LATERAL}
  ${WEEKLY_FEE_LATERAL}`;
