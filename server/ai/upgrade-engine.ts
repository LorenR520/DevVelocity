/**
 * DevVelocity AI — Upgrade Evaluation Engine
 * ----------------------------------------------------------
 * Purpose:
 *  ✓ Determines if generated infra exceeds plan limits
 *  ✓ Suggests upgrade path (developer → startup → team → enterprise)
 *  ✓ Prevents overuse of provider count, integrations, and features
 *  ✓ Enforces marketing/pricing.json rules
 */

import pricing from "../../marketing/pricing.json";

export class UpgradeEngine {
  /**
   * Evaluate AI output against plan limits
   */
  static async evaluate(aiOutput: any, planId: string) {
    const plan = pricing.plans.find((p) => p.id === planId);

    if (!plan) {
      return { needsUpgrade: true, recommendedPlan: "developer" };
    }

    // ----------------------------------------------------------
    // 1. Extract provider list from output
    // ----------------------------------------------------------
    const providersUsed =
      aiOutput?.providers ??
      aiOutput?.cloud?.providers ??
      [];

    const providerCount = Array.isArray(providersUsed)
      ? providersUsed.length
      : 0;

    // ----------------------------------------------------------
    // 2. Provider count enforcement
    // ----------------------------------------------------------
    if (plan.providers !== "unlimited") {
      if (providerCount > plan.providers) {
        const nextPlan = UpgradeEngine.nextPlan(planId);

        return {
          needsUpgrade: true,
          recommendedPlan: nextPlan,
          message: `Your build uses ${providerCount} providers, but your current plan allows only ${plan.providers}. Upgrade to ${nextPlan} to continue.`,
        };
      }
    }

    // ----------------------------------------------------------
    // 3. Feature enforcement (multi-cloud, SSO, CI/CD, etc.)
    // ----------------------------------------------------------
    const requiredFeatures = aiOutput?.features ?? [];

    const deniedFeatures = UpgradeEngine.checkFeatureViolations(
      plan,
      requiredFeatures
    );

    if (deniedFeatures.length > 0) {
      const nextPlan = UpgradeEngine.nextPlan(planId);

      return {
        needsUpgrade: true,
        recommendedPlan: nextPlan,
        message: `Your build requires features not supported on the ${plan.name} plan: ${deniedFeatures.join(
          ", "
        )}. Please upgrade to ${nextPlan}.`,
      };
    }

    // ----------------------------------------------------------
    // 4. Output too advanced (Kubernetes, Terraform, Autoscaling)
    // ----------------------------------------------------------
    if (!UpgradeEngine.planAllowsKubernetes(planId)) {
      if (aiOutput?.kubernetes || aiOutput?.terraform) {
        return {
          needsUpgrade: true,
          recommendedPlan: "team",
          message:
            "Kubernetes and Terraform modules require the Team or Enterprise plan.",
        };
      }
    }

    // ----------------------------------------------------------
    // 5. Enterprise-only features
    // ----------------------------------------------------------
    if (UpgradeEngine.requiresEnterprise(aiOutput)) {
      if (planId !== "enterprise") {
        return {
          needsUpgrade: true,
          recommendedPlan: "enterprise",
          message:
            "This infrastructure requires Enterprise-only capabilities (zero-downtime deploys, AI autoscale, enterprise SSO, or multi-cloud failover).",
        };
      }
    }

    // ----------------------------------------------------------
    // Otherwise the output is valid
    // ----------------------------------------------------------
    return {
      needsUpgrade: false,
      recommendedPlan: null,
      message: null,
    };
  }

  /**
   * Plan progression path
   */
  static nextPlan(planId: string) {
    if (planId === "developer") return "startup";
    if (planId === "startup") return "team";
    return "enterprise";
  }

  /**
   * Check feature violations based on marketing.json
   */
  static checkFeatureViolations(plan: any, features: string[]) {
    if (!features || features.length === 0) return [];

    const denied: string[] = [];

    features.forEach((f) => {
      const allowed = plan.automation?.vendor_integrations ?? [];

      if (!allowed.includes(f)) {
        denied.push(f);
      }
    });

    return denied;
  }

  /**
   * Kubernetes & Terraform require Team+
   */
  static planAllowsKubernetes(planId: string) {
    return planId === "team" || planId === "enterprise";
  }

  /**
   * Identify Enterprise-only infra
   */
  static requiresEnterprise(aiOutput: any) {
    const entFlags = [
      "zero_downtime",
      "multi_cloud_failover",
      "ai_autoscale",
      "enterprise_sso",
      "gov_compliance",
    ];

    return entFlags.some((flag) => JSON.stringify(aiOutput).includes(flag));
  }
}
