// server/ai/prompt.ts

/**
 * DevVelocity AI Prompt System
 * -------------------------------------------------------
 * Shared between:
 *   ✓ Builder Engine (new infra generation)
 *   ✓ Upgrade Engine (existing file upgrades)
 *
 * Ensures:
 *   ✓ Strict JSON output
 *   ✓ Tier-aware capabilities
 *   ✓ Predictable formatting for parsing
 */

import { getPlan } from "@/ai-builder/plan-logic";

/* -----------------------------------------------------
   1. BUILD PROMPT — For new infrastructure generation
------------------------------------------------------ */
export function buildAIPrompt(answers: any) {
  const {
    provider,
    experience,
    budget,
    environment,
    region,
    features,
    plan = "developer",
  } = answers;

  const planMeta = getPlan(plan);

  return `
You are DevVelocity — an autonomous cloud architecture generator.

### GOAL
Generate a complete infrastructure plan for the user based on their inputs.

### USER INPUT
Provider: ${provider}
Experience Level: ${experience}
Budget: ${budget}
Environment: ${environment}
Region: ${region}
Features Requested: ${JSON.stringify(features, null, 2)}

### PLAN TIER
User Plan: ${planMeta.name}
Tier Limitations:
- Max providers: ${planMeta.providers}
- Auto updates: ${planMeta.updates}
- Template Builder: ${planMeta.builder}
- SSO Level: ${planMeta.sso}
- Build minutes/month: ${planMeta.limits.build_minutes}
- Pipelines/month: ${planMeta.limits.pipelines}
- API calls/month: ${planMeta.limits.api_calls}

### OUTPUT REQUIREMENTS
Return ONLY valid JSON matching this schema:

{
  "architecture": {
    "provider": "aws|azure|gcp|cloudflare|supabase|oracle",
    "services": [],
    "deployment": {},
    "security": {},
    "networking": {},
    "scaling": {},
    "monitoring": {},
    "cost_optimization": {}
  },
  "features": {
    "multiCloud": boolean,
    "multiCloudFailover": boolean,
    "enterpriseSSO": boolean
  },
  "exceedsPlan": false
}

### IMPORTANT RULES
1. NO commentary, NO markdown, ONLY JSON.
2. If the user requests features outside their tier:
   - Set "exceedsPlan": true
   - Include "features" describing the violations
3. Use 2025 cloud best practices.
4. Avoid legacy services.
5. Produce clean, minimal, predictable JSON.

Generate the architecture JSON now.
`;
}

/* -----------------------------------------------------
   2. UPGRADE PROMPT — For updating old architecture files
------------------------------------------------------ */
export function buildUpgradePrompt(existingFile: any, plan: string) {
  const planMeta = getPlan(plan);

  return `
You are DevVelocity — an automated infrastructure upgrader.

### GOAL
Upgrade the user's existing architecture JSON to match the latest
2025 DevVelocity schema and best practices.

### USER PLAN
Plan: ${planMeta.name}
Provider Limit: ${planMeta.providers}
Builder Level: ${planMeta.builder}
Compliance: ${planMeta.automation.compliance}

### EXISTING FILE
${JSON.stringify(existingFile, null, 2)}

### INSTRUCTIONS
1. Upgrade schemas.
2. Replace deprecated fields.
3. Normalize provider-specific structures.
4. Remove unsupported features based on plan tier.
5. If the file includes features ABOVE the user's tier:
   - Preserve the structure but mark them clearly inside
     "upgradeRecommendations".
6. DO NOT include explanations. DO NOT include markdown.

### OUTPUT FORMAT
Return ONLY valid JSON matching this schema:

{
  "upgraded": {
    "architecture": { ... },
    "features": { ... }
  },
  "upgradeRecommendations": [],
  "exceedsPlan": false
}

### IMPORTANT
- Never output text outside JSON.
- Ensure JSON is fully parseable.
- Use only 2025 DevVelocity-standard fields.

Return the upgraded JSON now.
`;
}
