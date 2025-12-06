// server/ai/prompt.ts

/**
 * DevVelocity AI — Prompt Generator
 * -------------------------------------------------------
 * Generates unified prompts for:
 *  - AI Builder
 *  - Upgrade Engine
 *  - Provider-aware output
 *  - Budget + Experience tiers
 *  - Cron-scraped provider metadata
 */

import { getPlan } from "@/ai-builder/plan-logic";
import { loadProviderDocs } from "@/server/providers/loader";

export async function buildAIPrompt(answers: any) {
  const {
    provider,
    budget,
    experience,
    environment,
    region,
    features,
    plan: planId = "developer",
  } = answers;

  const plan = getPlan(planId);

  // Load enriched provider docs (from cron scraper)
  const providerDocs = await loadProviderDocs(provider);

  return `
You are DevVelocity AI (GPT-5.1-Pro). 
Generate a complete infrastructure blueprint optimized for:

• Provider: ${provider}
• Region: ${region || "auto-select best"}
• Environment: ${environment || "production"}
• Budget level: ${budget}
• User experience: ${experience}
• Plan tier: ${plan.name} (${planId})
• Included features: ${JSON.stringify(features || [])}

-------------------------
PLAN LIMITATIONS
-------------------------
• Providers allowed: ${plan.providers}
• Auto-update frequency: ${plan.updates}
• Builder mode: ${plan.builder}
• SSO: ${plan.sso}
• Build minutes: ${plan.limits.build_minutes}
• Pipelines: ${plan.limits.pipelines}
• API calls: ${plan.limits.api_calls}

-------------------------
PROVIDER DOCUMENTATION
-------------------------
Use ONLY the capabilities listed below.  
This includes scraped docs from the cron system:

${providerDocs}

-------------------------
OUTPUT REQUIREMENTS
-------------------------
Return JSON EXACTLY in this shape:

{
  "infrastructure": {
    "services": [...],
    "networking": {...},
    "security": {...},
    "compute": {...},
    "storage": {...},
    "databases": [...],
    "ci_cd": {...},
    "monitoring": {...}
  },
  "generated_files": {
    "cloud_init": "...",
    "terraform": "...",
    "dockerfile": "...",
    "kubernetes": "...",
    "policy_documents": "..."
  },
  "explanations": {
    "rationale": "...",
    "tradeoffs": "...",
    "plan_restrictions": "..."
  }
}

Use valid JSON. No markdown. No commentary.
If requested features exceed the plan tier, describe restrictions
in "plan_restrictions".
`;
}
