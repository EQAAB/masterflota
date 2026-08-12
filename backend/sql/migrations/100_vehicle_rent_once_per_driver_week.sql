-- Vehicle rent once per driver/week on fee-anchor platform only
-- (Glovo → Uber → Bolt Taxi → Bolt), matching weekly recurring fee priority.
-- Previously refresh_driver_payout_vehicle_fees charged full rent on every platform
-- leg, which double-counted rent when pooling Uber + Bolt (etc.) raw nets.

CREATE OR REPLACE FUNCTION refresh_driver_payout_vehicle_fees(p_org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  n INT;
BEGIN
  -- Anchor open payouts: ensure calculated weekly rent is stored.
  -- Adjust raw_net by rent delta only so recurring/custom fees already in raw_net are kept.
  UPDATE driver_payouts dp
  SET
    raw_net_amount = ROUND(
      (COALESCE(dp.raw_net_amount, 0)::numeric + COALESCE(dp.vehicle_rental_fee, 0)::numeric - rf.calc)::numeric,
      2
    ),
    vehicle_rental_fee = rf.calc,
    updated_at = NOW()
  FROM (
    SELECT
      ranked.id,
      calculate_rental_fee(
        ranked.organization_id,
        ranked.driver_id,
        ranked.payment_period_start,
        ranked.payment_period_end
      )::numeric AS calc
    FROM (
      SELECT
        dp2.id,
        dp2.organization_id,
        dp2.driver_id,
        dp2.payment_period_start,
        dp2.payment_period_end,
        ROW_NUMBER() OVER (
          PARTITION BY dp2.driver_id, dp2.payment_period_start, dp2.payment_period_end
          ORDER BY
            CASE dp2.platform
              WHEN 'glovo' THEN 1
              WHEN 'uber' THEN 2
              WHEN 'bolt_taxi' THEN 3
              WHEN 'bolt' THEN 4
              ELSE 5
            END,
            dp2.id
        ) AS rn
      FROM driver_payouts dp2
      WHERE dp2.organization_id = p_org_id
        AND dp2.payment_status NOT IN ('paid', 'approved')
    ) ranked
    WHERE ranked.rn = 1
  ) rf
  WHERE dp.id = rf.id;

  GET DIAGNOSTICS n = ROW_COUNT;

  -- Non-anchor open payouts: remove weekly rent from fee + raw_net (preserve other fees in raw_net)
  UPDATE driver_payouts dp
  SET
    raw_net_amount = ROUND(
      (COALESCE(dp.raw_net_amount, 0)::numeric + COALESCE(dp.vehicle_rental_fee, 0)::numeric)::numeric,
      2
    ),
    vehicle_rental_fee = 0,
    updated_at = NOW()
  WHERE dp.organization_id = p_org_id
    AND dp.payment_status NOT IN ('paid', 'approved')
    AND dp.id NOT IN (
      SELECT ranked.id
      FROM (
        SELECT
          dp2.id,
          ROW_NUMBER() OVER (
            PARTITION BY dp2.driver_id, dp2.payment_period_start, dp2.payment_period_end
            ORDER BY
              CASE dp2.platform
                WHEN 'glovo' THEN 1
                WHEN 'uber' THEN 2
                WHEN 'bolt_taxi' THEN 3
                WHEN 'bolt' THEN 4
                ELSE 5
              END,
              dp2.id
          ) AS rn
        FROM driver_payouts dp2
        WHERE dp2.organization_id = p_org_id
          AND dp2.payment_status NOT IN ('paid', 'approved')
      ) ranked
      WHERE ranked.rn = 1
    )
    AND COALESCE(dp.vehicle_rental_fee, 0) <> 0;

  -- Drop weekly/overdue rent line items from non-anchor open payouts
  DELETE FROM payout_rent_entries pre
  USING driver_payouts dp
  WHERE pre.driver_payout_id = dp.id
    AND dp.organization_id = p_org_id
    AND dp.payment_status NOT IN ('paid', 'approved')
    AND pre.entry_type IN ('current_week', 'overdue')
    AND dp.id NOT IN (
      SELECT ranked.id
      FROM (
        SELECT
          dp2.id,
          ROW_NUMBER() OVER (
            PARTITION BY dp2.driver_id, dp2.payment_period_start, dp2.payment_period_end
            ORDER BY
              CASE dp2.platform
                WHEN 'glovo' THEN 1
                WHEN 'uber' THEN 2
                WHEN 'bolt_taxi' THEN 3
                WHEN 'bolt' THEN 4
                ELSE 5
              END,
              dp2.id
          ) AS rn
        FROM driver_payouts dp2
        WHERE dp2.organization_id = p_org_id
          AND dp2.payment_status NOT IN ('paid', 'approved')
      ) ranked
      WHERE ranked.rn = 1
    );

  RETURN n;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_driver_payout_vehicle_fees(UUID) IS
  'Refresh vehicle_rental_fee once per driver/week on fee-anchor platform (glovo→uber→bolt_taxi→bolt); clear rent on sibling legs without wiping other raw_net fees.';

-- Org-wide backfill for currently open payouts
SELECT refresh_driver_payout_vehicle_fees(o.id)
FROM organizations o;
