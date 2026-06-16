-- Backfill fleet status for vehicles with confirmed/active rentals still marked available.
UPDATE vehicles v
SET status = 'rented', updated_at = NOW()
WHERE v.status = 'available'
  AND v.current_driver_id IS NULL
  AND EXISTS (
    SELECT 1 FROM rental_bookings b
    WHERE b.vehicle_id = v.id
      AND b.organization_id = v.organization_id
      AND b.status IN ('confirmed', 'active')
  );
