/**
 * DevVelocity AI Prompt Engine (Full Version)
 * ------------------------------------------------------------
 * This engine builds a high-accuracy prompt for the AI Builder.
 * Features:
 *  - Multi-cloud awareness
 *  - Budget → infra mapping
 *  - Experience-level tuning
 *  - Region considerations
 *  - Feature → component expansion
 *  - Tier-based constraints
 *  - Hooks for documentation scraping subsystem
 */

import { getPlan } from "@/ai-builder/plan-logic";
import { PROVIDER_DEFAULTS } from "@/constants/provider-defaults";
import { FEATURE_MAP } from "@/constants/feature-map";

export function buildAIPrompt(answers: any) {
  const {
    provider,
    budget,
    experience,
    environment,
    region,
    features = [],
    plan = "developer",
    scrapedDocs = null,   // auto-filled by cron scraper later
  } = answers;

  const planInfo = getPlan(plan);

  // ---------------------------
  // Provider Expansion Logic
  // ---------------------------
  const providerDefaults = PROVIDER_DEFAULTS[provider] ?? {};
  const expandedFeatures = expandFeatures(features);

  // ---------------------------
  // Tier Enforcement
  // ---------------------------
  const tierInstructions = buildTierConstraints(plan);

  // ---------------------------
  // Scraper Documentation Injection
  // ---------------------------
  const docInjection = scrapedDocs
    ? `
The following are the most recent authoritative provider docs:
${scrapedDocs.slice(0, 8000)}
(Only reference these docs when constructing examples, naming conventions, and infra definitions.)
`
    : `
No scraped documentation available. Use safest known defaults.
`;

  // ---------------------------
  // Experience Level Mapping
  // ---------------------------
  const experienceInstructions = {
    beginner: `
User is inexperienced. Favor managed services, higher-level abstractions,
minimal YAML, and zero manual scaling. Avoid complexity.
`,
    intermediate: `
User has moderate experience. Use a balanced design with managed components,
but include optional customization parameters.
`,
    expert: `
User is advanced. Include tunable configs, scalable architectures,
and deeper infra surfaces.
`,
  }[experience] ?? "";

  // ---------------------------
  // Budget Mapping
  // ---------------------------
  const budgetMap = {
    low: `
Budget priority: Minimize cost. Use serverless, autoscaling, and minimal baseline infra.
Avoid multi-zone deployments unless required.
`,
    medium: `
Balanced cost/performance. Use a combination of serverless + container-based compute.
`,
    high: `
Cost is not a concern. Favor high availability, multi-zone,
dedicated compute, and resilient patterns.
`,
  }[budget] ?? "";

  // ---------------------------
  // Main Prompt Body
  // ---------------------------
  return `
You are DevVelocity — an autonomous infrastructure architect.
Your job is to generate complete, production-ready infrastructure outputs.

User Inputs
-----------
Provider: ${provider}
Budget: ${budget}
Experience: ${experience}
Environment: ${environment}
Region: ${region}
Requested Features: ${features.join(", ") || "None"}
Expanded Feature Set: ${expandedFeatures.join(", ")}
Tier: ${plan}

Tier Rules
----------
${tierInstructions}

Provider Knowledge
------------------
${JSON.stringify(providerDefaults, null, 2)}

Budget Constraints
------------------
${budgetMap}

Experience Constraints
----------------------
${experienceInstructions}

Documentation (Scraped)
-----------------------
${docInjection}

Output Requirements
-------------------
Produce a single JSON object with the following fields:

{
  "architecture": {
     "provider": "...",
     "region": "...",
     "components": [...detailed infra...]
  },
  "configs": {
    "cloud_init": "...",
    "terraform": "...",
    "docker": "...",
    "kubernetes": "...(if applicable)"
  },
  "policies": {
    "iam": [...],
    "network": [...],
    "scaling": [...]
  },
  "explanation": "Short explanation of design choices based on tier, budget, & experience."
}

Constraints:
- NEVER fabricate services that do not exist.
- Use real provider naming.
- Follow scraped documentation EXACTLY when available.
- Developer = simplest output.
- Startup = advanced but safe.
- Team = production-grade.
- Enterprise = zero-downtime, multi-cloud optional.

Begin now.
`;
}

// ------------------------------------------------------------
// Feature Expansion
// ------------------------------------------------------------
function expandFeatures(features: string[]) {
  let expanded: string[] = [];

  for (const f of features) {
    if (FEATURE_MAP[f]) expanded.push(...FEATURE_MAP[f]);
    else expanded.push(f);
  }

  return [...new Set(expanded)];
}

// ------------------------------------------------------------
// Tier Constraints
// ------------------------------------------------------------
function buildTierConstraints(plan: string) {
  switch (plan) {
    case "developer":
      return `
Developer Tier Rules:
- Simple architectures only.
- No multi-cloud.
- No advanced HA patterns.
- No complex resilience systems.
`;

    case "startup":
      return `
Startup Tier Rules:
- High-level production architecture.
- Single provider only.
- Optional autoscaling.
`;

    case "team":
      return `
Team Tier Rules:
- Production-grade infra.
- Optional hybrid patterns.
- Advanced monitoring.
- CI/CD expected.
`;

    case "enterprise":
      return `
Enterprise Tier Rules:
- Zero downtime.
- Multi-cloud failover allowed.
- Highly detailed IAM + policies.
- Can use advanced distributed systems.
`;
  }
}
