export type RentalCustomerType = "company" | "individual";
export type RentalType = "daily" | "weekly" | "monthly";
export type BookingStatus = "draft" | "confirmed" | "active" | "completed" | "cancelled";
export type PaymentType = "rent" | "deposit" | "deposit_refund" | "extra" | "damage";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PricingSnapshot = {
  daily_rate: number;
  weekly_rate: number;
  monthly_rate: number;
  deposit_default: number;
  rental_type: RentalType;
  days: number;
};
