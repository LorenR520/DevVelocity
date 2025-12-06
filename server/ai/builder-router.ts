// server/ai/builder-router.ts
/**
 * DevVelocity AI — Builder Router (Production Ready)
 * ----------------------------------------------------
 * Responsibilities:
 *  ✓ Apply plan rules
 *  ✓ Enforce paid tier limits (Developer is PAID)
 *  ✓ Build prompt
 *  ✓ Run Builder Engine (GPT-5.1)
 *  ✓ Evaluate upgrade requirements
 *  ✓ Log usage for billing
 */

import { applyRateLimit } from "./rate-limit";
import { buildAIPrompt } from "./prompt";
import { BuilderEngine } from "./builder-engine";
import { UpgradeEngine } from "./upgrade-engine";
import { getPlan } from "./plan-logic";   // FIXED PATH
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Global OpenAI client — GPT-5.1
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class AIBuilderRouter {
  /**
   * Main orchestrator for the AI Builder flow
   */
  static async run(orgId: string, answers: any) {
    try {
      // Determine plan ID from request or force developer
      const planId = answers.plan ?? "developer";
      const plan = getPlan(planId);

      if (!plan) {
        return { error: "Invalid plan tier." };
      }

      // ------------------------------------------------------
      // 🔒 RATE LIMIT ENFORCEMENT (all tiers are paid)
      // ------------------------------------------------------
      const rateCheck = await applyRateLimit(orgId, planId);

      if (!rateCheck.allowed) {
        return {
          error: rateCheck.reason,
          upgrade: rateCheck.suggestedUpgrade ?? null,
        };
      }

      // ------------------------------------------------------
      // 🧠 BUILD AI PROMPT BASED ON USER ANSWERS
      // ------------------------------------------------------
      const prompt = buildAIPrompt(answers);

      // ------------------------------------------------------
      // 🤖 RUN BUILDER ENGINE (GPT-5.1)
      // ------------------------------------------------------
      const aiResult = await BuilderEngine.run(openai, prompt);

      if (!aiResult) {
        return { error: "AI Builder returned no output." };
      }

      // ------------------------------------------------------
      // 🧪 EVALUATE WHETHER PLAN LIMITATIONS ARE EXCEEDED
      // ------------------------------------------------------
      const upgradeSuggestions = await UpgradeEngine.evaluate(
        aiResult,
        planId
      );

      if (upgradeSuggestions?.needsUpgrade) {
        return {
          output: aiResult,
          upgrade: upgradeSuggestions.message,
          suggestedPlan: upgradeSuggestions.recommendedPlan,
        };
      }

      // ------------------------------------------------------
      // 📊 BILLING — LOG USAGE
      // ------------------------------------------------------
      await AIBuilderRouter.logUsage(orgId, planId);

      return {
        output: aiResult,
        upgrade: null,
      };
    } catch (err: any) {
      console.error("AI Builder Router Error:", err);
      return {
        error: "AI Builder encountered an internal error.",
      };
    }
  }

  /**
   * Log AI usage in billing_events table
   */
  static async logUsage(orgId: string, planId: string) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase.from("billing_events").insert({
        org_id: orgId,
        type: "ai_usage",
        amount: 1, // 1 AI build event
        details: { plan: planId },
      });
    } catch (err) {
      console.error("Billing Usage Log Error:", err);
    }
  }
}
