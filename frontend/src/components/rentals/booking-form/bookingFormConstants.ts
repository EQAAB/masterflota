/** Mon→Sun pay week: pickup Monday + 6 calendar days = return Sunday. */
export const WEEKLY_RENTAL_SPAN_DAYS = 6;

/** Extend an active weekly rental by one more Mon→Sun week. */
export const WEEKLY_RENTAL_RENEWAL_DAYS = 7;

export const EXTRA_SERVICES = [
  { id: "insurance", label: "Insurance", amount: 50 },
  { id: "gps", label: "GPS", amount: 25 },
  { id: "child_seat", label: "Child seat", amount: 15 },
  { id: "additional_driver", label: "Additional driver", amount: 40 },
  { id: "full_cleaning", label: "Full cleaning", amount: 35 },
] as const;

export type ExtraServiceId = (typeof EXTRA_SERVICES)[number]["id"];
