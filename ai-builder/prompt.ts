/**
 * DevVelocity AI Builder — Tier-Aware Prompt Generator
 *
 * Features:
 * ✔ Tier-based limits (providers, automation level, security level)
 * ✔ Auto-limits user choices when exceeding tier
 * ✔ Friendly + professional upgrade recommendations
 * ✔ Validated, structured prompt output
 * ✔ Cloud-aware architecture instructions
 * ✔ Automation-aware pipelines
 * ✔ CI/CD + cloud-init + docker output
 */

export function buildAIPrompt(answers: Record<number, any>) {
  const {
    0: cloud,
    1: automation,
    2: providers,
    3: maintenance,
    4: budget,
    5: security,
    6: buildType,
    7: project,
  } = answers;

  // ---------------------------------------------------------
  // 🎚 PLAN + TIER RULES
  // ---------------------------------------------------------
  const plan = answers?.plan ?? "developer";

  const planCaps: any = {
    developer: {
      providers: 1,
      automation: "basic",
      security: "none",
      ai_model: "small",
      access: ["cloud-init", "basic pipelines"],
      badge: "Developer Tier",
    },
    startup: {
      providers: 3,
      automation: "advanced",
      security: "basic",
      ai_model: "medium",
      access: ["cloud-init", "docker", "pipelines"],
      badge: "Startup Tier",
    },
    team: {
      providers: 7,
      automation: "enterprise",
      security: "advanced",
      ai_model: "large",
      access: ["all templates", "sso options"],
      badge: "Team Tier",
    },
    enterprise: {
      providers: "unlimited",
      automation: "private",
      security: "enterprise",
      ai_model: "max",
      access: ["everything"],
      badge: "Enterprise Tier",
    },
  };

  const caps = planCaps[plan];

  // ---------------------------------------------------------
  // 🛑 PROVIDER LIMIT LOGIC + UPGRADE PROMPTS
  // ---------------------------------------------------------
  let validatedProviders = providers || [];
  let providerWarning = "";

  if (caps.providers !== "unlimited" && validatedProviders.length > caps.providers) {
    providerWarning = `
Your plan (${caps.badge}) allows **${caps.providers} provider(s)**.
You selected **${validatedProviders.length}**.

👉 I will automatically limit this to **${caps.providers}** to stay within your plan.
👉 Upgrade any time to unlock **full multi-cloud support**.
`;

    validatedProviders = validatedProviders.slice(0, caps.providers);
  }

  // ---------------------------------------------------------
  // 🛑 AUTOMATION LIMIT (basic/advanced/enterprise/private)
  // ---------------------------------------------------------
  let automationWarning = "";
  const canUseAdvanced =
    ["advanced", "enterprise", "private"].includes(caps.automation);

  const automationMode = canUseAdvanced ? automation : "basic";

  if (!canUseAdvanced && automation !== "basic") {
    automationWarning = `
Your plan (${caps.badge}) includes **Basic Automation**.

👉 Advanced pipelines, multi-stage CI/CD, and integration workflows  
require an upgrade to **Startup, Team, or Enterprise**.

I'll continue using **Basic Automation** for now.
`;
  }

  // ---------------------------------------------------------
  // 🛑 SECURITY / SSO LIMIT
  // ---------------------------------------------------------
  let securityWarning = "";
  const allowedSecurity = caps.security;

  if (security !== allowedSecurity && allowedSecurity !== "enterprise") {
    securityWarning = `
Your plan (${caps.badge}) includes **${allowedSecurity} security level**.

👉 Advanced SSO, identity federation, or private tenant security  
requires **Team or Enterprise**.

I'll restrict security recommendations to **${allowedSecurity}** level.
`;
  }

  // ---------------------------------------------------------
  // 📝 COMPLETE AI PROMPT (this powers the AI Builder)
  // ---------------------------------------------------------
  return `
You are **DevVelocity AI** — a world-class DevOps architect specializing in:

• Cloud infrastructure design  
• Managed service selection  
• CI/CD automation  
• cloud-init generation  
• Docker + NGINX stacks  
• Security architecture  
• Multi-cloud decision-making  
• Provider best practices  
• Tier-aware SaaS feature gating  
• Budget-optimized deployment planning  

---

# VALIDATED USER INPUT

## Cloud Provider Preference  
${cloud}

## User Automation Goals (tier-limited)  
${automationMode}

${automationWarning}

## Selected Cloud Providers (validated)  
${JSON.stringify(validatedProviders, null, 2)}

${providerWarning}

## Maintenance Preference  
${maintenance}

## Monthly Budget  
${budget}

## Security Requirements (validated)  
Requested: ${security}  
Allowed: ${allowedSecurity}  
${securityWarning}

## Build Type  
${buildType}

## Project Description  
${project}

## User Plan  
${plan} (${caps.badge})

## Feature Caps  
${JSON.stringify(caps, null, 2)}

---

# REQUIRED OUTPUT FORMAT
Respond with **valid JSON**:

{
  "summary": "...",
  "architecture": "...",
  "cloud_init": "...",
  "docker_compose": "...",
  "pipelines": {
    "provider": "...",
    "automation": "..."
  },
  "maintenance_plan": "...",
  "security_model": "...",
  "sso_recommendations": "...",
  "budget_projection": "...",
  "upgrade_recommendations": "...",
  "next_steps": "..."
}

---

# RULES

1. Always stay within the user's plan limits.  
2. If a feature is above their tier, **recommend an upgrade** — but continue with limited output.  
3. Always generate runnable cloud-init / Docker / pipeline code.  
4. Optimize plans based on cloud provider preference.  
5. For enterprise tier, unlock **everything** (no limits).  
6. Mention limitations only when necessary.  
7. Be helpful, friendly, and professional.  

---

# BEGIN OUTPUT (JSON ONLY)
  `;
}
