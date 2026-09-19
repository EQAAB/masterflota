-- Verify migration 104: vehicle_history allows rental_renewed.
SELECT 'vehicle_history allows rental_renewed' AS check_name
WHERE EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'vehicle_history'
      AND c.conname = 'vehicle_history_event_type_check'
      AND pg_get_constraintdef(c.oid) LIKE '%rental_renewed%'
);
