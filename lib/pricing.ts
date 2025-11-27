// lib/pricing.ts
import rawPricing from "../marketing/pricing.json";

export interface PricingPlan {
  id: string;
  name: string;
  price: number | string;
  providers: number | string;
  updates: string;
  builder: string;
  sso: string;
  badge?: string;
  cta?: string;
  href?: string;
}

// Automatically assign UI-specific properties per plan
function decoratePlan(plan: PricingPlan): PricingPlan {
  const decorated = { ...plan };

  // Auto-set CTA text
  decorated.cta = {
    developer: "Start Building",
    startup: "Upgrade to Startup",
    team: "Upgrade to Team",
    enterprise: "Contact Sales",
  }[plan.id] ?? "Select Plan";

  // Auto-set badge
  decorated.badge = {
    startup: "Most Popular",
    team: "Best Value",
  }[plan.id];

  // Auto-set price label for enterprise
  if (plan.id === "enterprise") {
    decorated.price = "Custom";
  }

  // Auto-set checkout or routing link
  decorated.href = {
    enterprise: "mailto:sales@devvelocity.app",
    developer: "/auth/signup",
    startup: "/dashboard/billing/upgrade?plan=startup",
    team: "/dashboard/billing/upgrade?plan=team",
  }[plan.id] ?? `/dashboard/billing/upgrade?plan=${plan.id}`;

  return decorated;
}

// Convert marketing/pricing.json → PricingPlan[]
export function getAllPlans(): PricingPlan[] {
  const converted = rawPricing.plans.map((plan: any) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    providers: plan.providers,
    updates: plan.updates,
    builder: plan.builder,
    sso: plan.sso,
  }));

  return converted.map(decoratePlan);
}

// Sorted list for UI rendering
export function getUiPlans(): PricingPlan[] {
  const order = ["developer", "startup", "team", "enterprise"];
  const plans = getAllPlans();

  return plans.sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  );
}

// Get a single plan by ID
export function getPlan(id: string): PricingPlan | null {
  const plan = getAllPlans().find((p) => p.id === id);
  return plan ?? null;
}
