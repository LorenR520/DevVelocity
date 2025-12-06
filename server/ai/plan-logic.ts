/**
 * DevVelocity — Plan Logic Loader
 * ---------------------------------------------------------
 * Central source of truth for:
 *  ✓ plan limits
 *  ✓ pricing
 *  ✓ AI allowances
 *  ✓ upgrade ladder
 *
 * All values dynamically load from marketing/pricing.json
 */

import marketing from "@/marketing/pricing.json";

export interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  limits: {
    build_minutes: number | string;
    pipelines: number | string;
    api_calls: number | string;
  };
  metered: {
    build_minute_price: number | string;
    pipeline_price: number | string;
    api_call_price: number | string;
  };
  automation: Record<string, any>;
}

/**
 * Return a plan by ID.
 */
export function getPlan(planId: string): PlanDefinition | null {
  const plans = marketing.plans as PlanDefinition[];
  return plans.find((p) => p.id === planId) ?? null;
}

/**
 * Return the upgrade path for a tier.
 */
export function nextPlan(planId: string): string | null {
  const order = ["developer", "startup", "team", "enterprise"];

  const index = order.indexOf(planId);
  if (index === -1 || index === order.length - 1) return null;

  return order[index + 1];
}

/**
 * Check whether a request exceeds plan capabilities.
 */
export function requiresUpgrade({
  planId,
  requiredProviders,
}: {
  planId: string;
  requiredProviders: number;
}) {
  const plan = getPlan(planId);
  if (!plan) return { upgrade: true, message: "Invalid plan." };

  // Developer plan has numeric provider limit
  if (plan.providers !== "unlimited" && requiredProviders > plan.providers) {
    const next = nextPlan(planId);
    return {
      upgrade: true,
      message: `Your plan supports ${plan.providers} providers. This action requires ${requiredProviders}.`,
      suggestedPlan: next,
    };
  }

  return { upgrade: false };
}
