// ai-builder/schema.ts

/**
 * DevVelocity AI Builder — Question Schema
 *
 * Drives:
 *  - AI prompt generation
 *  - UI wizard form flow
 *  - Tier-aware restrictions
 *  - Validation (providers, automation, security)
 *  - Upgrade prompts
 */

export const AI_BUILDER_QUESTIONS = [
  {
    id: 0,
    key: "cloud",
    label: "Which cloud provider would you prefer?",
    type: "select",
    required: true,
    options: [
      "AWS",
      "Azure",
      "Google Cloud",
      "Oracle Cloud",
      "DigitalOcean",
      "No Preference",
    ],
  },

  {
    id: 1,
    key: "automation",
    label: "What level of automation are you looking for?",
    type: "select",
    required: true,
    options: [
      "basic",
      "advanced",
      "enterprise",
    ],
    tier_restrictions: {
      developer: ["basic"],
      startup: ["basic", "advanced"],
      team: ["basic", "advanced", "enterprise"],
      enterprise: ["basic", "advanced", "enterprise"],
    },
  },

  {
    id: 2,
    key: "providers",
    label: "Which cloud providers do you want included?",
    type: "multi-select",
    required: true,
    options: [
      "AWS",
      "Azure",
      "Google Cloud",
      "Oracle Cloud",
      "DigitalOcean",
    ],
    limit_by_plan: true,
  },

  {
    id: 3,
    key: "maintenance",
    label: "What is your preferred maintenance level?",
    type: "select",
    required: true,
    options: [
      "minimal",
      "balanced",
      "high-uptime",
      "fully-managed",
    ],
  },

  {
    id: 4,
    key: "budget",
    label: "What is your approximate monthly budget?",
    type: "number",
    required: true,
    placeholder: "Example: 75",
    upgrade_warning: true,
  },

  {
    id: 5,
    key: "security",
    label: "How strong are your security/SSO requirements?",
    type: "select",
    required: true,
    options: [
      "none",
      "basic",
      "advanced",
      "sso-required",
      "enterprise-security",
    ],
    tier_security_mapping: {
      developer: "none",
      startup: "basic",
      team: "advanced",
      enterprise: "enterprise-security",
    }
  },

  {
    id: 6,
    key: "buildType",
    label: "What type of infrastructure are you building?",
    type: "select",
    required: true,
    options: [
      "web app",
      "api backend",
      "serverless app",
      "dockerized microservices",
      "database cluster",
      "CI/CD automation system",
      "hybrid architecture",
    ],
  },

  {
    id: 7,
    key: "project",
    label: "Describe your project (the more detail the better)",
    type: "textarea",
    required: true,
    placeholder: "Example: A microservice API with automated deployments...",
  },
];

/**
 * Tier caps (mirrors plan-logic.ts)
 * Used to enforce limits during the wizard step flow
 */

export const PLAN_CAPS = {
  developer: {
    max_providers: 1,
    max_automation: "basic",
    max_security: "none",
    sso: false,
  },
  startup: {
    max_providers: 3,
    max_automation: "advanced",
    max_security: "basic",
    sso: true,
  },
  team: {
    max_providers: 7,
    max_automation: "enterprise",
    max_security: "advanced",
    sso: true,
  },
  enterprise: {
    max_providers: "unlimited",
    max_automation: "enterprise",
    max_security: "enterprise-security",
    sso: true,
  },
};


/**
 * Utility for validating per-tier restrictions
 */
export function validateTierInput(plan: string, answers: any) {
  const caps = PLAN_CAPS[plan];
  const warnings: string[] = [];

  // Provider cap
  if (
    caps.max_providers !== "unlimited" &&
    answers[2]?.length > caps.max_providers
  ) {
    warnings.push(
      `Your plan (${plan}) allows ${caps.max_providers} provider(s). You selected ${answers[2].length}.`
    );
  }

  // Automation cap
  if (answers[1] !== caps.max_automation && caps.max_automation === "basic") {
    warnings.push(
      `Advanced automation is not available on the ${plan} plan.`
    );
  }

  // Security cap
  if (answers[5] !== caps.max_security) {
    warnings.push(
      `Requested security (${answers[5]}) exceeds your plan’s security level (${caps.max_security}).`
    );
  }

  return warnings;
}
