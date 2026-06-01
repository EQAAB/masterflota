SELECT 'rental_customers exists' AS check_name
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_customers');

SELECT 'rental_bookings exists' AS check_name
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_bookings');

SELECT 'vehicle_availability exists' AS check_name
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_availability');

SELECT 'rental_pricing exists' AS check_name
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_pricing');

SELECT 'rental_payments exists' AS check_name
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_payments');

SELECT 'vehicle_history rental events' AS check_name
WHERE EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'vehicle_history'
      AND c.conname = 'vehicle_history_event_type_check'
);
