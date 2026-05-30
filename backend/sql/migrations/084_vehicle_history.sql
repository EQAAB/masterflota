-- Unified vehicle audit trail (assignments, status, rent, maintenance, incidents, payroll rent).

BEGIN;

CREATE TABLE IF NOT EXISTS vehicle_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN (
            'assigned',
            'unassigned',
            'status_change',
            'maintenance',
            'incident',
            'rent_changed',
            'rent_collected'
        )
    ),
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    previous_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    previous_rent NUMERIC(12, 2),
    new_rent NUMERIC(12, 2),
    title VARCHAR(255),
    description TEXT,
    cost NUMERIC(12, 2),
    odometer_reading INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_vehicle_date
    ON vehicle_history (vehicle_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_org_date
    ON vehicle_history (organization_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_driver
    ON vehicle_history (driver_id)
    WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_history_event_type
    ON vehicle_history (vehicle_id, event_type);

COMMIT;
