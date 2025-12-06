/**
 * DevVelocity AI — Builder Router
 * ------------------------------------------------------------
 * Central controller for all AI Builder operations.
 *
 * Handles:
 *  ✓ Rate limits per tier
 *  ✓ Plan gating (developer/startup/team/enterprise)
 *  ✓ Prompt generation
 *  ✓ AI Builder Execution (GPT-5.1-Pro)
 *  ✓ Upgrade Recommendation Engine
 *  ✓ Billing / Usage Logging
 *  ✓ Error shielding
 */

import { applyRateLimit } from "./rate-limit";
import { buildAIPrompt } from "./prompt";
import { BuilderEngine } from "./builder-engine";
import { UpgradeEngine } from "./upgrade-engine";
import { AICreditTracking } from "./credit-tracking";
import { getPlan } from "@/ai-builder/plan-logic";
import { createClient } from "@supabase/supabase-js";

export class AIBuilderRouter {
  /**
   * Main entry point for AI Builder Requests
   */
  static async run(orgId: string, answers: any) {
    try {
      const planId = answers.plan ?? "developer";
      const plan = getPlan(planId);

      if (!plan) {
        return { error: "Invalid plan tier." };
      }

      // -------------------------------------------------------
      // 🔒 Rate Limiting
      // -------------------------------------------------------
      const limitCheck = await applyRateLimit(orgId, planId);

      if (!limitCheck.allowed) {
        return {
          error: limitCheck.reason,
          upgrade: limitCheck.upgradeMessage ?? `Upgrade to increase limits.`,
        };
      }

      // -------------------------------------------------------
      // 🧠 Build AI Prompt
      // -------------------------------------------------------
      const prompt = buildAIPrompt(answers);

      // -------------------------------------------------------
      // 🤖 Run Builder via GPT-5.1-Pro
      // -------------------------------------------------------
      const aiOutput = await BuilderEngine.run(prompt);

      if (aiOutput?.error) {
        return { error: aiOutput.error };
      }

      // -------------------------------------------------------
      // 🧪 Evaluate Output for Tier Upgrade Suggestions
      // -------------------------------------------------------
      const upgradeCheck = await UpgradeEngine.evaluate(aiOutput, planId);

      if (upgradeCheck.needsUpgrade) {
        return {
          output: aiOutput,
          upgrade: upgradeCheck.message,
          suggestedPlan: upgradeCheck.recommendedPlan,
        };
      }

      // -------------------------------------------------------
      // 🔢 Token Cost / Billing / Usage Tracking
      // -------------------------------------------------------
      await AICreditTracking.record({
        orgId,
        planId,
        inputTokens: aiOutput?.tokenUsage?.input ?? 1500,
        outputTokens: aiOutput?.tokenUsage?.output ?? 3500,
      });

      // -------------------------------------------------------
      // 📊 Log usage event
      // -------------------------------------------------------
      await AIBuilderRouter.logUsage(orgId, planId);

      return {
        output: aiOutput,
        upgrade: null,
      };
    } catch (err: any) {
      console.error("AI Builder Router Error:", err);
      return { error: "AI Builder Router failed unexpectedly." };
    }
  }

  /**
   * Save a usage event to billing_events
   */
  static async logUsage(orgId: string, planId: string) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from("billing_events").insert({
      org_id: orgId,
      type: "ai_builder_request",
      amount: 1,
      details: { plan: planId },
    });
  }
}
