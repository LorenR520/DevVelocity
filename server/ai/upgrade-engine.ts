/**
 * DevVelocity — Upgrade Engine
 * -----------------------------------------------------------
 * Evaluates whether an AI-generated architecture exceeds the
 * user's plan based on:
 *  - Number of cloud providers
 *  - Infrastructure complexity
 *  - Multi-cloud features
 *  - Enterprise-only components
 */

import { getPlan } from "@/ai-builder/plan-logic";

export class UpgradeEngine {
  /**
   * Evaluate whether the AI result exceeds the allowed features
   * for the user's tier.
   */
  static async evaluate(aiOutput: any, planId: string) {
    const plan = getPlan(planId);

    if (!plan) {
      return {
        needsUpgrade: false,
        message: "Invalid plan tier",
      };
    }

    // Defensive default
    if (!aiOutput || typeof aiOutput !== "object") {
      return {
        needsUpgrade: false,
      };
    }

    const usedProviders = Array.isArray(aiOutput.providers)
      ? aiOutput.providers.length
      : 1;

    // -----------------------------------------------------------
    // Rule 1: Provider Limit Check
    // -----------------------------------------------------------
    if (
      plan.providers !== "unlimited" &&
      usedProviders > Number(plan.providers)
    ) {
      const nextPlan = UpgradeEngine.nextPlan(planId);

      return {
        needsUpgrade: true,
        recommendedPlan: nextPlan,
        message: `Your architecture uses ${usedProviders} providers, which exceeds your ${planId} tier limit.`,
      };
    }

    // -----------------------------------------------------------
    // Rule 2: Feature Capability Check
    // -----------------------------------------------------------
    const requiresEnterpriseFeatures =
      aiOutput.features?.includes("multi-cloud-failover") ||
      aiOutput.features?.includes("global-route-failover") ||
      aiOutput.features?.includes("ai_autoscale") ||
      aiOutput.features?.includes("zero_downtime_deployments");

    if (requiresEnterpriseFeatures && planId !== "enterprise") {
      return {
        needsUpgrade: true,
        recommendedPlan: "enterprise",
        message:
          "This architecture includes enterprise-only resiliency and scaling features. Upgrade required.",
      };
    }

    // -----------------------------------------------------------
    // Rule 3: Complexity Check (pipeline + microservice count)
    // -----------------------------------------------------------
    const serviceCount = aiOutput.services?.length ?? 1;

    if (serviceCount > 10 && planId === "developer") {
      return {
        needsUpgrade: true,
        recommendedPlan: "startup",
        message:
          "Developer tier limited to small builds. Generated architecture exceeds service complexity.",
      };
    }

    if (serviceCount > 25 && planId === "startup") {
      return {
        needsUpgrade: true,
        recommendedPlan: "team",
        message:
          "Startup tier exceeded. Upgrade to Team for medium-sized architectures.",
      };
    }

    // -----------------------------------------------------------
    // All tests passed = no upgrade required
    // -----------------------------------------------------------
    return {
      needsUpgrade: false,
      message: null,
    };
  }

  /**
   * Determine next upgrade path in order:
   * developer → startup → team → enterprise
   */
  static nextPlan(current: string) {
    switch (current) {
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
