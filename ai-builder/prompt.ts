// ai-builder/prompt.ts

/**
 * Core AI prompt for DevVelocity's AI Builder
 * This is the "brain" that interprets answers and generates:
 *   - infrastructure plans
 *   - automation pipelines
 *   - cloud-init scripts
 *   - docker builds
 *   - provider setup templates
 *   - billing + security recommendations
 *   - maintenance tiers
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

  // ------------------------
  // 🧠 Tier-based constraints
  // ------------------------
  // Each user has a plan: developer, startup, team, enterprise
  // You restrict features based on what their plan allows.
  const plan = answers?.plan ?? "developer";

  const planCaps: any = {
    developer: {
      providers: 1,
      automation: "basic",
      security: "none",
      ai_model: "small",
      access: ["cloud-init", "basic pipelines"],
    },
    startup: {
      providers: 3,
      automation: "advanced",
      security: "basic",
      ai_model: "medium",
      access: ["cloud-init", "docker", "pipelines"],
    },
    team: {
      providers: 7,
      automation: "enterprise",
      security: "advanced",
      ai_model: "large",
      access: ["all templates", "sso options"],
    },
    enterprise: {
      providers: "unlimited",
      automation: "private",
      security: "enterprise",
      ai_model: "max",
      access: ["everything"],
    },
  };

  const caps = planCaps[plan];

  // Prevent selecting more providers than allowed
  let validatedProviders = providers;
  if (caps.providers !== "unlimited" && providers?.length > caps.providers) {
    validatedProviders = providers.slice(0, caps.providers);
  }

  // Prevent advanced automation on lower tiers
  const canUseAdvanced =
    caps.automation === "advanced" ||
    caps.automation === "enterprise" ||
    caps.automation === "private";

  const automationMode = canUseAdvanced ? automation : "basic";

  // Prevent SSO/security mismatch
  const allowedSecurity = caps.security;

  // ------------------------
  // 🧠 Create the AI system prompt
  // ------------------------

  return `
You are DevVelocity AI — a DevOps architect specializing in:

- Cloud infrastructure design
- Automation pipelines
- Auto-updating server templates
- Cloud-init generation
- Docker + NGINX + CI/CD orchestration
- Cloud provider best practices
- Serverless and VM architectures
- Managed service recommendations
- Budget-optimized DevOps planning
- Tier-aware output (feature gating)

Your job is to produce a COMPLETE infra + automation plan following the user’s answers.

---

# USER INPUT (validated)

Cloud Provider Preference:
${cloud}

Automation Goals:
${automationMode}

Selected Providers (validated for plan limits):
${JSON.stringify(validatedProviders, null, 2)}

Maintenance Preference:
${maintenance}

Budget:
${budget}

Security Requirements (tier-limited):
Requested: ${security}
Allowed: ${allowedSecurity}

Workload Type:
${buildType}

Project Description:
${project}

Plan Tier:
${plan}

Feature Caps:
${JSON.stringify(caps, null, 2)}

---

# REQUIRED OUTPUT STRUCTURE

Respond with:

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
  "next_steps": "..."
}

---

# RULES

1. **Never exceed plan tier limits**
2. **Always produce runnable code**
3. **Always optimize for user's cloud provider**
4. **When automation requested, generate CI/CD pipelines**
5. **When advanced tier, include SSO options**
6. **Make recommendations for monitoring & uptime**
7. **Output must be ready-to-build without editing**

---

# BEGIN OUTPUT
  `;
}
