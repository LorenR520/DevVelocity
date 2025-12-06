// server/ai/upgrade-engine.ts

/**
 * DevVelocity AI — Upgrade Engine
 * --------------------------------------------------------
 * Used when:
 *  ✓ A user requests "Upgrade Existing File"
 *  ✓ AI Builder Router detects outdated fields
 *  ✓ A plan exceeds its permitted capabilities
 *
 * Responsibilities:
 *  ✓ Compare architecture JSON to latest schema
 *  ✓ Suggest upgrades
 *  ✓ Block upgrades requiring a higher tier
 *  ✓ Produce a new JSON file aligned to 2025 DX standards
 */

import OpenAI from "openai";
import { buildUpgradePrompt } from "@/server/ai/prompt";
import { getPlan } from "@/ai-builder/plan-logic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class UpgradeEngine {
  /**
   * Evaluate whether the output exceeds plan limits
   * Called inside builder-router.ts
   */
  static async evaluate(aiOutput: any, planId: string) {
    const plan = getPlan(planId);
    if (!plan) return { needsUpgrade: false };

    const features = aiOutput?.features ?? {};

    // Example rules — these prevent lower-tier users
    // from generating enterprise-level infra
    const violations = [];

    // If user is on Startup but AI generated multi-cloud
    if (features.multiCloud && planId === "developer") {
      violations.push("Multi-cloud orchestration requires Startup tier.");
    }

    if (features.multiCloud && planId === "startup") {
      violations.push("Multi-cloud orchestration requires Team tier.");
    }

    if (features.multiCloudFailover && planId !== "enterprise") {
      violations.push("AI Auto-Failover requires Enterprise tier.");
    }

    if (violations.length > 0) {
      const recommendedPlan =
        planId === "developer"
          ? "startup"
          : planId === "startup"
          ? "team"
          : "enterprise";

      return {
        needsUpgrade: true,
        message: violations.join(" "),
        recommendedPlan,
      };
    }

    return { needsUpgrade: false };
  }

  /**
   * Upgrade an existing DevVelocity architecture file
   */
  static async runUpgrade(existingFile: any, planId: string) {
    try {
      const prompt = buildUpgradePrompt(existingFile, planId);

      const response = await openai.chat.completions.create({
        model: "gpt-5.1-pro",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: prompt,
          },
        ],
        max_tokens: 6000,
      });

      const raw = response.choices?.[0]?.message?.content;

      if (!raw) {
        return { error: "Upgrade engine returned no output." };
      }

      // Attempt to parse upgraded JSON
      try {
        const upgraded = JSON.parse(raw);

        return {
          upgraded,
          message: "Upgrade completed successfully.",
        };
      } catch (err) {
        return {
          error: "Failed to parse JSON upgrade output.",
          raw,
        };
      }
    } catch (err: any) {
      console.error("Upgrade Engine Error:", err);
      return {
        error: err.message ?? "Unknown upgrade engine failure.",
      };
    }
  }
}
