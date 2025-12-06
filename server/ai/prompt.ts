// server/ai/prompt.ts

/**
 * DevVelocity AI Prompt Generator
 * ----------------------------------------------------------
 * Builds all AI instructions dynamically:
 *  ✓ Plan-aware limits
 *  ✓ Provider constraints
 *  ✓ Experience-based simplification
 *  ✓ Environment logic (prod/dev/test)
 *  ✓ Region hints
 *  ✓ Auto-documentation ingestion from scraper
 *  ✓ Ensures output is ALWAYS valid JSON (critical)
 */

import { getPlan } from "@/ai-builder/plan-logic";

export function buildAIPrompt(answers: any) {
  const {
    provider,
    budget,
    experience,
    environment,
    region,
    features,
    scrapedDocs,
    plan = "developer",
  } = answers;

  const planData = getPlan(plan);

  // -------------------------
  // EXPERIENCE LEVEL
  // -------------------------
  const experienceInstruction =
    experience === "beginner"
      ? "Use simple patterns and avoid advanced abstractions. Provide brief explanations."
      : experience === "intermediate"
      ? "Use balanced complexity. Avoid unnecessary abstractions."
      : "Use professional-grade architecture with optimizations.";

  // -------------------------
  // ENVIRONMENT
  // -------------------------
  const envHint = environment
    ? `The target environment is **${environment}**. Adjust settings accordingly (e.g., dev speeds up, prod is hardened).`
    : "";

  // -------------------------
  // REGION
  // -------------------------
  const regionHint = region
    ? `Target region: **${region}**.`
    : "";

  // -------------------------
  // SCRAPED DOCUMENTATION
  // (from cron provider ingest engine)
  // -------------------------
  const docHint = scrapedDocs
    ? `Here is live documentation for the requested provider(s). Use these as primary references:\n${scrapedDocs}`
    : "No scraped documentation provided.";

  // -------------------------
  // FEATURE FLAGS
  // -------------------------
  const featureHint = features && features.length > 0
    ? `Requested features: ${features.join(", ")}.`
    : "No extra features requested.";

  // -------------------------
  // PLAN LIMITS
  // (Drives upgrade engine and output gating)
  // -------------------------
  const planConstraints = `
The user's current plan is **${planData.name}**.

Plan Constraints:
- Max providers allowed: ${planData.providers}
- Auto-update frequency: ${planData.updates}
- Builder capability: ${planData.builder}
- SSO: ${planData.sso}
- Compliance level: ${planData.automation.compliance}
- Scaling type: ${planData.automation.scaling}
- CI/CD automation: ${planData.automation.ci_cd}

Do NOT produce architecture that violates these plan limits.
If the request naturally requires higher-tier features, still describe them, but label them as:
"requires_upgrade": true
and specify which tier is required.
`;

  // -------------------------
  // FINAL PROMPT
  // (Strict JSON output)
  // -------------------------
  return `
You are the DevVelocity Autonomous Infrastructure Builder.

Your job is to generate a COMPLETE cloud architecture JSON object that follows the user's plan rules, desired provider, experience level, and requested features.

${experienceInstruction}
${envHint}
${regionHint}
${featureHint}

${planConstraints}

${docHint}

Your output MUST be valid JSON and follow exactly this shape:

{
  "architecture": {
    "provider": "string",
    "resources": [...],
    "networking": {...},
    "security": {...},
    "scaling": "none | rules | autoscale | ai_autoscale",
    "compliance": "none | basic | enhanced | enterprise",
    "features": ["multi_cloud_failover", "zero_downtime_deployments", ...],
    "estimatedBuildMinutes": number
  }
}

Rules:
1. **No markdown**, no text outside JSON.
2. Include estimated build minutes based on complexity.
3. Apply plan limits.
4. Use scraped documentation provided above.
5. If user request exceeds limits, set:
   "requires_upgrade": true
   "upgrade_needed_for": "team | enterprise | startup"
6. Never hallucinate APIs — only use real, scraped docs.

Now generate the JSON architecture for the following request:

Provider: ${provider}
Budget: ${budget}
User Experience: ${experience}
Environment: ${environment}
Region: ${region}
Features: ${JSON.stringify(features ?? [])}

Return ONLY the JSON object.
  `;
}
