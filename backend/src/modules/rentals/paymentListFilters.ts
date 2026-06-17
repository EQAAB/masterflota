const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PaymentListFilterQuery = {
  status?: string;
  paymentType?: string;
  customerId?: string;
  from?: string;
  to?: string;
  q?: string;
};

export const PAYMENT_LIST_JOINS = `
  FROM rental_payments p
  JOIN rental_bookings b ON b.id = p.booking_id
  JOIN rental_customers c ON c.id = b.customer_id
  JOIN vehicles v ON v.id = b.vehicle_id`;

export function parsePaymentListFilters(query: Record<string, unknown>): PaymentListFilterQuery {
  return {
    status: typeof query.status === "string" ? query.status : undefined,
    paymentType: typeof query.paymentType === "string" ? query.paymentType : undefined,
    customerId: typeof query.customerId === "string" ? query.customerId : undefined,
    from: typeof query.from === "string" ? query.from : undefined,
    to: typeof query.to === "string" ? query.to : undefined,
    q: typeof query.q === "string" ? query.q.trim() : undefined,
  };
}

export function appendPaymentListFilters(
  baseSql: string,
  params: unknown[],
  filters: PaymentListFilterQuery,
): string {
  let sql = baseSql;
  let i = params.length + 1;

  if (filters.status) {
    sql += ` AND p.status = $${i}`;
    params.push(filters.status);
    i++;
  }
  if (filters.paymentType) {
    sql += ` AND p.payment_type = $${i}`;
    params.push(filters.paymentType);
    i++;
  }
  if (filters.customerId && UUID_RE.test(filters.customerId)) {
    sql += ` AND b.customer_id = $${i}::uuid`;
    params.push(filters.customerId);
    i++;
  }
  if (filters.from) {
    sql += ` AND COALESCE(p.paid_at, p.created_at) >= $${i}::timestamptz`;
    params.push(`${filters.from}T00:00:00.000Z`);
    i++;
  }
  if (filters.to) {
    sql += ` AND COALESCE(p.paid_at, p.created_at) <= $${i}::timestamptz`;
    params.push(`${filters.to}T23:59:59.999Z`);
    i++;
  }
  if (filters.q) {
    sql += ` AND (
        b.booking_number ILIKE '%' || $${i} || '%'
        OR c.legal_name ILIKE '%' || $${i} || '%'
        OR p.reference ILIKE '%' || $${i} || '%'
      )`;
    params.push(filters.q);
  }

  return sql;
}
