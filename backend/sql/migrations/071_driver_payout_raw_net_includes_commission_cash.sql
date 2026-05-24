-- raw_net_amount debt baseline: Net − commission − |daily cash| − |account opening| − rent
-- (matches earnings rollup / Bolt Payout formula before debt carry-forward).

CREATE OR REPLACE FUNCTION refresh_driver_payout_vehicle_fees(p_org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  n INT;
BEGIN
  UPDATE driver_payouts dp
  SET
    vehicle_rental_fee = rf.calc,
    raw_net_amount = ROUND(
      (
        COALESCE(dp.total_net_earnings, 0)::numeric
        - COALESCE(dp.company_commission, 0)::numeric
        - ABS(COALESCE(dp.total_daily_cash, 0)::numeric)
        - ABS(COALESCE(dp.account_opening_fee, 0)::numeric)
        - rf.calc
      )::numeric,
      2
    )
  FROM (
    SELECT
      id,
      calculate_rental_fee(organization_id, driver_id, payment_period_start, payment_period_end)::numeric AS calc
    FROM driver_payouts
    WHERE organization_id = p_org_id
      AND payment_status NOT IN ('paid', 'approved')
  ) rf
  WHERE dp.id = rf.id;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_driver_payout_vehicle_fees(UUID) IS
  'Refresh vehicle_rental_fee and raw_net_amount (net − commission − |cash| − |opening| − rent) for open payouts.';

-- Backfill raw_net on open payouts using stored commission/cash/rent (no paid/approved rows).
UPDATE driver_payouts dp
SET raw_net_amount = ROUND(
  (
    COALESCE(dp.total_net_earnings, 0)::numeric
    - COALESCE(dp.company_commission, 0)::numeric
    - ABS(COALESCE(dp.total_daily_cash, 0)::numeric)
    - ABS(COALESCE(dp.account_opening_fee, 0)::numeric)
    - COALESCE(dp.vehicle_rental_fee, 0)::numeric
  )::numeric,
  2
)
WHERE dp.payment_status NOT IN ('paid', 'approved');
