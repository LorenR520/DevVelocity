/**
 * DevVelocity — AI Upgrade Engine
 * -----------------------------------------------------------
 * Evaluates AI Builder output and determines:
 *  - whether current plan supports generated architecture
 *  - if upgrade is required
 *  - recommended tier
 *  - warnings for over-limit usage
 *
 * Works with new paid Developer tier (no free plans).
 */

import { getPlan } from "@/ai-builder/plan-logic";

export class UpgradeEngine {
  /**
   * Main evaluation method
   */
  static async evaluate(aiOutput: any, planId: string) {
    const plan = getPlan(planId);

    if (!plan) {
      return {
        needsUpgrade: true,
        message: "Invalid plan tier.",
        recommendedPlan: "startup",
      };
    }

    // Nothing to evaluate
    if (!aiOutput) {
      return { needsUpgrade: false };
    }

    // -------------------------------------------------------
    // Extract architecture metadata
    // -------------------------------------------------------
    const providersUsed = aiOutput.providers?.length ?? 0;
    const pipelinesUsed = aiOutput.pipelines?.length ?? 0;
    const featuresUsed = aiOutput.features?.length ?? 0;

    // -------------------------------------------------------
    // Compare to plan capabilities
    // -------------------------------------------------------
    const providerLimit = plan.providers === "unlimited" ? Infinity : plan.providers;
    const pipelineLimit = plan.limits?.pipelines ?? Infinity;
    const featureLimit = plan.limits?.api_calls ?? Infinity; // loosely approximate

    // -------------------------------------------------------
    // Provider Limit
    // -------------------------------------------------------
    if (providersUsed > providerLimit) {
      const recommended = UpgradeEngine.recommendPlan(providersUsed);
      return {
        needsUpgrade: true,
        recommendedPlan: recommended,
        message: `This architecture requires ${providersUsed} cloud providers, but your plan supports only ${providerLimit}. Upgrade to ${recommended}.`,
      };
    }

    // -------------------------------------------------------
    // Pipeline Limit
    // -------------------------------------------------------
    if (pipelinesUsed > pipelineLimit) {
      const recommended = UpgradeEngine.recommendPlan(pipelinesUsed);
      return {
        needsUpgrade: true,
        recommendedPlan: recommended,
        message: `Your architecture contains ${pipelinesUsed} CI/CD pipelines, exceeding your current plan’s limit of ${pipelineLimit}.`,
      };
    }

    // -------------------------------------------------------
    // Feature complexity (soft check)
    // -------------------------------------------------------
    if (planId === "developer" && featuresUsed > 30) {
      return {
        needsUpgrade: true,
        recommendedPlan: "startup",
        message:
          "This architecture is too complex for the Developer tier. Upgrade to unlock advanced automation and multi-provider features.",
      };
    }

    if (planId === "startup" && featuresUsed > 75) {
      return {
        needsUpgrade: true,
        recommendedPlan: "team",
        message:
          "Your architecture contains enterprise-level features exceeding Startup tier thresholds.",
      };
    }

    // -------------------------------------------------------
    // Enterprise = always allowed
    // -------------------------------------------------------
    if (planId === "enterprise") {
      return { needsUpgrade: false };
    }

    // -------------------------------------------------------
    // Allowed
    // -------------------------------------------------------
    return {
      needsUpgrade: false,
    };
  }

  /**
   * Picks the recommended plan for the architecture
   */
  static recommendPlan(requiredProviders: number): string {
    if (requiredProviders <= 3) return "startup";
    if (requiredProviders <= 7) return "team";
    return "enterprise";
  }
}
