/**
 * DevVelocity — AI Prompt Generator Layer
 * -----------------------------------------------------------
 * Centralized prompt builder for:
 *  ✓ Infrastructure Generation (AI Builder)
 *  ✓ Legacy File Upgrade
 *  ✓ Provider Recommendation / Initial Guidance
 *
 * All prompts are tier-aware and cloud-agnostic.
 */

import pricing from "../../marketing/pricing.json";

/* -----------------------------------------------------------
   1. AI BUILDER PROMPT (primary generation prompt)
----------------------------------------------------------- */
export function buildAIPrompt(answers: any) {
  const plan = answers.plan ?? "developer";

  return `
You are DevVelocity — an autonomous cloud architecture generator.

USER PLAN: ${plan.toUpperCase()}
BUILD CONTEXT:
${JSON.stringify(answers, null, 2)}

Your task:
1. Generate a complete infrastructure plan based on the answers.
2. Output JSON ONLY — no commentary.
3. Structure the output as:

{
  "providers": [...],         
  "environment": "...",
  "region": "...",
  "services": {
    "compute": [...],
    "databases": [...],
    "networking": [...],
    "storage": [...],
    "monitoring": [...],
    "security": [...]
  },
  "cost_estimate": {
    "monthly": <number>,
    "breakdown": {
      ...
    }
  },
  "features": [...],
  "scaling": {
    "method": "...",
    "details": { ... }
  },
  "notes": "..."
}

Rules:
- Stay within capabilities of the ${plan} plan.
- If asked for features outside the plan (multi-cloud failover, enterprise SSO, advanced scaling), include them anyway but clearly flag them in "features".
- Use realistic cloud-native components.
- DO NOT use placeholders — always fill fields completely.
- Respond with valid JSON only.
  `;
}

/* -----------------------------------------------------------
   2. UPGRADE PROMPT
   Converts old JSON → new DevVelocity-compliant schema
----------------------------------------------------------- */
export function buildUpgradePrompt(oldFile: any, plan: string) {
  const planInfo = pricing.plans.find((p) => p.id === plan);

  return `
You are DevVelocity's Automated Upgrade System.

Task:
Upgrade the provided infrastructure JSON file to match the latest DevVelocity schema.

Existing File:
${JSON.stringify(oldFile, null, 2)}

User Plan: ${plan.toUpperCase()}
Allowed Providers: ${planInfo?.providers ?? "unknown"}

Upgrade Requirements:
- Fix deprecated fields.
- Add missing fields.
- Normalize compute/storage/networking blocks.
- Preserve user intent.
- If the file contains features ABOVE their plan tier, keep them BUT add a "requiresUpgrade": true flag.
- If the file is invalid JSON, repair it.
- Output valid JSON only.

Final Output Format:
{
  "upgraded": { ... },
  "notes": "...",
  "requiresUpgrade": true | false
}

Respond with JSON ONLY.
  `;
}

/* -----------------------------------------------------------
   3. RECOMMENDATION PROMPT
   Provider → features → best practices
----------------------------------------------------------- */
export function buildRecommendationPrompt(inputs: any) {
  return `
You are DevVelocity — a cloud provider recommendation engine.

User Inputs:
${JSON.stringify(inputs, null, 2)}

Task:
Recommend:
- Best provider(s)
- Most cost-effective architecture
- Risk factors
- Deployment strategy

Response Format:
{
  "recommended_providers": [...],
  "reasoning": "...",
  "suggested_architecture": { ... },
  "cost_tier": "low" | "medium" | "high",
  "notes": "..."
}

Return JSON ONLY.
  `;
}
