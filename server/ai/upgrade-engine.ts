// server/ai/upgrade-engine.ts

/**
 * DevVelocity Upgrade Engine
 * ------------------------------------------------------------
 * Determines whether an AI-generated architecture exceeds
 * the user's subscription tier and suggests upgrades.
 *
 * Works with:
 *  - marketing/pricing.json
 *  - builder-engine.ts
 *  - builder-router.ts
 */

import pricingData from "@/marketing/pricing.json";

export class UpgradeEngine {
  /**
   * Compare generated AI output against plan limits
   */
  static async evaluate(aiOutput: any, planId: string) {
    if (!aiOutput || typeof aiOutput !== "object") {
      return { needsUpgrade: false };
    }

    const plan = pricingData.plans.find((p) => p.id === planId);

    if (!plan) {
      return {
        needsUpgrade: true,
        message: "Invalid plan detected. Please upgrade.",
        recommendedPlan: "startup",
      };
    }

    const architecture = aiOutput.architecture ?? {};

    // ------------------------------------------------------------
    // 1. Provider Count Check
    // ------------------------------------------------------------
    const usedProviders = Object.keys(architecture.providers ?? {});
    const providerCount = usedProviders.length;

    const allowedProviders =
      typeof plan.providers === "number" ? plan.providers : Infinity;

    if (providerCount > allowedProviders) {
      return {
        needsUpgrade: true,
        message: `Your architecture uses ${providerCount} cloud providers, but your plan allows only ${allowedProviders}.`,
        recommendedPlan: UpgradeEngine.nextPlan(planId),
      };
    }

    // ------------------------------------------------------------
    // 2. Feature Check (SSO, autoscale, enterprise auth, etc.)
    // ------------------------------------------------------------
    const requiredFeatures = architecture.features ?? [];

    const planFeatures = plan.automation ?? {};

    // Special checks
    const featureViolations = [];

    // Autoscaling
    if (requiredFeatures.includes("autoscale")) {
      if (planFeatures.scaling !== "autoscale" && planId !== "enterprise") {
        featureViolations.push("autoscale");
      }
    }

    // Blue/Green Deployments
    if (requiredFeatures.includes("blue_green")) {
      if (
        planFeatures.deployment_safety !== "blue_green" &&
        planId !== "enterprise"
      ) {
        featureViolations.push("blue_green");
      }
    }

    // Enterprise SSO
    if (requiredFeatures.includes("enterprise_sso")) {
      if (plan.sso !== "enterprise" && planId !== "enterprise") {
        featureViolations.push("enterprise_sso");
      }
    }

    if (featureViolations.length > 0) {
      return {
        needsUpgrade: true,
        message:
          `Your architecture requires features not included in your plan: ${featureViolations.join(
            ", "
          )}.`,
        recommendedPlan: UpgradeEngine.nextPlan(planId),
      };
    }

    // ------------------------------------------------------------
    // 3. Build Minutes (AI estimated workload)
    // ------------------------------------------------------------
    if (aiOutput.estimated_build_minutes) {
      const required = aiOutput.estimated_build_minutes;
      const allowed = plan.limits?.build_minutes ?? Infinity;

      if (typeof allowed === "number" && required > allowed) {
        return {
          needsUpgrade: true,
          message: `The generated infrastructure requires ~${required} build minutes, exceeding your plan's limit of ${allowed}.`,
          recommendedPlan: UpgradeEngine.nextPlan(planId),
        };
      }
    }

    // ------------------------------------------------------------
    // 4. API Calls (if AI estimates usage)
    // ------------------------------------------------------------
    if (aiOutput.estimated_api_calls) {
      const required = aiOutput.estimated_api_calls;
      const allowed = plan.limits?.api_calls ?? Infinity;

      if (typeof allowed === "number" && required > allowed) {
        return {
          needsUpgrade: true,
          message: `Your architecture is projected to use ~${required} API calls, but your plan allows ${allowed}.`,
          recommendedPlan: UpgradeEngine.nextPlan(planId),
        };
      }
    }

    // ------------------------------------------------------------
    // 5. Pipelines
    // ------------------------------------------------------------
    if (aiOutput.estimated_pipelines) {
      const required = aiOutput.estimated_pipelines;
      const allowed = plan.limits?.pipelines ?? Infinity;

      if (typeof allowed === "number" && required > allowed) {
        return {
          needsUpgrade: true,
          message: `Your architecture needs ${required} automated pipelines, exceeding your plan limit of ${allowed}.`,
          recommendedPlan: UpgradeEngine.nextPlan(planId),
        };
      }
    }

    // ------------------------------------------------------------
    // PASSED — No violations
    // ------------------------------------------------------------
    return {
      needsUpgrade: false,
    };
  }

  /**
   * Returns the next plan in the chain.
   */
  static nextPlan(planId: string) {
    if (planId === "developer") return "startup";
    if (planId === "startup") return "team";
    if (planId === "team") return "enterprise";
    return "enterprise";
  }
}
