import type { ConsolidatedDriverPayout, PayoutAssignmentDetail, PayoutListItem } from "../../../api/earnings";

const DRIVER_ID = "35b9fe29-0000-4000-8000-000000000001";
const DRIVER_FIRST = "Muhammad";
const DRIVER_LAST = "Waqas Abbas";
const DRIVER_PHONE = "+407934680829";
const PERIOD_START = "2026-05-18";
const PERIOD_END = "2026-05-24";
const PAYMENT_ID = "46e580a1-48d3-4606-b558-afa63e4db8c2";
const BOLT_PAYOUT_ID = "46e580a1-48d3-4606-b558-afa63e4db8c2";
const UBER_PAYOUT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function basePayoutFields(id: string, platform: string): Partial<PayoutListItem> {
  return {
    id,
    driver_id: DRIVER_ID,
    platform_id: null,
    earnings_platform: platform,
    payment_period_start: PERIOD_START,
    payment_period_end: PERIOD_END,
    period_start_label: PERIOD_START,
    period_end_label: PERIOD_END,
    debt_amount: "0",
    debt_applied_amount: "0",
    payment_date: null,
    account_opening_fee: "0",
    commission_rate: "0.12",
    commission_base_type: "net_income",
    first_name: DRIVER_FIRST,
    last_name: DRIVER_LAST,
    phone: DRIVER_PHONE,
  };
}

/** Layout A — single Bolt platform, +1.405,24 RON payable. */
export const mockSinglePlatformRow: ConsolidatedDriverPayout = {
  driver_id: DRIVER_ID,
  first_name: DRIVER_FIRST,
  last_name: DRIVER_LAST,
  phone: DRIVER_PHONE,
  payment_period_start: PERIOD_START,
  payment_period_end: PERIOD_END,
  total_amount: "1405.24",
  total_gross: "5589.50",
  total_fees: "506.31",
  total_platform_fees: "0",
  total_vehicle_rent: "550",
  total_debt_offset: "0",
  debt_platforms: [],
  platforms: ["bolt_taxi"],
  platform_payout_ids: [BOLT_PAYOUT_ID],
  platform_lines: [],
  consolidated_status: "payable",
  can_pay: true,
  driver_payment_id: PAYMENT_ID,
  paid_at: null,
};

export const mockSinglePlatformPayoutItems: PayoutListItem[] = [
  {
    ...basePayoutFields(BOLT_PAYOUT_ID, "bolt_taxi"),
    income: "5589.50",
    tips: "0",
    total_gross_earnings: "5589.50",
    total_platform_fees: "0",
    gross_income: "5589.50",
    net_income: "4219.25",
    company_commission: "506.31",
    commission_base: "4219.25",
    total_daily_cash: "-1507.70",
    net_driver_payout: "1405.24",
    raw_net_amount: "1405.24",
    remaining_debt_amount: "0",
    vehicle_rental_fee: "550",
    payment_status: "payable",
  } as PayoutListItem,
];

export const mockSinglePlatformDetails = new Map<string, PayoutAssignmentDetail>([
  [
    BOLT_PAYOUT_ID,
    {
      payout_id: BOLT_PAYOUT_ID,
      driver_id: DRIVER_ID,
      vehicle_rental_fee: "550",
      remaining_debt_amount: "0",
      has_vehicle_assigned: true,
      license_plate: "B192PAK",
      weekly_rent: "550",
    },
  ],
]);

/** Layout B — Uber + Bolt, −86,27 RON debt (cross-platform offset). */
export const mockMultiPlatformRow: ConsolidatedDriverPayout = {
  driver_id: DRIVER_ID,
  first_name: DRIVER_FIRST,
  last_name: DRIVER_LAST,
  phone: DRIVER_PHONE,
  payment_period_start: PERIOD_START,
  payment_period_end: PERIOD_END,
  total_amount: "-86.27",
  total_gross: "870.81",
  total_fees: "78.60",
  total_platform_fees: "28.52",
  total_vehicle_rent: "0",
  total_debt_offset: "60.84",
  debt_platforms: ["uber"],
  platforms: ["uber", "bolt_taxi"],
  platform_payout_ids: [UBER_PAYOUT_ID, BOLT_PAYOUT_ID],
  platform_lines: [],
  consolidated_status: "debt",
  can_pay: false,
  driver_payment_id: PAYMENT_ID,
  paid_at: null,
};

export const mockMultiPlatformPayoutItems: PayoutListItem[] = [
  {
    ...basePayoutFields(UBER_PAYOUT_ID, "uber"),
    income: "121.51",
    tips: "0",
    total_gross_earnings: "121.51",
    total_platform_fees: "28.52",
    gross_income: "121.51",
    net_income: "92.99",
    company_commission: "11.16",
    commission_base: "92.99",
    total_daily_cash: "-28.94",
    net_driver_payout: "-86.27",
    raw_net_amount: "-147.11",
    remaining_debt_amount: "147.11",
    vehicle_rental_fee: "0",
    payment_status: "debt",
  } as PayoutListItem,
  {
    ...basePayoutFields(BOLT_PAYOUT_ID, "bolt_taxi"),
    income: "749.30",
    tips: "0",
    total_gross_earnings: "749.30",
    total_platform_fees: "0",
    gross_income: "749.30",
    net_income: "561.98",
    company_commission: "67.44",
    commission_base: "561.98",
    total_daily_cash: "-433.70",
    net_driver_payout: "0",
    raw_net_amount: "60.84",
    remaining_debt_amount: "0",
    vehicle_rental_fee: "0",
    payment_status: "debt",
  } as PayoutListItem,
];

export const mockMultiPlatformDetails = new Map<string, PayoutAssignmentDetail>([
  [
    UBER_PAYOUT_ID,
    {
      payout_id: UBER_PAYOUT_ID,
      driver_id: DRIVER_ID,
      vehicle_rental_fee: null,
      remaining_debt_amount: "147.11",
      has_vehicle_assigned: false,
      license_plate: null,
      weekly_rent: null,
    },
  ],
  [
    BOLT_PAYOUT_ID,
    {
      payout_id: BOLT_PAYOUT_ID,
      driver_id: DRIVER_ID,
      vehicle_rental_fee: null,
      remaining_debt_amount: "0",
      has_vehicle_assigned: false,
      license_plate: null,
      weekly_rent: null,
    },
  ],
]);

export type PayoutDetailsMockScenario = {
  id: "single" | "multi";
  label: string;
  subtitle: string;
  row: ConsolidatedDriverPayout;
  payoutItems: PayoutListItem[];
  detailsById: Map<string, PayoutAssignmentDetail>;
};

export const payoutDetailsMockScenarios: PayoutDetailsMockScenario[] = [
  {
    id: "single",
    label: "A. Single Platform (One Platform Only)",
    subtitle: "When only one platform is available, the platform card expands full width.",
    row: mockSinglePlatformRow,
    payoutItems: mockSinglePlatformPayoutItems,
    detailsById: mockSinglePlatformDetails,
  },
  {
    id: "multi",
    label: "B. Multiple Platforms (Two or More)",
    subtitle: "When multiple platforms exist, cards are shown side by side.",
    row: mockMultiPlatformRow,
    payoutItems: mockMultiPlatformPayoutItems,
    detailsById: mockMultiPlatformDetails,
  },
];

export const mockDriverName = `${DRIVER_FIRST} ${DRIVER_LAST}`;
