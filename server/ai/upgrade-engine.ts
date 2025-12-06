// server/ai/upgrade-engine.ts

/**
 * DevVelocity AI — Upgrade Engine
 * --------------------------------------------------------
 * Detects whether an AI-generated architecture exceeds
 * the limits of the user's current plan.
 *
 * Examples:
 *  - More cloud providers than allowed
 *  - Advanced Kubernetes features on Developer tier
 *  - Multi-cloud failover on Startup/Team
 *  - Enterprise-only SSO / Observability
 */

import pricingData from "@/marketing/pricing.json";

export class UpgradeEngine {
  /**
   * Evaluate whether the AI output should trigger an upgrade
   */
  static async evaluate(aiOutput: any, planId: string) {
    if (!aiOutput || !aiOutput.architecture) {
      return { needsUpgrade: false };
    }

    const plans = pricingData.plans;
    const plan = plans.find((p) => p.id === planId);

    if (!plan) {
      return {
        needsUpgrade: true,
        message: "Invalid plan — please upgrade.",
        recommendedPlan: "startup",
      };
    }

    const arch = aiOutput.architecture;

    // --------------------------------------------------------
    // RULE 1 — Provider Count Limit
    // --------------------------------------------------------
    const providerCount = Array.isArray(arch.providers)
      ? arch.providers.length
      : 0;

    if (
      typeof plan.providers === "number" &&
      providerCount > plan.providers
    ) {
      const nextPlan = UpgradeEngine.nextPlan(planId);

      return {
        needsUpgrade: true,
        message: `Your plan allows ${plan.providers} provider(s), but this architecture requires ${providerCount}.`,
        recommendedPlan: nextPlan,
      };
    }

    // --------------------------------------------------------
    // RULE 2 — Builder/Feature Capabilities
    // --------------------------------------------------------

    // Kubernetes detection
    if (
      arch.kubernetes?.enabled &&
      ["developer", "startup"].includes(planId)
    ) {
      return {
        needsUpgrade: true,
        message:
          "Kubernetes deployments require the Team or Enterprise plan.",
        recommendedPlan: "team",
      };
    }

    // Multi-cloud failover
    if (
      arch.multiCloud?.enabled &&
      !plan.automation.multi_cloud_failover
    ) {
      return {
        needsUpgrade: true,
        message:
          "Multi-cloud failover is only available on the Enterprise plan.",
        recommendedPlan: "enterprise",
      };
    }

    // SSO enforcement
    const requiredSSO = arch?.security?.sso;
    if (requiredSSO === "advanced" && planId === "developer") {
      return {
        needsUpgrade: true,
        message: "Advanced SSO requires at least the Team plan.",
        recommendedPlan: "team",
      };
    }

    if (requiredSSO === "enterprise" && planId !== "enterprise") {
      return {
        needsUpgrade: true,
        message: "Enterprise-grade SSO requires Enterprise plan.",
        recommendedPlan: "enterprise",
      };
    }

    // Autoscaling
    if (
      arch.scaling?.type === "autoscale" &&
      plan.automation.scaling !== "autoscale"
    ) {
      return {
        needsUpgrade: true,
        message: "Autoscaling requires the Team plan.",
        recommendedPlan: "team",
      };
    }

    // AI autoscale
    if (
      arch.scaling?.type === "ai_autoscale" &&
      planId !== "enterprise"
    ) {
      return {
        needsUpgrade: true,
        message:
          "AI-powered autoscaling is only available on Enterprise.",
        recommendedPlan: "enterprise",
      };
    }

    // Compliance detection
    const hasComplianceNeeds = arch?.compliance?.required ?? false;

    if (
      hasComplianceNeeds &&
      !["team", "enterprise"].includes(planId)
    ) {
      return {
        needsUpgrade: true,
        message:
          "Compliance frameworks require the Team or Enterprise plan.",
        recommendedPlan: "team",
      };
    }

    // Monitoring tier detection
    const monitoring = arch?.monitoring?.level;

    if (
      monitoring === "enhanced" &&
      !["team", "enterprise"].includes(planId)
    ) {
      return {
        needsUpgrade: true,
        message: "Enhanced monitoring requires the Team plan.",
        recommendedPlan: "team",
      };
    }

    if (
      monitoring === "full" &&
      planId !== "enterprise"
    ) {
      return {
        needsUpgrade: true,
        message: "Full observability requires the Enterprise plan.",
        recommendedPlan: "enterprise",
      };
    }

    // --------------------------------------------------------
    // No upgrade required
    // --------------------------------------------------------
    return { needsUpgrade: false };
  }

  /**
   * Get the recommended next higher plan
   */
  static nextPlan(planId: string) {
    switch (planId) {
      case "developer":
        return "startup";
      case "startup":
        return "team";
      case "team":
        return "enterprise";
      default:
        return "enterprise";
    }
  }
}
