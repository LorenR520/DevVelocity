/**
 * DevVelocity — AI Credit Tracking Engine
 * ---------------------------------------------------------
 * Tracks:
 *  ✓ Token usage (input/output)
 *  ✓ Estimated cost
 *  ✓ Plan-tier token budget
 *  ✓ Billing event insertion
 *  ✓ Upgrade recommendations
 *
 * This aligns with:
 *  - GPT-5.1-Pro pricing structures
 *  - Paid Developer tier (no free tiers)
 *  - marketing/pricing.json budgets
 */

import { createClient } from "@supabase/supabase-js";
import pricingData from "@/marketing/pricing.json";

// Estimated cost model for GPT-5.1-Pro
const COST_PER_1K_INPUT = 0.0045;
const COST_PER_1K_OUTPUT = 0.012;

// Extract plan budgets from marketing.json
const PLAN_BUDGETS: Record<string, number> = {
  developer: pricingData.plans.find(p => p.id === "developer")?.limits.api_calls ?? 10000,
  startup:   pricingData.plans.find(p => p.id === "startup")?.limits.api_calls ?? 50000,
  team:      pricingData.plans.find(p => p.id === "team")?.limits.api_calls ?? 150000,
  enterprise: Infinity, // enterprise is always unlimited
};

export class AICreditTracking {
  /**
   * Log usage + validate plan allowances
   */
  static async record({
    orgId,
    planId,
    inputTokens,
    outputTokens,
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

    const totalTokens = inputTokens + outputTokens;

    // ------------------------------------------------------
    // 💰 Compute estimated cost
    // ------------------------------------------------------
    const estCost =
      (inputTokens / 1000) * COST_PER_1K_INPUT +
      (outputTokens / 1000) * COST_PER_1K_OUTPUT;

    // ------------------------------------------------------
    // 📊 Insert billing event
    // ------------------------------------------------------
    await supabase.from("billing_events").insert({
      org_id: orgId,
      type: "ai_usage",
      amount: estCost,
      details: {
        inputTokens,
        outputTokens,
        totalTokens,
        plan: planId,
      },
    });

    // ------------------------------------------------------
    // 🔢 Aggregate usage for the org this month
    // ------------------------------------------------------
    const { data: totalUsage } = await supabase.rpc(
      "ai_usage_this_month",
      { p_org_id: orgId }
    );

    const monthlyUsage = totalUsage?.sum ?? 0;
    const planBudget = PLAN_BUDGETS[planId] ?? PLAN_BUDGETS["developer"];

    // ------------------------------------------------------
    // 🚨 Over-budget detection
    // ------------------------------------------------------
    if (monthlyUsage > planBudget) {
      const nextPlan =
        planId === "developer"
          ? "startup"
          : planId === "startup"
          ? "team"
          : "enterprise";

      return {
        allowed: false,
        cost: estCost,
        monthlyUsage,
        planBudget,
        reason: `Your ${planId} plan's monthly AI token limit has been exceeded.`,
        upgradeMessage: `Upgrade to ${nextPlan} for a larger AI token allowance.`,
        suggestedPlan: nextPlan,
      };
    }

    // ------------------------------------------------------
    // 👍 Allowed
    // ------------------------------------------------------
    return {
      allowed: true,
      cost: estCost,
      monthlyUsage,
      planBudget,
    };
  }
}
