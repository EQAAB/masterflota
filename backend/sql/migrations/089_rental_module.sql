-- External vehicle rental module (B2B/B2C) — separate from driver assignment payroll rent.

BEGIN;

-- Extend vehicle_history for rental lifecycle events
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
        'rental_cancelled'
    )
);

CREATE TABLE IF NOT EXISTS rental_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_type VARCHAR(20) NOT NULL DEFAULT 'individual'
        CHECK (customer_type IN ('company', 'individual')),
    legal_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(30),
    tax_id VARCHAR(100),
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_customers_org ON rental_customers(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rental_customers_org_email
    ON rental_customers(organization_id, lower(email))
    WHERE email IS NOT NULL AND trim(email) <> '';

CREATE TABLE IF NOT EXISTS rental_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    booking_number VARCHAR(32) NOT NULL,
    customer_id UUID NOT NULL REFERENCES rental_customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    rental_type VARCHAR(20) NOT NULL DEFAULT 'daily'
        CHECK (rental_type IN ('daily', 'weekly', 'monthly')),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    actual_pickup_at TIMESTAMPTZ,
    actual_return_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'confirmed', 'active', 'completed', 'cancelled')),
    pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'RON',
    mileage_out INTEGER,
    mileage_in INTEGER,
    damage_notes TEXT,
    damage_reported BOOLEAN NOT NULL DEFAULT false,
    contract_document_id UUID REFERENCES vehicle_documents(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rental_bookings_dates_chk CHECK (end_at > start_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rental_bookings_org_number
    ON rental_bookings(organization_id, booking_number);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_org_status ON rental_bookings(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_vehicle_dates ON rental_bookings(vehicle_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_customer ON rental_bookings(customer_id);

CREATE TABLE IF NOT EXISTS vehicle_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    avail_date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    blocking_booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT vehicle_availability_unique UNIQUE (organization_id, vehicle_id, avail_date)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_availability_vehicle_date
    ON vehicle_availability(vehicle_id, avail_date);

CREATE TABLE IF NOT EXISTS rental_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50),
    daily_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    weekly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    monthly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deposit_default NUMERIC(12, 2) NOT NULL DEFAULT 0,
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_pricing_org ON rental_pricing(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rental_pricing_vehicle ON rental_pricing(vehicle_id) WHERE vehicle_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS rental_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
    payment_type VARCHAR(30) NOT NULL DEFAULT 'rent'
        CHECK (payment_type IN ('rent', 'deposit', 'deposit_refund', 'extra', 'damage')),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'RON',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    paid_at TIMESTAMPTZ,
    method VARCHAR(50),
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_payments_booking ON rental_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_org_status ON rental_payments(organization_id, status);

-- Seed default pricing from vehicle list rates where set
INSERT INTO rental_pricing (
    organization_id, vehicle_id, vehicle_type,
    daily_rate, weekly_rate, monthly_rate, deposit_default, is_active
)
SELECT
    v.organization_id,
    v.id,
    v.vehicle_type,
    COALESCE(v.daily_rent, 0),
    COALESCE(v.weekly_rent, 0),
    COALESCE(v.monthly_rent, 0),
    0,
    true
FROM vehicles v
WHERE v.organization_id IS NOT NULL
  AND (COALESCE(v.daily_rent, 0) > 0 OR COALESCE(v.weekly_rent, 0) > 0 OR COALESCE(v.monthly_rent, 0) > 0)
  AND NOT EXISTS (
      SELECT 1 FROM rental_pricing rp
      WHERE rp.organization_id = v.organization_id AND rp.vehicle_id = v.id
  );

COMMIT;
