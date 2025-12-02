// server/ai/credit-tracking.ts

/**
 * DevVelocity AI — Credit Tracking Engine
 * ------------------------------------------------
 * Tracks:
 *  ✓ Token usage
 *  ✓ Cost estimates
 *  ✓ Per-plan monthly allowances
 *  ✓ Billing event insertion
 *  ✓ Upgrade recommendations
 */

import { createClient } from "@supabase/supabase-js";

// GPT-5.1-Pro pricing model (approximate)
const COST_PER_1K_INPUT = 0.005;
const COST_PER_1K_OUTPUT = 0.015;

// Monthly AI token budgets per tier
const PLAN_BUDGETS = {
  developer: 50000,     // 50k tokens monthly
  startup: 250000,      // 250k tokens
  team: 1000000,        // 1M tokens
  enterprise: Infinity, // unlimited
};

export class AICreditTracking {
  /**
   * Log usage and check whether the request exceeds plan limits
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

    // -----------------------------------------
    // 💰 Compute cost
    // -----------------------------------------
    const cost =
      (inputTokens / 1000) * COST_PER_1K_INPUT +
      (outputTokens / 1000) * COST_PER_1K_OUTPUT;

    // -----------------------------------------
    // 📊 Insert Billing Event
    // -----------------------------------------
    await supabase.from("billing_events").insert({
      org_id: orgId,
      type: "ai_usage",
      amount: cost,
      details: {
        inputTokens,
        outputTokens,
        planId,
      },
    });

    // -----------------------------------------
    // 📚 Track total monthly usage
    // -----------------------------------------
    const { data: totalUsage } = await supabase.rpc(
      "ai_usage_this_month",
      { p_org_id: orgId }
    );

    const monthlyTokens = totalUsage?.sum ?? 0;
    const planBudget = PLAN_BUDGETS[planId] ?? 50000;

    // -----------------------------------------
    // 🚨 Check if user exceeds allowance
    // -----------------------------------------
    if (monthlyTokens > planBudget) {
      const nextPlan =
        planId === "developer"
          ? "startup"
          : planId === "startup"
          ? "team"
          : "enterprise";

      return {
        allowed: false,
        reason: `Your plan’s monthly AI limit has been exceeded.`,
        suggestedPlan: nextPlan,
        upgradeMessage: `Upgrade to ${nextPlan} for a larger AI token allowance.`,
      };
    }

    // -----------------------------------------
    // 👍 Allow the request
    // -----------------------------------------
    return {
      allowed: true,
      cost,
      monthlyTokens,
      planBudget,
    };
  }
}
