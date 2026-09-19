-- Allow rental_renewed on vehicle_history (weekly booking renew writes this event).

BEGIN;

ALTER TABLE vehicle_history DROP CONSTRAINT IF EXISTS vehicle_history_event_type_check;
ALTER TABLE vehicle_history ADD CONSTRAINT vehicle_history_event_type_check CHECK (
    event_type IN (
        'assigned',
        'unassigned',
        'status_change',
        'maintenance',
        'incident',
        'rent_changed',
        'rent_collected',
        'rental_booked',
        'rental_pickup',
        'rental_return',
        'rental_cancelled',
        'rental_renewed'
    )
);

COMMIT;
