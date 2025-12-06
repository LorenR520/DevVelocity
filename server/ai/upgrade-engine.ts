// server/ai/upgrade-engine.ts

/**
 * DevVelocity AI — Upgrade Enforcement Engine
 * ------------------------------------------------------------
 * Compares AI-generated architecture with plan limits.
 * Determines:
 *   ✓ If build is allowed for current tier
 *   ✓ If user must upgrade
 *   ✓ Which plan to upgrade to
 *   ✓ Why the upgrade is required
 */

import { getPlan } from "@/ai-builder/plan-logic";

export class UpgradeEngine {
  /**
   * Evaluate AI output vs plan rules
   */
  static async evaluate(aiResult: any, planId: string) {
    if (!aiResult || !aiResult.architecture)
      return { needsUpgrade: false };

    const plan = getPlan(planId);
    if (!plan)
      return { needsUpgrade: false };

    const arch = aiResult.architecture;

    // ------------------------------------------------------
    // 1. Providers limit
    // ------------------------------------------------------
    const providerCount = Array.isArray(arch.providers)
      ? arch.providers.length
      : 0;

    if (
      plan.providers !== "unlimited" &&
      providerCount > plan.providers
    ) {
      return {
        needsUpgrade: true,
        recommendedPlan: UpgradeEngine.nextPlan(planId),
        message: `Your plan allows up to ${plan.providers} cloud providers. This architecture uses ${providerCount}.`,
      };
    }

    // ------------------------------------------------------
    // 2. Automation Features
    // ------------------------------------------------------
    const usesEnterpriseOnly =
      arch.features?.includes("multi_cloud_failover") ||
      arch.features?.includes("zero_downtime_deployments") ||
      arch.features?.includes("ai_autoscale");

    if (usesEnterpriseOnly && planId !== "enterprise") {
      return {
        needsUpgrade: true,
        recommendedPlan: "enterprise",
        message:
          "This build includes Enterprise-only automation features such as failover, zero-downtime pipelines, or AI autoscaling.",
      };
    }

    // ------------------------------------------------------
    // 3. Scaling Features
    // ------------------------------------------------------
    if (
      arch.scaling === "autoscale" &&
      !["team", "enterprise"].includes(planId)
    ) {
      return {
        needsUpgrade: true,
        recommendedPlan: "team",
        message:
          "Autoscale requires the Team plan or higher.",
      };
    }

    if (
      arch.scaling === "ai_autoscale" &&
      planId !== "enterprise"
    ) {
      return {
        needsUpgrade: true,
        recommendedPlan: "enterprise",
        message:
          "AI-driven autoscaling is available only on Enterprise plans.",
      };
    }

    // ------------------------------------------------------
    // 4. Compliance Features
    // ------------------------------------------------------
    if (
      arch.compliance === "enterprise" &&
      planId !== "enterprise"
    ) {
      return {
        needsUpgrade: true,
        recommendedPlan: "enterprise",
        message:
          "Enterprise-grade compliance frameworks require the Enterprise plan.",
      };
    }

    // ------------------------------------------------------
    // 5. Triggered by scraping engine (if extremely large output)
    // ------------------------------------------------------
    if (arch.estimatedBuildMinutes > plan.limits.build_minutes &&
        plan.limits.build_minutes !== "custom") {
      return {
        needsUpgrade: true,
        recommendedPlan: UpgradeEngine.nextPlan(planId),
        message: `This architecture exceeds your plan’s build-minute allocation (${plan.limits.build_minutes} minutes).`,
      };
    }

    // ------------------------------------------------------
    // Otherwise — allowed
    // ------------------------------------------------------
    return {
      needsUpgrade: false,
    };
  }

  /**
   * Determine the next tier in the upgrade ladder
   */
  static nextPlan(current: string) {
    if (current === "developer") return "startup";
    if (current === "startup") return "team";
    if (current === "team") return "enterprise";
    return null;
  }
}
