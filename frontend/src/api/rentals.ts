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
  license_plate?: string;
  make?: string;
  model?: string;
  payments?: RentalPayment[];
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
  license_plate?: string;
  make?: string;
  model?: string;
};

export type RentalDashboard = {
  active_bookings: number;
  confirmed_bookings: number;
  active_customers: number;
  overdue_bookings: number;
  mtd_revenue: string;
};

export function getRentalDashboard() {
  return api.get<RentalDashboard>("/rentals/dashboard");
}

export function getRentalCustomers(params?: { q?: string; active?: boolean }) {
  return api.get<RentalCustomer[]>("/rentals/customers", { params });
}

export function getRentalCustomer(id: string) {
  return api.get<RentalCustomer>(`/rentals/customers/${id}`);
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
  return api.post<{
    subtotal: number;
    deposit: number;
    total: number;
    available: boolean;
    conflict: { message: string } | null;
  }>("/rentals/bookings/quote", body);
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

export function getRentalAvailability(params: { from: string; to: string; vehicleId?: string }) {
  return api.get<{
    vehicles: Array<{ id: string; license_plate: string; make: string; model: string; status: string }>;
    bookings: RentalBooking[];
    availability: Array<{ vehicle_id: string; avail_date: string; is_available: boolean }>;
  }>("/rentals/availability", { params });
}

export function getRentalPricing(params?: { vehicleId?: string }) {
  return api.get<RentalPricing[]>("/rentals/pricing", { params });
}

export function createRentalPricing(body: Record<string, unknown>) {
  return api.post<RentalPricing>("/rentals/pricing", body);
}

export function updateRentalPricing(id: string, body: Record<string, unknown>) {
  return api.put<RentalPricing>(`/rentals/pricing/${id}`, body);
}

export function getRentalPayments(params?: { status?: string }) {
  return api.get<Array<RentalPayment & { booking_number: string; customer_name: string }>>(
    "/rentals/payments",
    { params },
  );
}

export function createRentalPayment(bookingId: string, body: Record<string, unknown>) {
  return api.post<RentalPayment>(`/rentals/payments/booking/${bookingId}`, body);
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
