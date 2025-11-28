/**
 * DevVelocity AI Builder — Master Prompt
 *
 * This is the system-level prompt that generates:
 *  - infra architecture
 *  - cloud-init
 *  - docker-compose
 *  - pipelines
 *  - automation
 *  - SSO/security
 *  - budget breakdown
 *  - maintenance recommendations
 *  - upgrade suggestions
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

  // -------------------------------------------
  // 🧠 Tier-based Constraints & Feature Gating
  // -------------------------------------------

  const plan = answers?.plan ?? "developer";

  const planCaps: any = {
    developer: {
      providers: 1,
      automation: "basic",
      security: "none",
      ai_model: "small",
      access: ["cloud-init", "basic pipelines"],
      sso: false,
      upgrade: "startup",
    },

    startup: {
      providers: 3,
      automation: "advanced",
      security: "basic",
      ai_model: "medium",
      access: ["cloud-init", "docker", "pipelines"],
      sso: true,
      upgrade: "team",
    },

    team: {
      providers: 7,
      automation: "enterprise",
      security: "advanced",
      ai_model: "large",
      access: ["all templates", "advanced sso"],
      sso: true,
      upgrade: "enterprise",
    },

    enterprise: {
      providers: "unlimited",
      automation: "private",
      security: "enterprise",
      ai_model: "max",
      access: ["everything"],
      sso: true,
    },
  };

  const caps = planCaps[plan];

  // -------------------------------------------
  // 🧩 Provider Limits
  // -------------------------------------------

  let validatedProviders = providers;

  if (caps.providers !== "unlimited") {
    if (providers?.length > caps.providers) {
      validatedProviders = providers.slice(0, caps.providers);
    }
  }

  // -------------------------------------------
  // 🧩 Automation Limits
  // -------------------------------------------

  const canUseAdvanced =
    caps.automation === "advanced" ||
    caps.automation === "enterprise" ||
    caps.automation === "private";

  const automationMode = canUseAdvanced ? automation : "basic";

  // -------------------------------------------
  // 🧩 Security Limits
  // -------------------------------------------

  const allowedSecurity = caps.security;

  // -------------------------------------------
  // 🧩 Upgrade Suggestions (Brain Layer)
  // -------------------------------------------

  const upgradeHints = [];

  if (providers?.length > caps.providers && caps.providers !== "unlimited") {
    upgradeHints.push(
      `You selected ${providers.length} cloud providers, but your plan only allows ${caps.providers}. Upgrade to ${caps.upgrade} to unlock more providers.`
    );
  }

  if (automation !== "basic" && caps.automation === "basic") {
    upgradeHints.push(
      `Advanced automation is restricted on the ${plan} plan. Upgrade to ${caps.upgrade} for enterprise-grade automation.`
    );
  }

  if (security !== allowedSecurity) {
    upgradeHints.push(
      `Requested security level (${security}) is above your plan’s allowed level (${allowedSecurity}). Upgrade to ${caps.upgrade} for additional security models.`
    );
  }

  if (!caps.sso && security?.includes("sso")) {
    upgradeHints.push(
      `SSO is unavailable on the ${plan} plan. Upgrade to Startup or higher to unlock SSO.`
    );
  }

  if (budget < 20 && plan !== "developer") {
    upgradeHints.push(
      `Your budget is too low for the selected plan. Consider Developer, or increase budget for better infra.`
    );
  }

  // -------------------------------------------
  // 🧠 Final System Prompt
  // -------------------------------------------

  return `
You are DevVelocity AI — an elite DevOps architect specializing in:

- Multi-cloud infrastructure
- High-uptime architectures
- Automated pipelines
- Cloud-init provisioning
- Docker orchestration
- Serverless & VM hybrid deployments
- Cost optimization
- Security + SSO strategies
- Tier-limited feature generation
- Smart upsells that increase revenue

You must generate a complete, production-ready DevOps plan based on the user’s responses AND their subscription tier.

You must apply ALL tier restrictions AND produce upgrade suggestions where appropriate.

---

# USER INPUT (Tier-Validated)

Cloud Provider Preference:
${cloud}

Automation Goals (tier-adjusted):
${automationMode}

Selected Providers (validated):
${JSON.stringify(validatedProviders, null, 2)}

Maintenance Preference:
${maintenance}

Budget:
${budget}

Security Requirements:
Requested: ${security}
Allowed by Tier: ${allowedSecurity}

Workload Type:
${buildType}

Project Description:
${project}

Plan Tier:
${plan}

Tier Feature Caps (Hard Enforced):
${JSON.stringify(caps, null, 2)}

Upgrade Suggestions (Generate More Based on Output Needs):
${upgradeHints.join("\n")}

---

# REQUIRED OUTPUT FORMAT (JSON)

Respond EXACTLY in this format:

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
  "sso_recommendations": "...",
  "security_model": "...",
  "budget_projection": "...",
  "upgrade_paths": "...",
  "next_steps": "..."
}

---

# RULES

1. **NEVER generate features the user’s plan does not allow.**
2. **ALWAYS recommend an upgrade if their needs exceed their plan.**
3. **ALWAYS generate runnable code with no placeholders.**
4. **ALWAYS optimize for chosen cloud provider.**
5. **ALWAYS consider automation goals + maintenance level.**
6. **ALWAYS provide security model appropriate to tier.**
7. **ALWAYS produce a complete deployment-ready solution.**

---

# BEGIN OUTPUT NOW
`;
}
