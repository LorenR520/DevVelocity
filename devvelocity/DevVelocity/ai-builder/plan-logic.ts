import pricing from "@/marketing/pricing.json";

/**
 * Returns full plan metadata from pricing.json
 */
export function getPlan(planId: string) {
  return pricing.plans.find((p) => p.id === planId) || null;
}

/**
 * Checks if a given plan tier has access to a given feature
 */
export function hasFeature(planId: string, feature: string) {
  const plan = getPlan(planId);
  if (!plan) return false;

  const builderLevel = plan.builder;
  const ssoLevel = plan.sso;

  switch (feature) {
    case "multi_cloud":
      return plan.providers !== 1 && plan.providers !== "unlimited";

    case "failover":
      return plan.automation === "enterprise" || plan.automation === "private";

    case "advanced_builder":
      return ["advanced", "enterprise", "private"].includes(builderLevel);

    case "enterprise_builder":
      return ["enterprise", "private"].includes(builderLevel);

    case "sso_basic":
      return ["basic", "advanced", "enterprise"].includes(ssoLevel);

    case "sso_advanced":
      return ["advanced", "enterprise"].includes(ssoLevel);

    case "sso_enterprise":
      return ssoLevel === "enterprise";

    case "automations":
      return plan.automation !== "basic";

    case "scheduled_tasks_hourly":
      return ["advanced", "enterprise", "private"].includes(plan.automation);

    case "scheduled_tasks_continuous":
      return ["enterprise", "private"].includes(plan.automation);

    case "observability_full":
      return ["enterprise", "private"].includes(plan.automation);

    default:
      return false;
  }
}

/**
 * Generates a plan-limited set of allowed build output capabilities
 */
export function getAllowedCapabilities(planId: string) {
  const plan = getPlan(planId);
  if (!plan) return {};

  return {
    providers: plan.providers,
    builder: plan.builder,
    sso: plan.sso,
    limits: plan.limits,
    metered: plan.metered,
    automation: plan.automation,
  };
}

/**
 * Creates a tailored questionnaire based on plan level.
 * Higher plans receive more advanced questions.
 */
export function generateQuestions(planId: string) {
  const plan = getPlan(planId);
  if (!plan) return [];

  const q: any[] = [
    {
      id: "cloud",
      question: "Which cloud provider do you want to build on?",
      options: ["AWS", "Azure", "GCP", "Oracle Cloud", "DigitalOcean"],
      allowMultiple: plan.providers !== 1,
    },
    {
      id: "budget",
      question: "What is your monthly budget for cloud + automation?",
      options: ["<$25", "$25–$100", "$100–$500", "$500–$2000", "$2000+"],
    },
    {
      id: "automation",
      question: "What tasks would you like automated?",
      allowMultiple: true,
      options: [
        "Deployments",
        "Monitoring",
        "Scaling",
        "Backups",
        "Failover",
        "CI/CD Pipelines",
        "API Automation",
        "Scheduled Jobs",
      ],
    },
    {
      id: "maintenance",
      question: "How much maintenance do you want to perform?",
      options: [
        "None (fully automated)",
        "Minimal (alerts + auto-remediation)",
        "Medium (we handle upgrades)",
        "High (I want full access)",
      ],
    },
  ];

  // ⭐ Add SSO questions if plan supports SSO
  if (hasFeature(planId, "sso_basic")) {
    q.push({
      id: "sso",
      question: "Do you want SSO enabled?",
      options: ["None", "Google", "Microsoft", "Okta", "Auth0"],
    });
  }

  // ⭐ Add Scheduling questions for higher tiers
  if (hasFeature(planId, "scheduled_tasks_hourly")) {
    q.push({
      id: "cron",
      question: "Do you need scheduled tasks?",
      options: ["Every 15 minutes", "Hourly", "Daily", "Custom"],
    });
  }

  // ⭐ Multi-cloud questions
  if (hasFeature(planId, "multi_cloud")) {
    q.push({
      id: "multiCloud",
      question: "Deploy to multiple cloud providers?",
      options: ["No", "Yes — mirrored stacks", "Yes — failover"],
    });
  }

  // ⭐ Failover automation
  if (hasFeature(planId, "failover")) {
    q.push({
      id: "failover",
      question: "Do you want cross-cloud failover?",
      options: ["No", "Automatic failover", "AI-directed failover"],
    });
  }

  // ⭐ Enterprise-only compliance questions
  if (hasFeature(planId, "enterprise_builder")) {
    q.push({
      id: "compliance",
      question: "What compliance frameworks do you need?",
      options: ["SOC2", "HIPAA", "GDPR", "PCI", "FedRAMP"],
      allowMultiple: true,
    });
  }

  return q;
}

/**
 * Suggests best plan based on answers
 */
export function recommendPlan(answers: any) {
  const complexity = answers.automation?.length || 0;
  const multiCloud = answers.multiCloud;
  const budget = answers.budget;

  // Very simple logic (can evolve later)
  if (multiCloud && budget === "$2000+") return "enterprise";
  if (answers.failover === "AI-directed failover") return "enterprise";
  if (complexity > 5) return "team";
  if (complexity > 2) return "startup";
  return "developer";
}
