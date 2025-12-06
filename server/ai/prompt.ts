// server/ai/prompt.ts

/**
 * DevVelocity AI Prompt Engine
 * ----------------------------------------------------------
 * Generates:
 *  ✓ Builder prompt (new infrastructure generation)
 *  ✓ Upgrade prompt (fix + modernize existing files)
 * 
 * Tier-aware:
 *  - Limits outputs based on plan tier
 *  - Ensures AI respects pricing.json capabilities
 */

import pricingData from "@/marketing/pricing.json";

/**
 * Get plan details from pricing.json
 */
function getPlanInfo(planId: string) {
  return pricingData.plans.find((p) => p.id === planId) ?? null;
}

/**
 * ----------------------------------------------------------
 * BUILDER PROMPT — generate brand new multi-cloud architectures
 * ----------------------------------------------------------
 */
export function buildAIPrompt(answers: any) {
  const {
    provider,
    budget,
    experience,
    environment,
    region,
    features = [],
    plan = "developer",
  } = answers;

  const planInfo = getPlanInfo(plan);

  const allowedProviders =
    typeof planInfo.providers === "number"
      ? planInfo.providers
      : "unlimited";

  return `
You are DevVelocity, an autonomous infrastructure architect.

Your task:
Generate a complete infrastructure plan based on the user’s answers.

User Inputs:
- Provider: ${provider}
- Budget: ${budget}
- Experience: ${experience}
- Environment: ${environment}
- Region: ${region}
- Features: ${features.join(", ") || "none"}
- Plan Tier: ${plan}
- Allowed Providers: ${allowedProviders}

Business Rules:
1. NEVER exceed the user's plan tier.
2. Provider count MUST NOT exceed: ${allowedProviders}
3. Forbidden features for this tier:
   - If tier = developer → no autoscaling, no enterprise SSO, no multi-cloud failover
   - If tier = startup → no enterprise SSO, no private builders
   - If tier = team → cannot use enterprise-only compliance or SCIM
4. Your output must ALWAYS include:
   {
     "architecture": {
       "providers": {
         "aws" | "azure" | "gcp" | "cloudflare" | ...
       },
       "features": [],
       "services": { ... }
     },
     "estimated_build_minutes": number,
     "estimated_api_calls": number,
     "estimated_pipelines": number
   }

5. Your output MUST be valid JSON. No commentary.

6. Output ONLY the JSON — no extra explanations.

Begin now.
  `;
}

/**
 * ----------------------------------------------------------
 * UPGRADE PROMPT — clean, modernize, and fix old architecture
 * ----------------------------------------------------------
 */
export function buildUpgradePrompt(oldFile: any, plan: string) {
  const planInfo = getPlanInfo(plan);

  const allowedProviders =
    typeof planInfo.providers === "number"
      ? planInfo.providers
      : "unlimited";

  return `
You are DevVelocity AI — the autonomous upgrade engine.

Your task:
Upgrade, repair, normalize, and modernize the user's architecture file.

Plan Tier: ${plan}
Allowed Providers: ${allowedProviders}

Rules:
1. DO NOT add features beyond the plan tier.
2. DO NOT introduce multi-cloud if not allowed.
3. DO NOT enable autoscaling unless the plan includes it.
4. Remove any deprecated fields.
5. Ensure compatibility with DevVelocity's 2025 JSON schema.

User File to Upgrade:
${JSON.stringify(oldFile, null, 2)}

Output Format:
{
  "upgraded": { ...clean JSON... }
}

The output MUST be strictly valid JSON with no extra text.
  `;
}
