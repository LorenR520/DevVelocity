/**
 * DevVelocity AI Builder — Master Prompt (Full Version)
 *
 * Generates:
 *  - cloud architecture
 *  - VPC + networking design
 *  - automation pipelines
 *  - cloud-init
 *  - docker orchestration
 *  - CI/CD
 *  - SSO + security
 *  - cost optimizations
 *  - upgrade suggestions
 *  - file portal recommendations
 *  - developer experience flow
 */

export function buildAIPrompt(answers: Record<number, any>) {
  const {
    cloud,
    automation,
    providers,
    maintenance,
    budget,
    security,
    buildType,
    project,
    networking,
  } = answers;

  // The user’s paid plan
  const plan = answers?.plan ?? "developer";

  // -------------------------------------------
  // 🧠 Tier feature matrix
  // -------------------------------------------

  const planCaps: any = {
    developer: {
      providers: 1,
      automation: "basic",
      security: "none",
      ai_model: "small",
      networking: "basic",
      filePortal: false,
      sso: false,
      upgrade: "startup",
    },

    startup: {
      providers: 3,
      automation: "advanced",
      security: "basic",
      ai_model: "medium",
      networking: "enhanced",
      filePortal: true,
      sso: true,
      upgrade: "team",
    },

    team: {
      providers: 7,
      automation: "enterprise",
      security: "advanced",
      ai_model: "large",
      networking: "enterprise",
      filePortal: true,
      sso: true,
      upgrade: "enterprise",
    },

    enterprise: {
      providers: "unlimited",
      automation: "private",
      security: "enterprise",
      ai_model: "max",
      networking: "global",
      filePortal: true,
      sso: true,
    },
  };

  const caps = planCaps[plan];

  // -------------------------------------------
  // 🛑 Provider Limits
  // -------------------------------------------

  let validatedProviders = providers;

  if (caps.providers !== "unlimited" && providers?.length > caps.providers) {
    validatedProviders = providers.slice(0, caps.providers);
  }

  // -------------------------------------------
  // 🛑 Automation Limits
  // -------------------------------------------
  const advancedAllowed =
    ["advanced", "enterprise", "private"].includes(caps.automation);

  const automationMode = advancedAllowed ? automation : "basic";

  // -------------------------------------------
  // 🛑 Security Limits
  // -------------------------------------------
  const allowedSecurity = caps.security;

  // -------------------------------------------
  // 🛑 Networking Limits
  // -------------------------------------------
  const networkingAllowed = caps.networking;
  
  let finalNetworking = networking;
  if (networkingAllowed === "basic") {
    // Block advanced topology
    if (networking === "hybrid" || networking === "multi_vpc") {
      finalNetworking = "single_vpc";
    }
  }

  // -------------------------------------------
  // 🧠 Upgrade Suggestions
  // -------------------------------------------
  const upgradeHints = [];

  if (providers?.length > caps.providers && caps.providers !== "unlimited") {
    upgradeHints.push(
      `You selected ${providers.length} providers, but your plan allows ${caps.providers}. Upgrade to ${caps.upgrade} for more cloud providers.`
    );
  }

  if (automation !== "basic" && caps.automation === "basic") {
    upgradeHints.push(
      `Advanced automation requires the ${caps.upgrade} plan.`
    );
  }

  if (security !== allowedSecurity) {
    upgradeHints.push(
      `Requested security level "${security}" exceeds your plan’s allowed level "${allowedSecurity}". Upgrade to unlock enhanced security.`
    );
  }

  if (networking !== finalNetworking) {
    upgradeHints.push(
      `Advanced networking (multi-VPC or hybrid-cloud) requires the ${caps.upgrade} plan.`
    );
  }

  if (!caps.filePortal) {
    upgradeHints.push(
      `The file template portal is not available on ${plan}. Upgrade to access saved builds & templates.`
    );
  }

  // -------------------------------------------
  // 🧠 System Prompt — THIS IS WHAT THE AI RUNS
  // -------------------------------------------

  return `
You are **DevVelocity AI** — a senior cloud architect + DevOps engineer.

You design full production infrastructure tailored to:
- cloud provider
- automation goals
- networking requirements
- project workload
- user’s subscription tier
- budget constraints
- multi-cloud usage
- SSO/security needs
- CI/CD pipelines
- cost optimization
- uptime and failover strategy

You ALWAYS respect plan limits and NEVER output features the tier does not allow.

---

# USER INPUT (Validated)

Cloud Provider:
${cloud}

Selected Providers (tier-limited):
${JSON.stringify(validatedProviders, null, 2)}

Automation Mode (tier-limited):
${automationMode}

Networking (tier-adjusted):
Requested: ${networking}
Allowed: ${finalNetworking}

Maintenance Preference:
${maintenance}

Budget:
${budget}

Security:
Requested: ${security}
Allowed By Plan: ${allowedSecurity}

Build Type:
${buildType}

Project Description:
${project}

Plan Tier:
${plan}

Plan Capabilities:
${JSON.stringify(caps, null, 2)}

Upgrade Recommendations:
${upgradeHints.join("\n")}

---

# REQUIRED OUTPUT FORMAT (JSON ONLY)

{
  "summary": "...",
  "architecture": "...",
  "networking": {
    "vpc": "...",
    "subnets": "...",
    "routing": "...",
    "load_balancing": "...",
    "firewall": "..."
  },
  "cloud_init": "...",
  "docker_compose": "...",
  "pipelines": {
    "provider": "...",
    "automation": "..."
  },
  "maintenance_plan": "...",
  "sso_recommendations": "...",
  "security_model": "...",
  "cost_optimization": "...",
  "file_portal": "...",
  "upgrade_paths": "...",
  "next_steps": "..."
}

---

# RULES

1. NEVER exceed plan tier limits.
2. ALWAYS output real runnable configs (no placeholders).
3. ALWAYS consider user budget.
4. ALWAYS optimize for their chosen provider.
5. ALWAYS include networking and VPC planning.
6. ALWAYS suggest upgrades when relevant.
7. ALWAYS generate SSO/security only if allowed by tier.
8. ALWAYS generate pipelines if automation requested.
9. ALWAYS include cost reduction strategies.
10. ALWAYS include clear next steps.

---

# BEGIN OUTPUT NOW
`;
}
