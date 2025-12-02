// server/ai/helpers/ensure-plan-compliance.ts

/**
 * Ensures the generated AI output NEVER includes features
 * above the user's subscription tier:
 *
 * - multi-cloud
 * - cross-cloud failover
 * - enterprise pipelines
 * - SSO tiers
 * - automation tiers
 * - compliance frameworks
 *
 * If the output contains forbidden features,
 * we remove them AND add upgrade recommendations.
 */

export function ensurePlanCompliance(result: any, plan: string) {
  if (!result || typeof result !== "object") return result;

  const upgrades: string[] = [];
  const planCaps = getPlanCaps(plan);

  // ---------------------------
  // 1. Multi-cloud enforcement
  // ---------------------------
  if (planCaps.providers !== "unlimited") {
    const breakWords = ["multi-cloud", "multi cloud", "cross cloud"];

    breakWords.forEach((w) => {
      if (
        contains(result.architecture, w) ||
        contains(result.summary, w) ||
        contains(result.next_steps, w)
      ) {
        removeMultiCloud(result);
        upgrades.push(
          `Multi-cloud deployment is not available on the ${plan} plan. Upgrade to ${planCaps.upgrade} to enable multi-cloud & cross-provider failover.`
        );
      }
    });
  }

  // ---------------------------
  // 2. Failover enforcement
  // ---------------------------
  if (!planCaps.failover) {
    if (
      contains(result.architecture, "failover") ||
      contains(result.cloud_init, "failover")
    ) {
      stripFailover(result);
      upgrades.push(
        `Cross-cloud failover automation is only available starting from the ${planCaps.upgrade} plan.`
      );
    }
  }

  // ---------------------------
  // 3. SSO restrictions
  // ---------------------------
  if (!planCaps.sso) {
    if (contains(result.sso_recommendations, "SSO")) {
      result.sso_recommendations =
        "SSO integration is not available for your current plan.";
      upgrades.push("Upgrade to a higher tier to unlock SSO integrations.");
    }
  } else {
    // SSO allowed, but limited tier?
    if (planCaps.sso === "basic") {
      downgradeSSO(result);
    }
  }

  // ---------------------------
  // 4. Automation tier
  // ---------------------------
  if (planCaps.automation === "basic") {
    if (contains(result.pipelines?.automation, "advanced")) {
      result.pipelines.automation =
        "Basic CI/CD pipeline (advanced automation requires upgrade).";

      upgrades.push(
        `Advanced automation requires upgrading to ${planCaps.upgrade}.`
      );
    }
  }

  // ---------------------------
  // 5. Compliance frameworks
  // ---------------------------
  if (!planCaps.compliance) {
    if (containsCompliance(result.summary) || containsCompliance(result.architecture)) {
      removeCompliance(result);
      upgrades.push(
        `Compliance frameworks (SOC2/HIPAA/PCI/etc.) require a higher plan tier.`
      );
    }
  }

  // ---------------------------
  // Attach upgrade paths
  // ---------------------------
  if (upgrades.length > 0) {
    result.upgrade_paths = upgrades.join("\n");
  }

  return result;
}

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

function contains(str: any, keyword: string) {
  if (!str || typeof str !== "string") return false;
  return str.toLowerCase().includes(keyword.toLowerCase());
}

function containsCompliance(str: string) {
  if (!str) return false;
  const words = ["soc2", "hipaa", "pci", "gdpr", "fedramp"];
  return words.some((w) => str.toLowerCase().includes(w));
}

function removeMultiCloud(result: any) {
  result.architecture = stripWords(result.architecture, [
    "multi cloud",
    "multi-cloud",
    "cross cloud",
    "replicate across providers",
  ]);
}

function stripFailover(result: any) {
  result.architecture = stripWords(result.architecture, [
    "failover",
    "cross-cloud failover",
  ]);
  result.pipelines.provider = "";
}

function removeCompliance(result: any) {
  result.summary = stripWords(result.summary, [
    "SOC2",
    "HIPAA",
    "PCI",
    "GDPR",
    "FedRAMP",
  ]);
}

function stripWords(str: string, words: string[]) {
  if (!str) return "";
  let out = str;
  words.forEach((w) => {
    out = out.replace(new RegExp(w, "gi"), "");
  });
  return out;
}

function downgradeSSO(result: any) {
  result.sso_recommendations = "Basic SSO only (Google/Microsoft).";
}

/**
 * Plan capabilities matrix —
 * MUST match pricing.json
 */
function getPlanCaps(plan: string) {
  const caps: any = {
    developer: {
      providers: 1,
      failover: false,
      sso: false,
      automation: "basic",
      compliance: false,
      upgrade: "startup",
    },
    startup: {
      providers: 3,
      failover: false,
      sso: "basic",
      automation: "advanced",
      compliance: false,
      upgrade: "team",
    },
    team: {
      providers: 7,
      failover: true,
      sso: "advanced",
      automation: "enterprise",
      compliance: true,
      upgrade: "enterprise",
    },
    enterprise: {
      providers: "unlimited",
      failover: true,
      sso: "enterprise",
      automation: "private",
      compliance: true,
    },
  };

  return caps[plan] ?? caps.developer;
}
