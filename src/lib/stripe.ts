// Stripe integration removed - all features are free and accessible.
export const PLAN_LIMITS = {
  free: 999999,
  one_time: 999999,
  monthly: 999999,
} as const;

export const PRICES = {
  one_time: {
    id: "price_free_lifetime",
    label: "Free Access",
    amount: 0,
    mode: "payment" as const,
  },
  monthly: {
    id: "price_free_monthly",
    label: "Free Pro Access",
    amount: 0,
    mode: "subscription" as const,
  },
};
