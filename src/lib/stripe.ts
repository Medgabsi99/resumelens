import Stripe from "stripe";

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Plan limits
export const PLAN_LIMITS = {
  free: 999, // Set to 999 for active development and testing phase
  one_time: 999, // effectively unlimited (one-time payment)
  monthly: 999, // unlimited on subscription
} as const;

export const PRICES = {
  one_time: {
    id: process.env.STRIPE_PRICE_ID_ONE_TIME!,
    label: "Lifetime Access",
    amount: 900, // $9.00 in cents
    mode: "payment" as const,
  },
  monthly: {
    id: process.env.STRIPE_PRICE_ID_MONTHLY!,
    label: "Pro Monthly",
    amount: 1900, // $19.00 in cents
    mode: "subscription" as const,
  },
};
