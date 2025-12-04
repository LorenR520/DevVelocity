// lib/billing.ts

import pricing from "../marketing/pricing.json";
import { getPlan } from "./pricing";

export interface BillingPlan {
  id: string;
  lemonVariantId: number | null;
  stripePriceId: string | null;
}

// MAP YOUR REAL PRICE IDs HERE
export const BILLING_MAP: Record<string, BillingPlan> = {
  developer: {
    id: "developer",
    lemonVariantId: 12345,        // your Lemon variant ID
    stripePriceId: "price_123",   // your Stripe Price ID
  },
  startup: {
    id: "startup",
    lemonVariantId: 12346,
    stripePriceId: "price_456",
  },
  team: {
    id: "team",
    lemonVariantId: 12347,
    stripePriceId: "price_789",
  },
  enterprise: {
    id: "enterprise",
    lemonVariantId: null,
    stripePriceId: null,
  },
};

// Build checkout URL for Lemon
export function getLemonCheckoutUrl(planId: string) {
  const plan = BILLING_MAP[planId];
  if (!plan?.lemonVariantId) return null;

  return `https://checkout.lemonsqueezy.com/buy/${plan.lemonVariantId}`;
}

// Stripe checkout doesn’t use static URLs — we create sessions
export function hasStripePlan(planId: string) {
  return !!BILLING_MAP[planId]?.stripePriceId;
}

// Final fallback resolver
export function resolveCheckoutProvider(planId: string) {
  const lemon = getLemonCheckoutUrl(planId);
  const stripe = BILLING_MAP[planId]?.stripePriceId;

  if (lemon) return { provider: "lemon", url: lemon };
  if (stripe) return { provider: "stripe", url: null };

  return { provider: "none", url: null };
}
