// server/ai/builder-router.ts

/**
 * DevVelocity AI — Builder Router
 * ------------------------------------------------
 * Coordinates:
 *  ✓ Rate limits
 *  ✓ Plan gating
 *  ✓ Prompt generation
 *  ✓ AI Builder Engine
 *  ✓ Upgrade Engine (when output exceeds plan)
 *  ✓ Usage logging
 */

import { applyRateLimit } from "./rate-limit";
import { buildAIPrompt } from "./prompt";
import { BuilderEngine } from "./builder-engine"; 
import { UpgradeEngine } from "./upgrade-engine"; 
import { getPlan } from "@/ai-builder/plan-logic";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// global OpenAI client (5.1-pro)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class AIBuilderRouter {
  /**
   * Main entry point for AI Builder requests
   */
  static async run(orgId: string, answers: any) {
    const planId = answers.plan ?? "developer";
    const plan = getPlan(planId);

    if (!plan) {
      return {
        error: "Invalid plan tier",
      };
    }

    // -----------------------------------------
    // 🔒 Rate Limit Check
    // -----------------------------------------
    const rateCheck = await applyRateLimit(orgId, planId);

    if (!rateCheck.allowed) {
      return {
        error: rateCheck.reason,
        upgrade: `Upgrade to increase your AI request limits.`,
      };
    }

    // -----------------------------------------
    // 🧠 Build prompt with tier-aware logic
    // -----------------------------------------
    const prompt = buildAIPrompt(answers);

    // -----------------------------------------
    // 🤖 Run AI Builder (GPT-5.1-Pro)
    // -----------------------------------------
    const aiResult = await BuilderEngine.run(openai, prompt);

    // -----------------------------------------
    // 🧪 Check if output exceeds tier capabilities
    // -----------------------------------------
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

    // -----------------------------------------
    // 📊 Log AI builder usage event
    // -----------------------------------------
    await AIBuilderRouter.logUsage(orgId, planId);

    return {
      output: aiResult,
      upgrade: null,
    };
  }

  /**
   * Track AI usage in billing_events
   */
  static async logUsage(orgId: string, planId: string) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from("billing_events").insert({
      org_id: orgId,
      type: "ai_usage",
      amount: 1,
      details: { plan: planId },
    });
  }
}
