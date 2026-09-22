-- Release platform courier IDs held by soft-deleted or terminated drivers so
-- another active driver in the same org (or a transfer to another fleet's org)
-- can use them without stale earnings matching.

BEGIN;

UPDATE drivers
SET
    uber_driver_id = NULL,
    bolt_driver_id = NULL,
    glovo_courier_id = NULL,
    bolt_courier_id = NULL,
    bolt_taxi_driver_uuid = NULL,
    wolt_courier_id = NULL,
    updated_at = NOW()
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
    );

COMMIT;
