// server/ai/credit-tracking.ts
/**
 * DevVelocity AI — Token + Cost Tracking Engine (GPT-5.1 Ready)
 * ------------------------------------------------------------------
 * Tracks:
 *   ✓ Input + output tokens
 *   ✓ Cost estimation (GPT-5.1)
 *   ✓ Monthly usage budget per tier
 *   ✓ Billing event insertion
 *   ✓ Upgrade recommendations
 *
 * This is the *only* supported and safe
 * production token-tracking system for DevVelocity.
 */

import { createClient } from "@supabase/supabase-js";

// --------------------------------------------
// GPT-5.1 Pricing (2025 Realistic)
// --------------------------------------------
const PRICE_PER_1K_INPUT = 0.0025;  // $0.0025 per 1,000 input tokens
const PRICE_PER_1K_OUTPUT = 0.008; // $0.008 per 1,000 output tokens

// --------------------------------------------
// Monthly Token Budgets per Paid Tier
// --------------------------------------------
// NOTE: Developer IS PAID — no free tiers
// --------------------------------------------
const PLAN_BUDGETS: Record<string, number> = {
  developer: 150000,   // 150k / month — paid tier, not free
  startup: 500000,     // 500k / month
  team: 2000000,       // 2M / month
  enterprise: Infinity // unlimited
};

export class AICreditTracking {
  /**
   * Record token usage, calculate cost, and determine if upgrade needed.
   */
  static async record({
    orgId,
    planId,
    inputTokens = 0,
    outputTokens = 0,
  }: {
    orgId: string;
    planId: string;
    inputTokens: number;
    outputTokens: number;
  }) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const totalTokens = (inputTokens || 0) + (outputTokens || 0);

    // --------------------------------------------
    // 1. Compute Cost Properly for GPT-5.1
    // --------------------------------------------
    const cost =
      (inputTokens / 1000) * PRICE_PER_1K_INPUT +
      (outputTokens / 1000) * PRICE_PER_1K_OUTPUT;

    // --------------------------------------------
    // 2. Insert Billing Event
    // --------------------------------------------
    await supabase.from("billing_events").insert({
      org_id: orgId,
      type: "ai_usage",
      amount: cost,
      details: {
        inputTokens,
        outputTokens,
        model: "gpt-5.1",
        plan: planId,
      },
    });

    // --------------------------------------------
    // 3. Fetch Current Month's Token Usage
    // --------------------------------------------
    const { data: tokenRows, error: usageErr } = await supabase
      .from("billing_events")
      .select("details")
      .eq("org_id", orgId)
      .eq("type", "ai_usage")
      .gte(
        "created_at",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      );

    if (usageErr) {
      console.error("Token aggregation error:", usageErr);
      return {
        allowed: true, // fail-open for resilience
        warning: "Could not verify monthly usage.",
      };
    }

    // --------------------------------------------
    // 4. Aggregate Tokens for Current Month
    // --------------------------------------------
    const monthlyTokens = tokenRows
      .map((row: any) => (row?.details?.inputTokens ?? 0) + (row?.details?.outputTokens ?? 0))
      .reduce((a: number, b: number) => a + b, 0);

    const monthlyBudget = PLAN_BUDGETS[planId] ?? PLAN_BUDGETS["developer"];

    // --------------------------------------------
    // 5. Determine If Over Budget
    // --------------------------------------------
    if (monthlyTokens > monthlyBudget) {
      const nextPlan =
        planId === "developer"
          ? "startup"
          : planId === "startup"
          ? "team"
          : "enterprise";

      return {
        allowed: false,
        reason: "Your AI monthly token allowance has been exceeded.",
        suggestedPlan: nextPlan,
        upgradeMessage: `Upgrade to ${nextPlan} for higher AI limits.`,
        monthlyTokens,
        monthlyBudget,
      };
    }

    // --------------------------------------------
    // 6. All Good — Allow Request
    // --------------------------------------------
    return {
      allowed: true,
      cost,
      monthlyTokens,
      monthlyBudget,
    };
  }
}
