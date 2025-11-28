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

  const auto = plan.automation;
  const builderLevel = plan.builder;
  const ssoLevel = plan.sso;

  switch (feature) {
    case "multi_cloud":
      return plan.providers !== 1;

    case "failover":
      return auto.multi_cloud_failover === true;

    case "advanced_builder":
      return builderLevel === "advanced" || builderLevel === "enterprise" || builderLevel === "private";

    case "enterprise_builder":
      return builderLevel === "enterprise" || builderLevel === "private";

    case "sso_basic":
      return ssoLevel === "basic" || ssoLevel === "advanced" || ssoLevel === "enterprise";

    case "sso_advanced":
      return ssoLevel === "advanced" || ssoLevel === "enterprise";

    case "sso_enterprise":
      return ssoLevel === "enterprise";

    case "automations":
      return auto.ci_cd !== "basic";

    case "scheduled_tasks_hourly":
      return auto.scheduled_tasks === "hourly" || auto.scheduled_tasks === "continuous";

    case "scheduled_tasks_continuous":
      return auto.scheduled_tasks === "continuous";

    case "observability_full":
      return auto.observability === "full";

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
      question: "What cloud provider do you want to build on?",
      options: ["AWS", "Azure", "GCP", "Oracle Cloud", "DigitalOcean"],
      allowMultiple: plan.providers !== 1,
    },
    {
      question: "What is your monthly budget for cloud and automation?",
      options: ["<$25", "$25–$100", "$100–$500", "$500–$2000", "$2000+"],
    },
    {
      question: "What tasks do you want automated?",
      options: [
        "Deployments",
        "Monitoring",
        "Scaling",
        "Backups",
        "Failover",
        "CI/CD Pipelines",
        "API Automation",
        "Scheduled Jobs"
      ],
      allowMultiple: true,
    },
    {
      question: "How much ongoing maintenance do you want?",
      options: [
        "None (fully automated)",
        "Minimal (alerts + auto-remediation)",
        "Medium (we handle upgrades)",
        "High (I want full access)"
      ],
    }
  ];

  // ⭐ Upgrade questions for higher tiers
  if (hasFeature(planId, "sso_basic")) {
    q.push({
      question: "Do you want SSO enabled?",
      options: ["Email login only", "Google", "Microsoft", "Okta", "Auth0"]
    });
  }

  if (hasFeature(planId, "scheduled_tasks_hourly")) {
    q.push({
      question: "Do you need scheduled tasks (cron jobs)?",
      options: ["Every 15 minutes", "Hourly", "Daily", "Custom"]
    });
  }

  if (hasFeature(planId, "multi_cloud")) {
    q.push({
      question: "Do you want to deploy to multiple cloud providers?",
      options: ["No", "Yes — deploy identical stacks", "Yes — for failover"]
    });
  }

  if (hasFeature(planId, "failover")) {
    q.push({
      question: "Do you want cross-cloud failover automation?",
      options: ["No", "Yes — automatic failover", "Yes — AI-directed failover"]
    });
  }

  if (hasFeature(planId, "enterprise_builder")) {
    q.push({
      question: "Do you need compliance support?",
      options: ["SOC2", "HIPAA", "GDPR", "PCI", "FedRAMP"]
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

  // Very simple logic (you can make this smarter later)
  if (multiCloud && budget === "$2000+") return "enterprise";
  if (complexity > 5) return "team";
  if (complexity > 2) return "startup";
  return "developer";
}
