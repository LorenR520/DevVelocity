// server/ai/upgrade-engine.ts

/**
 * DevVelocity — AI Upgrade Evaluation Engine
 * ---------------------------------------------------------
 * Determines:
 *  ✓ Whether AI output exceeds customer's tier
 *  ✓ What features require a higher plan
 *  ✓ Which plan to recommend next
 *
 * Works with paid tiers:
 *  - developer ($39)
 *  - startup ($99)
 *  - team ($299)
 *  - enterprise ($1250+)
 */

import pricing from "../../marketing/pricing.json";

type PlanId = "developer" | "startup" | "team" | "enterprise";

const PLAN_ORDER: PlanId[] = ["developer", "startup", "team", "enterprise"];

export class UpgradeEngine {
  /**
   * Evaluate AI Builder Output Against Plan Limits
   */
  static async evaluate(aiOutput: any, planId: PlanId) {
    if (!aiOutput) {
      return { needsUpgrade: false };
    }

    const plan = pricing.plans.find((p) => p.id === planId);
    if (!plan) {
      return {
        needsUpgrade: true,
        message: "Invalid plan tier assigned. Contact support.",
        recommendedPlan: "startup",
      };
    }

    // -----------------------------------------
    // Check Provider Count
    // -----------------------------------------
    const providersUsed = Array.isArray(aiOutput.providers)
      ? aiOutput.providers.length
      : aiOutput.providers?.count ?? 1;

    const allowedProviders =
      typeof plan.providers === "number"
        ? plan.providers
        : Infinity; // enterprise = unlimited

    if (providersUsed > allowedProviders) {
      const next = UpgradeEngine.nextPlan(planId);

      return {
        needsUpgrade: true,
        message: `Your current plan allows ${allowedProviders} providers. This architecture uses ${providersUsed}.`,
        recommendedPlan: next,
      };
    }

    // -----------------------------------------
    // Check advanced automation features
    // -----------------------------------------
    if (aiOutput.features) {
      const requiresTier = UpgradeEngine.checkFeatureTier(aiOutput.features);

      if (requiresTier && UpgradeEngine.rank(requiresTier) > UpgradeEngine.rank(planId)) {
        return {
          needsUpgrade: true,
          message: `This build uses features available only on the ${requiresTier} tier.`,
          recommendedPlan: requiresTier,
        };
      }
    }

    // -----------------------------------------
    // Passed All Checks
    // -----------------------------------------
    return {
      needsUpgrade: false,
      message: null,
      recommendedPlan: null,
    };
  }

  /**
   * Determine required tier based on features
   */
  static checkFeatureTier(features: any): PlanId | null {
    const f = JSON.stringify(features).toLowerCase();

    if (f.includes("multi-cloud") || f.includes("failover")) return "enterprise";
    if (f.includes("autoscale") || f.includes("zero_downtime")) return "team";
    if (f.includes("scheduled") || f.includes("backup")) return "startup";

    return null;
  }

  /**
   * Get the next higher plan
   */
  static nextPlan(current: PlanId): PlanId {
    const i = PLAN_ORDER.indexOf(current);
    if (i === -1 || i === PLAN_ORDER.length - 1) return "enterprise";
    return PLAN_ORDER[i + 1];
  }

  /**
   * Plan ranking index
   */
  static rank(plan: PlanId): number {
    return PLAN_ORDER.indexOf(plan);
  }
}
