/**
 * DevVelocity — Architecture File Upgrader
 * --------------------------------------------------------
 * Takes an existing saved architecture JSON and:
 *  ✓ Normalizes outdated fields
 *  ✓ Upgrades to new schema format
 *  ✓ Removes deprecated keys
 *  ✓ Adds missing required fields
 *  ✓ Ensures plan-tier compatibility
 *  ✓ Suggests upgrade if output exceeds plan limits
 *
 * Powered by GPT-5.1-Pro with strict JSON return format.
 */

import OpenAI from "openai";
import { getPlan } from "@/ai-builder/plan-logic";
import { buildUpgradePrompt } from "@/ai-builder/prompt";
import { UpgradeEngine } from "./upgrade-engine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function upgradeArchitectureFile(oldFile: any, planId: string) {
  try {
    const plan = getPlan(planId);
    if (!plan) {
      return {
        error: "Invalid plan ID",
        suggestedPlan: "startup",
      };
    }

    // --------------------------------------------------------
    // 1. Build AI prompt for upgrade
    // --------------------------------------------------------
    const prompt = buildUpgradePrompt(oldFile, planId);

    // --------------------------------------------------------
    // 2. GPT-5.1-Pro — JSON-only structured response
    // --------------------------------------------------------
    const response = await openai.chat.completions.create({
      model: "gpt-5.1-pro",
      temperature: 0.15,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are DevVelocity's automated architecture normalizer. " +
            "Always return ONLY valid JSON. No text. No commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawOutput =
      response.choices?.[0]?.message?.content ?? "{}";

    let upgraded;
    try {
      upgraded = JSON.parse(rawOutput);
    } catch (err) {
      return {
        error: "AI returned invalid JSON.",
        raw: rawOutput,
      };
    }

    // --------------------------------------------------------
    // 3. Validate against plan limitations
    // --------------------------------------------------------
    const upgradeCheck = await UpgradeEngine.evaluate(upgraded, planId);

    if (upgradeCheck.needsUpgrade) {
      return {
        upgraded,
        needsUpgrade: true,
        message: upgradeCheck.message,
        suggestedPlan: upgradeCheck.recommendedPlan,
      };
    }

    // --------------------------------------------------------
    // 4. All good — return upgraded architecture
    // --------------------------------------------------------
    return {
      upgraded,
      needsUpgrade: false,
    };
  } catch (err: any) {
    console.error("File Upgrader Error:", err);
    return {
      error: err.message ?? "Unknown file upgrade failure.",
    };
  }
}
