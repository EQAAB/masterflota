-- bolt_taxi_driver_uuid column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'drivers' AND column_name = 'bolt_taxi_driver_uuid';

-- platform_metadata on earnings_records
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'earnings_records' AND column_name = 'platform_metadata';

-- driver_payouts allows bolt_taxi
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'driver_payouts'::regclass AND conname = 'chk_driver_payouts_platform';
