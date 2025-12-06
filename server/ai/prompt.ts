// server/ai/prompt.ts

/**
 * DevVelocity AI — Prompt Builder Engine
 * --------------------------------------------------------------
 * Creates the system/user prompts for:
 *  ✓ Infrastructure Builder
 *  ✓ Cron-Scraped Provider-Aware Builder
 *  ✓ File Upgrade Engine
 *
 * The prompt system guarantees:
 *  - Plan-aware restrictions
 *  - Deterministic JSON output
 *  - No hallucinated providers
 *  - No over-tier recommendations
 *  - Single-source provider scraping integration
 */

import { getPlan } from "@/ai-builder/plan-logic";
import { loadProviderDocs } from "@/server/scraper/provider-loader";

//
// 1. AI BUILDER PROMPT
//
export function buildAIPrompt(answers: any) {
  const {
    provider,
    budget,
    experience,
    environment,
    region,
    features,
    org_id,
    plan,
  } = answers;

  const planDetails = getPlan(plan ?? "developer");

  return `
You are DevVelocity AI Builder — an autonomous cloud architecture engine.

Your task:
1. Create a fully valid JSON infrastructure plan.
2. Follow DevVelocity’s internal schema exactly.
3. Enforce the user's plan tier (“${planDetails.id}”) — DO NOT exceed capabilities.
4. Output ONLY valid JSON — no markdown, no explanations.
5. Use the most recent provider documentation provided via cron scraping.

User Inputs:
- Provider: ${provider}
- Budget: ${budget}
- Experience: ${experience}
- Environment: ${environment}
- Region: ${region}
- Features: ${JSON.stringify(features ?? [], null, 2)}
- Plan Tier: ${planDetails.id}

Plan Tier Constraints:
- Max Providers: ${planDetails.providers}
- Auto Updates: ${planDetails.updates}
- Builder Mode: ${planDetails.builder}
- SSO Level: ${planDetails.sso}
- Limits: ${JSON.stringify(planDetails.limits)}
- Metered: ${JSON.stringify(planDetails.metered)}

Required Output JSON Structure:
{
  "provider": string,
  "region": string,
  "services": [],
  "network": {},
  "security": {},
  "compute": {},
  "storage": {},
  "databases": {},
  "monitoring": {},
  "ci_cd": {},
  "scaling": {},
  "failover": {},
  "estimated_costs": {}
}

Rules:
- Follow provider best practices.
- Never return unsupported enterprise features on lower plans.
- Do not hallucinate services — only use documented provider capabilities.
- If a field is unknown, set it to null — do NOT invent values.
  `;
}

//
// 2. UPGRADE ENGINE PROMPT
//
export function buildUpgradePrompt(oldFile: any, planId: string) {
  const planDetails = getPlan(planId);

  return `
You are DevVelocity Upgrade Engine.

Your job:
1. Analyze the user's outdated architecture JSON.
2. Modernize it to DevVelocity's latest schema.
3. Fix deprecated keys.
4. Align the file to the user's plan tier (${planDetails.id}) — do NOT exceed limitations.
5. Keep everything strictly valid JSON.
6. Never add enterprise features to non-enterprise tiers.
7. Never add providers beyond the allowed count.

User Plan Details:
${JSON.stringify(planDetails, null, 2)}

Old File:
${JSON.stringify(oldFile, null, 2)}

Output:
- ONLY valid JSON matching the newest DevVelocity architecture model.
- Use null when data is missing instead of inventing values.

Do NOT include explanations.
  `;
}

//
// 3. PROVIDER SCRAPER CONTEXT PROMPT
//
export async function buildProviderContextPrompt(providerId: string) {
  const docs = await loadProviderDocs(providerId);

  return `
You are DevVelocity Provider Intelligence Module.

You will receive the user's builder request along with ALL scraped provider documentation.

Use ONLY these sources when describing provider capabilities — do NOT hallucinate.

Provider: ${providerId}

Scraped Documentation:
${docs}

Rules:
- If documentation lacks an answer, say “unknown” or leave null.
- Never create fake services.
  `;
}
