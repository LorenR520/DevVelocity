// server/ai/upgrade-engine.ts

/**
 * DevVelocity — AI Upgrade Engine
 * ---------------------------------------------------
 * Responsibilities:
 *  ✓ Detect outdated/broken architecture JSON
 *  ✓ Compare against current DevVelocity standards
 *  ✓ Provide required + optional upgrades
 *  ✓ Enforce plan limits (developer/startup/team/enterprise)
 *  ✓ Produce corrected JSON output
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Plan capability map
 * Determines if a user’s plan allows advanced features
 */
const PLAN_CAPABILITIES = {
  developer: {
    maxProviders: 1,
    allowFailover: false,
    allowAutoscale: false,
    allowEnterpriseFeatures: false,
  },
  startup: {
    maxProviders: 3,
    allowFailover: false,
    allowAutoscale: true,
    allowEnterpriseFeatures: false,
  },
  team: {
    maxProviders: 7,
    allowFailover: true,
    allowAutoscale: true,
    allowEnterpriseFeatures: false,
  },
  enterprise: {
    maxProviders: Infinity,
    allowFailover: true,
    allowAutoscale: true,
    allowEnterpriseFeatures: true,
  },
};

export class UpgradeEngine {
  /**
   * Analyze an AI Builder output for plan restrictions
   */
  static async evaluate(aiOutput: any, planId: string) {
    const capabilities = PLAN_CAPABILITIES[planId] ?? PLAN_CAPABILITIES.developer;

    let needsUpgrade = false;
    let reasons: string[] = [];

    const providerCount =
      Array.isArray(aiOutput?.providers)
        ? aiOutput.providers.length
        : 1;

    // Enforce provider limits
    if (providerCount > capabilities.maxProviders) {
      needsUpgrade = true;
      reasons.push(
        `Your current plan allows up to ${capabilities.maxProviders} cloud providers.`
      );
    }

    // Failover requires Team+
    if (aiOutput?.architecture?.multiCloudFailover && !capabilities.allowFailover) {
      needsUpgrade = true;
      reasons.push("Multi-cloud failover requires the Team plan or higher.");
    }

    // Autoscaling requires Startup+
    if (aiOutput?.architecture?.autoscaling && !capabilities.allowAutoscale) {
      needsUpgrade = true;
      reasons.push("Autoscaling requires the Startup plan or higher.");
    }

    // Enterprise SSO, compliance, or audit logging
    if (
      aiOutput?.enterprise?.security ||
      aiOutput?.enterprise?.governance ||
      aiOutput?.enterprise?.compliance
    ) {
      if (!capabilities.allowEnterpriseFeatures) {
        needsUpgrade = true;
        reasons.push("Enterprise compliance and governance require the Enterprise plan.");
      }
    }

    if (!needsUpgrade) {
      return { needsUpgrade: false };
    }

    // Recommend next plan
    const recommendedPlan =
      planId === "developer"
        ? "startup"
        : planId === "startup"
        ? "team"
        : "enterprise";

    return {
      needsUpgrade: true,
      message: reasons.join(" "),
      recommendedPlan,
    };
  }

  /**
   * Modernize an existing saved architecture file using GPT-5.1-Pro
   */
  static async modernize(file: any, planId: string) {
    const prompt = `
You are DevVelocity Upgrade Engine.
Your job:
1. Take outdated infrastructure JSON.
2. Fix deprecated fields.
3. Normalize the provider structure.
4. Ensure compatibility with latest multi-cloud standards.
5. Remove invalid keys.
6. DO NOT add features beyond the user’s plan tier (${planId}).
7. Output strictly valid JSON — no markdown.

Here is the file to upgrade:

${JSON.stringify(file, null, 2)}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5.1-pro",
      messages: [
        { role: "system", content: "Return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.15,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    });

    const raw = response.choices?.[0]?.message?.content;

    if (!raw) return { error: "No output from upgrade engine." };

    try {
      const json = JSON.parse(raw);
      return { upgraded: json };
    } catch (err) {
      return {
        error: "Could not parse upgraded JSON.",
        raw,
      };
    }
  }
}
