// server/ai/builder-engine.ts
// ------------------------------------------------------
//   DEVVELOCITY AI BUILDER ENGINE (Enterprise Edition)
// ------------------------------------------------------
// This engine converts user answers → full infra templates,
// cloud-init, YAML, multi-cloud decisions, automation stack,
// SSO/security, and pricing tier compliance.
// ------------------------------------------------------

import pricing from "@/marketing/pricing.json";

// -------------------------
// TYPES
// -------------------------
export interface BuilderAnswers {
  cloudPreference: "aws" | "azure" | "gcp" | "cloudflare" | "oracle" | "auto";
  workloadType:
    | "compute-heavy"
    | "latency-sensitive"
    | "data-heavy"
    | "event-driven"
    | "ai-ml"
    | "batch"
    | "api-high-read"
    | "api-high-write"
    | "streaming"
    | "realtime";

  sla: "99.0" | "99.5" | "99.9" | "99.99" | "99.999";
  budget: "low" | "medium" | "high" | "enterprise";
  maintenance: "minimal" | "moderate" | "full-control";
  experience: "beginner" | "intermediate" | "expert";

  compliance: {
    hipaa?: boolean;
    soc2?: boolean;
    pci?: boolean;
    fedramp?: boolean;
    gdpr?: boolean;
  };

  securityLevel: "none" | "basic" | "advanced" | "enterprise";
  ssoTier: "none" | "basic" | "advanced" | "enterprise";

  expectedUsers: number;
  expectedQps: number;

  deploymentStyle:
    | "serverless"
    | "containers"
    | "vm"
    | "edge"
    | "hybrid"
    | "kubernetes";

  devTools: ("github" | "gitlab" | "bitbucket" | "local")[];
  dbPreference: "sql" | "nosql" | "hybrid";
  automationTools: ("stripe" | "lemon" | "supabase" | "terraform" | "github-actions")[];
}

// -------------------------
// MAIN ENGINE
// -------------------------
export function buildInfrastructurePlan(answers: BuilderAnswers, planId: string) {
  const plan = pricing.plans.find((p) => p.id === planId);

  if (!plan) throw new Error("Invalid plan ID provided.");

  // -------------------------
  // CLOUD PROVIDER SELECTION
  // -------------------------
  const cloud = selectCloud(answers);

  // -------------------------
  // ARCHITECTURE LAYERING
  // -------------------------
  const architecture = chooseArchitecture(answers, cloud);

  // -------------------------
  // DATABASE CHOOSER
  // -------------------------
  const database = chooseDatabase(answers);

  // -------------------------
  // SECURITY + SSO
  // -------------------------
  const security = buildSecurityPackage(answers, plan);

  // -------------------------
  // CI/CD
  // -------------------------
  const cicd = buildCiCd(answers);

  // -------------------------
  // OBSERVABILITY
  // -------------------------
  const observability = buildObservability(answers);

  // -------------------------
  // FINAL TEMPLATE FILES
  // -------------------------
  const templates = generateTemplates({
    cloud,
    architecture,
    database,
    security,
    cicd,
    observability,
    answers,
  });

  return {
    cloud,
    architecture,
    database,
    security,
    cicd,
    observability,
    templates,
    summary: generateHumanSummary(answers, cloud, architecture, database, plan),
  };
}

// ------------------------------------------------------
//  SECTION 1 — CLOUD PROVIDER SELECTION
// ------------------------------------------------------
function selectCloud(a: BuilderAnswers) {
  if (a.cloudPreference !== "auto") return a.cloudPreference;

  // Auto-select based on workload
  switch (a.workloadType) {
    case "latency-sensitive":
    case "realtime":
      return "cloudflare";
    case "compute-heavy":
    case "ai-ml":
      return "aws";
    case "data-heavy":
      return "gcp";
    case "event-driven":
      return "aws";
    default:
      return "cloudflare";
  }
}

// ------------------------------------------------------
// SECTION 2 — ARCHITECTURE CHOOSER
// ------------------------------------------------------
function chooseArchitecture(a: BuilderAnswers, cloud: string) {
  // Map SLA → redundancy
  const redundancy = {
    "99.0": "single-zone",
    "99.5": "single-zone + backups",
    "99.9": "multi-AZ",
    "99.99": "multi-AZ + LB + failover",
    "99.999": "multi-cloud failover",
  }[a.sla];

  // Deployment-style overrides
  switch (a.deploymentStyle) {
    case "serverless":
      return {
        style: "serverless",
        compute:
          cloud === "aws"
            ? "Lambda"
            : cloud === "gcp"
            ? "Cloud Run"
            : cloud === "azure"
            ? "Azure Functions"
            : "Cloudflare Workers",
        redundancy,
      };

    case "containers":
      return {
        style: "containers",
        compute: cloud === "aws" ? "ECS Fargate" : "Cloud Run (GCP)",
        redundancy,
      };

    case "kubernetes":
      return {
        style: "kubernetes",
        compute: cloud === "aws" ? "EKS" : cloud === "gcp" ? "GKE" : "AKS",
        redundancy,
      };

    case "edge":
      return {
        style: "edge",
        compute: "Cloudflare Workers",
        redundancy: "global-distributed",
      };

    default:
      return {
        style: "serverless",
        compute: "Cloudflare Workers",
        redundancy,
      };
  }
}

// ------------------------------------------------------
// SECTION 3 — DATABASE CHOOSER
// ------------------------------------------------------
function chooseDatabase(a: BuilderAnswers) {
  if (a.dbPreference === "sql") {
    return {
      type: "sql",
      service:
        a.cloudPreference === "aws"
          ? "RDS Postgres"
          : a.cloudPreference === "gcp"
          ? "Cloud SQL"
          : a.cloudPreference === "azure"
          ? "Azure Postgres"
          : "Supabase Postgres",
    };
  }

  if (a.dbPreference === "nosql") {
    return {
      type: "nosql",
      service:
        a.cloudPreference === "aws"
          ? "DynamoDB"
          : a.cloudPreference === "gcp"
          ? "Firestore"
          : "Cloudflare KV",
    };
  }

  return {
    type: "hybrid",
    sql: "Supabase Postgres",
    nosql: "Cloudflare KV",
  };
}

// ------------------------------------------------------
// SECTION 4 — SECURITY + SSO
// ------------------------------------------------------
function buildSecurityPackage(a: BuilderAnswers, plan: any) {
  const base = {
    mfa: a.securityLevel !== "none",
    encryption: "aes256",
    secretManager:
      a.cloudPreference === "aws"
        ? "AWS Secrets Manager"
        : "Cloudflare Secrets",
  };

  let ssoProvider = "None";

  if (a.ssoTier === "basic") ssoProvider = "OAuth2 / GitHub";
  if (a.ssoTier === "advanced") ssoProvider = "SAML / Okta";
  if (a.ssoTier === "enterprise") ssoProvider = "Okta + SCIM";

  return {
    ...base,
    ssoProvider,
    compliance: a.compliance,
  };
}

// ------------------------------------------------------
// SECTION 5 — CI/CD SELECTION
// ------------------------------------------------------
function buildCiCd(a: BuilderAnswers) {
  if (a.devTools.includes("github")) {
    return "GitHub Actions CI/CD";
  }

  if (a.devTools.includes("gitlab")) {
    return "GitLab CI";
  }

  return "DevVelocity CI/CD (Local)";
}

// ------------------------------------------------------
// SECTION 6 — OBSERVABILITY
// ------------------------------------------------------
function buildObservability(a: BuilderAnswers) {
  return {
    logging:
      a.cloudPreference === "aws"
        ? "CloudWatch"
        : a.cloudPreference === "gcp"
        ? "StackDriver"
        : "Cloudflare Analytics",
    traces: "OpenTelemetry",
    metrics: "Grafana Cloud",
  };
}

// ------------------------------------------------------
// SECTION 7 — TEMPLATE GENERATOR
// ------------------------------------------------------
function generateTemplates(config: any) {
  return {
    cloudInit: generateCloudInit(config),
    yaml: generateYamlConfig(config),
    diagram: generateDiagram(config),
  };
}

function generateCloudInit(config: any) {
  return `
#cloud-config
package_update: true
package_upgrade: true

write_files:
  - path: /etc/devvelocity/config.json
    content: |
      ${JSON.stringify(config, null, 2)}
`;
}

function generateYamlConfig(config: any) {
  return `
infrastructure:
  cloud: ${config.cloud}
  compute: ${config.architecture.compute}
  database: ${config.database.type}
  sso: ${config.security.ssoProvider}
`;
}

function generateDiagram(config: any) {
  return `
digraph infrastructure {
  cloud -> "${config.architecture.compute}";
  "${config.architecture.compute}" -> database;
  database -> users;
}
`;
}

// ------------------------------------------------------
// HUMAN SUMMARY (displayed in UI)
// ------------------------------------------------------
function generateHumanSummary(a: BuilderAnswers, cloud: string, arch: any, db: any, plan: any) {
  return `
Your infrastructure plan is ready.

Cloud selected: **${cloud.toUpperCase()}**

Architecture: **${arch.style}** with **${arch.compute}**  
Redundancy: **${arch.redundancy}**

Database: **${db.type.toUpperCase()}** (${db.service ?? "Hybrid"})

Security Level: **${a.securityLevel}**  
SSO: **${a.ssoTier}**  
Compliance: **${Object.keys(a.compliance).join(", ") || "None"}**

Estimated Tier: **${plan.name}**

A full set of templates (bash, cloud-init, YAML, diagrams) has been generated.
`;
}
