-- One-time cleanup: remove any remaining recurring rows in driver_payout_adjustments
-- (recurring fees now live in driver_weekly_fees; applied on anchor payout only).

DELETE FROM driver_payout_adjustments WHERE source = 'recurring';
