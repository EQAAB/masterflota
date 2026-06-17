export const RENT_PAYMENT_STATE_SQL = `(SELECT CASE
  WHEN COALESCE(SUM(CASE WHEN p.payment_type = 'rent' AND p.status = 'paid' THEN p.amount ELSE 0 END), 0)
       >= b.total_amount THEN 'paid'
  WHEN COALESCE(SUM(CASE WHEN p.payment_type = 'rent' AND p.status = 'paid' THEN p.amount ELSE 0 END), 0) > 0
       THEN 'partial'
  ELSE 'unpaid'
END FROM rental_payments p WHERE p.booking_id = b.id)`;

export const DUE_THIS_WEEK_BOOKING_SELECT = `
  SELECT b.*,
         c.legal_name AS customer_name,
         c.phone AS customer_phone,
         v.license_plate,
         v.make,
         v.model,
         ${RENT_PAYMENT_STATE_SQL} AS rent_payment_state
  FROM rental_bookings b
  JOIN rental_customers c ON c.id = b.customer_id
  JOIN vehicles v ON v.id = b.vehicle_id
  WHERE b.organization_id = $1::uuid
    AND b.rental_type = 'weekly'
    AND b.status IN ('active', 'confirmed')
    AND b.end_at <= NOW() + interval '7 days'
  ORDER BY (b.end_at < NOW()) DESC, b.end_at ASC`;
