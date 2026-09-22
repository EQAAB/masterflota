-- Verify migration 105: terminated/soft-deleted drivers have no platform IDs.
SELECT 'no platform ids on terminated or deleted drivers' AS check_name
WHERE NOT EXISTS (
    SELECT 1
    FROM drivers
    WHERE (
            is_deleted = true
            OR employment_status = 'terminated'
        )
      AND (
            uber_driver_id IS NOT NULL
            OR bolt_driver_id IS NOT NULL
            OR glovo_courier_id IS NOT NULL
            OR bolt_courier_id IS NOT NULL
            OR bolt_taxi_driver_uuid IS NOT NULL
            OR wolt_courier_id IS NOT NULL
        )
);
