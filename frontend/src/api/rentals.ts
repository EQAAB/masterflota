import { api } from "../lib/api";

export type RentalCustomer = {
  id: string;
  organization_id: string;
  customer_type: "company" | "individual";
  legal_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  address: Record<string, unknown>;
  notes: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  active_bookings?: number;
  completed_rentals?: number;
  total_bookings?: number;
  lifetime_revenue?: string | number;
};

export type RentalCustomersSummary = {
  total_customers: number;
  active_rentals: number;
  returning_customers: number;
  lifetime_revenue: string | number;
  customers_added_this_month: number;
};

export type RentalBooking = {
  id: string;
  booking_number: string;
  customer_id: string;
  vehicle_id: string;
  rental_type: "daily" | "weekly" | "monthly";
  start_at: string;
  end_at: string;
  actual_pickup_at: string | null;
  actual_return_at: string | null;
  status: "draft" | "confirmed" | "active" | "completed" | "cancelled";
  subtotal: string;
  deposit_amount: string;
  total_amount: string;
  currency: string;
  mileage_out: number | null;
  mileage_in: number | null;
  damage_notes: string | null;
  damage_reported: boolean;
  customer_name?: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  created_at?: string;
  rent_payment_state?: "paid" | "partial" | "unpaid";
  license_plate?: string;
  make?: string;
  model?: string;
  payments?: RentalPayment[];
  pricing_snapshot?: Record<string, unknown>;
};

export type RentalBookingFormMeta = {
  pickupLocation?: string;
  returnLocation?: string;
  driverNotes?: string;
  internalNotes?: string;
  extras?: string[];
  discountAmount?: number;
};

export type RentalQuote = {
  subtotal: number;
  deposit: number;
  total: number;
  available: boolean;
  conflict: { message: string } | null;
  days: number;
  rates: { daily: number; weekly: number; monthly: number };
  currency: string;
};

export type RentalPayment = {
  id: string;
  booking_id: string;
  payment_type: string;
  amount: string;
  currency: string;
  status: string;
  paid_at: string | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
  created_at?: string;
};

export type RentalPaymentListItem = RentalPayment & {
  booking_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_id?: string;
  start_at?: string;
  end_at?: string;
  booking_total?: string | number;
  license_plate?: string;
  make?: string;
  model?: string;
  booking_payment_state?: "paid" | "partial" | "unpaid";
};

export type RentalPaymentsSummary = {
  total_revenue: number;
  paid_count: number;
  pending_count: number;
  mtd_revenue: number;
  revenue_trend_pct: number | null;
};

export type RentalPaymentsActivityItem = {
  id: string;
  kind: string;
  label: string;
  amount: string | number;
  currency: string;
  status: string;
  booking_number: string;
  customer_name: string;
  created_at: string;
};

export type RentalPricing = {
  id: string;
  vehicle_id: string | null;
  vehicle_type: string | null;
  daily_rate: string;
  weekly_rate: string;
  monthly_rate: string;
  deposit_default: string;
  is_active: boolean;
  effective_from?: string | null;
  effective_to?: string | null;
  license_plate?: string;
  make?: string;
  model?: string;
  vehicle_status?: string;
  vehicle_type_name?: string;
  transmission?: string | null;
};

export type RentalPricingSummary = {
  avg_daily_rate: number;
  avg_weekly_rate: number;
  monthly_revenue_estimate: number;
  vehicles_with_custom_pricing: number;
  pricing_rules_active: number;
  daily_rate_trend_pct: number | null;
};

export type RentalPricingInsights = {
  most_rented_vehicle: {
    license_plate: string;
    make: string;
    model: string;
    booking_count: number;
  } | null;
  highest_earning_vehicle: {
    license_plate: string;
    revenue: string | number;
  } | null;
  best_utilization_pct: number;
  revenue_forecast: number;
};

export type RentalDashboardTrends = {
  active_week_delta: number;
  confirmed_week_delta: number;
  customers_month_delta: number;
  revenue_mom_pct: number | null;
};

export type RentalDashboardFleet = {
  available: number;
  rented: number;
  maintenance: number;
  total: number;
};

export type RentalDashboardBookingRow = {
  id: string;
  booking_number: string;
  status: string;
  start_at: string;
  end_at: string;
  total_amount: string;
  currency: string;
  customer_name: string;
  license_plate: string;
  make?: string;
  model?: string;
};

export type RentalDashboardCustomerRow = {
  id: string;
  legal_name: string;
  customer_type: string;
  booking_count: number;
  has_active_booking: boolean;
};

export type RentalDashboardPaymentRow = {
  id: string;
  booking_id: string;
  booking_number: string;
  customer_name: string;
  amount: string;
  currency: string;
  status: string;
  payment_type: string;
  due_at: string | null;
};

export type RentalDashboard = {
  active_bookings: number;
  confirmed_bookings: number;
  active_customers: number;
  overdue_bookings: number;
  mtd_revenue: string | number;
  trends?: RentalDashboardTrends;
  weekly_revenue?: { label: string; amount: number }[];
  fleet?: RentalDashboardFleet;
  recent_bookings?: RentalDashboardBookingRow[];
  recent_customers?: RentalDashboardCustomerRow[];
  upcoming_payments?: RentalDashboardPaymentRow[];
  due_this_week?: RentalDueThisWeekRow[];
  calendar_days?: string[];
};

export type RentalDueThisWeekRow = RentalBooking & {
  customer_name?: string;
  license_plate?: string;
  make?: string;
  model?: string;
  rent_payment_state?: "paid" | "partial" | "unpaid";
};

export type QuickWeeklyRentalBody = {
  customerId: string;
  vehicleId: string;
  startAt?: string;
  endAt?: string;
  paymentAmount?: number;
  recordPayment?: boolean;
  mileageOut?: number;
  skipPickup?: boolean;
};

export type RenewWeeklyBookingBody = {
  paymentAmount?: number;
  recordPayment?: boolean;
};

export function getRentalDashboard() {
  return api.get<RentalDashboard>("/rentals/dashboard");
}

export function getRentalCustomers(params?: {
  q?: string;
  active?: boolean;
  customerType?: "company" | "individual";
  hasActiveRental?: boolean;
  sort?: "name" | "revenue" | "bookings" | "created";
}) {
  return api.get<RentalCustomer[]>("/rentals/customers", { params });
}

export function getRentalCustomersSummary() {
  return api.get<RentalCustomersSummary>("/rentals/customers/summary");
}

export function getRentalCustomer(id: string) {
  return api.get<RentalCustomer>(`/rentals/customers/${id}`);
}

export function deleteRentalCustomer(id: string) {
  return api.delete(`/rentals/customers/${id}`);
}

export function createRentalCustomer(body: Record<string, unknown>) {
  return api.post<RentalCustomer>("/rentals/customers", body);
}

export function updateRentalCustomer(id: string, body: Record<string, unknown>) {
  return api.put<RentalCustomer>(`/rentals/customers/${id}`, body);
}

export function getRentalBookings(params?: {
  status?: string;
  vehicleId?: string;
  customerId?: string;
  from?: string;
  to?: string;
  q?: string;
}) {
  return api.get<RentalBooking[]>("/rentals/bookings", { params });
}

export function getRentalBooking(id: string) {
  return api.get<RentalBooking>(`/rentals/bookings/${id}`);
}

export function quoteRental(body: {
  vehicleId: string;
  rentalType: string;
  startAt: string;
  endAt: string;
}) {
  return api.post<RentalQuote>("/rentals/bookings/quote", body);
}

export function createRentalBooking(body: Record<string, unknown>) {
  return api.post<RentalBooking>("/rentals/bookings", body);
}

export function updateRentalBooking(id: string, body: Record<string, unknown>) {
  return api.put<RentalBooking>(`/rentals/bookings/${id}`, body);
}

export function confirmRentalBooking(id: string) {
  return api.post<RentalBooking>(`/rentals/bookings/${id}/confirm`);
}

export function cancelRentalBooking(id: string, reason?: string) {
  return api.post<RentalBooking>(`/rentals/bookings/${id}/cancel`, { reason });
}

export function pickupRentalBooking(id: string, mileageOut?: number) {
  return api.post<RentalBooking>(`/rentals/bookings/${id}/pickup`, { mileageOut });
}

export function returnRentalBooking(
  id: string,
  body: { mileageIn?: number; damageNotes?: string; damageReported?: boolean },
) {
  return api.post<RentalBooking>(`/rentals/bookings/${id}/return`, body);
}

export function quickWeeklyRental(body: QuickWeeklyRentalBody) {
  return api.post<RentalBooking>("/rentals/bookings/quick-weekly", body);
}

export function renewWeeklyBooking(id: string, body: RenewWeeklyBookingBody = {}) {
  return api.post<RentalBooking>(`/rentals/bookings/${id}/renew-week`, body);
}

export function getRentalsDueThisWeek() {
  return api.get<RentalDueThisWeekRow[]>("/rentals/reports/due-this-week");
}

export type RentalAvailabilityVehicle = {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  status: string;
  vehicle_type: string;
  transmission: string | null;
  fuel_type: string | null;
  driver_assigned?: boolean;
};

export type RentalAvailabilityBlock = {
  id: string;
  vehicle_id: string;
  avail_date: string;
  is_available: boolean;
  blocking_booking_id: string | null;
  notes: string | null;
};

export type RentalAvailabilityBooking = RentalBooking & {
  customer_id?: string;
};

export type RentalAvailabilitySummary = {
  available_vehicles: number;
  currently_rented: number;
  upcoming_bookings: number;
  blocked_days: number;
};

export type RentalAvailabilityPayload = {
  vehicles: RentalAvailabilityVehicle[];
  bookings: RentalAvailabilityBooking[];
  availability: RentalAvailabilityBlock[];
};

export function getRentalAvailability(params: {
  from: string;
  to: string;
  vehicleId?: string;
  customerId?: string;
  status?: string;
  q?: string;
  vehicleQ?: string;
}) {
  return api.get<RentalAvailabilityPayload>("/rentals/availability", { params });
}

export function getRentalAvailabilitySummary(params: { from: string; to: string }) {
  return api.get<RentalAvailabilitySummary>("/rentals/availability/summary", { params });
}

export function createAvailabilityBlock(body: {
  vehicleId: string;
  from: string;
  to: string;
  notes?: string;
}) {
  return api.post<{ vehicleId: string; from: string; to: string; daysBlocked: number }>(
    "/rentals/availability/blocks",
    body,
  );
}

export function clearAvailabilityBlocks(params: { vehicleId: string; from: string; to: string }) {
  return api.delete("/rentals/availability/blocks", { params });
}

export function getRentalPricing(params?: { vehicleId?: string; vehicleQ?: string }) {
  return api.get<RentalPricing[]>("/rentals/pricing", { params });
}

export function getRentalPricingSummary() {
  return api.get<RentalPricingSummary>("/rentals/pricing/summary");
}

export function getRentalPricingInsights() {
  return api.get<RentalPricingInsights>("/rentals/pricing/insights");
}

export function createRentalPricing(body: Record<string, unknown>) {
  return api.post<RentalPricing>("/rentals/pricing", body);
}

export function updateRentalPricing(id: string, body: Record<string, unknown>) {
  return api.put<RentalPricing>(`/rentals/pricing/${id}`, body);
}

export function getRentalPayments(params?: {
  status?: string;
  paymentType?: string;
  customerId?: string;
  from?: string;
  to?: string;
  q?: string;
}) {
  return api.get<RentalPaymentListItem[]>("/rentals/payments", { params });
}

export function getRentalPaymentsSummary() {
  return api.get<RentalPaymentsSummary>("/rentals/payments/summary");
}

export function getRentalPaymentsActivity() {
  return api.get<RentalPaymentsActivityItem[]>("/rentals/payments/activity");
}

export function createRentalPayment(bookingId: string, body: Record<string, unknown>) {
  return api.post<RentalPayment>(`/rentals/payments/booking/${bookingId}`, body);
}

export function updateRentalPayment(id: string, body: Record<string, unknown>) {
  return api.patch<RentalPayment>(`/rentals/payments/${id}`, body);
}

export function getRentalRevenue(params?: { from?: string; to?: string }) {
  return api.get("/rentals/reports/revenue", { params });
}

export function getOverdueRentals() {
  return api.get<RentalBooking[]>("/rentals/reports/overdue");
}

export async function downloadRentalContract(bookingId: string) {
  const res = await api.get(`/rentals/bookings/${bookingId}/contract`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contract-${bookingId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
