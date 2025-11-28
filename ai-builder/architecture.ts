// ai-builder/architecture.ts

/**
 * DevVelocity AI — Architecture Generator Engine
 *
 * This module:
 *  - interprets user answers
 *  - enforces plan limitations
 *  - selects optimal architecture per cloud provider
 *  - generates high-level infra design for AI Builder
 *  - picks networking model
 *  - selects automation tooling
 *  - builds multi-cloud strategies (if allowed)
 */

import { ProviderInfo, getProvidersForPlan } from "./providers";
import { getPlan } from "@/ai-builder/plan-logic";

interface ArchitectureResult {
  primaryCloud: string;
  recommendedServices: string[];
  networking: string;
  storage: string;
  compute: string;
  automation: string[];
  security: string[];
  multiCloudStrategy?: string;
  failover?: string;
  costLevel: string;
  rationale: string;
}

/**
 * Utility — Converts budget text into internal "tier"
 */
function convertBudget(budget: string): "very_low" | "low" | "mid" | "high" | "enterprise" {
  switch (budget) {
    case "<$25":
      return "very_low";
    case "$25–$100":
      return "low";
    case "$100–$500":
      return "mid";
    case "$500–$2000":
      return "high";
    case "$2000+":
      return "enterprise";
    default:
      return "low";
  }
}

/**
 * Utility — Chooses best compute model
 */
function pickCompute(provider: string, budget: string, buildType: string) {
  const b = convertBudget(budget);

  // Different logic per provider
  switch (provider) {
    case "aws":
      if (buildType === "API" || buildType === "serverless") return "AWS Lambda + API Gateway";
      if (b === "very_low") return "t3.micro";
      if (b === "mid") return "t3.medium or ECS Fargate";
      return "EKS cluster";

    case "azure":
      if (buildType === "serverless") return "Azure Functions + API Management";
      if (b === "very_low") return "B1s VM";
      if (b === "mid") return "Azure App Service";
      return "AKS cluster";

    case "gcp":
      if (buildType === "serverless") return "Cloud Run + Cloud Functions";
      if (b === "very_low") return "e2-micro";
      return "GKE Autopilot";

    case "oracle":
      if (b === "very_low") return "Always Free ARM VM";
      if (buildType === "db") return "OCI MySQL / Oracle DB System";
      return "Flexible VM + Load Balancer";

    case "digitalocean":
      return b === "very_low" ? "Basic Droplet" : "App Platform + Managed DB";

    case "linode":
      return b === "very_low" ? "Nanode" : "Dedicated CPU + Kubernetes";

    case "hetzner":
      return "Dedicated Server + Load Balancer";

    default:
      return "Generic VM + Docker Compose";
  }
}

/**
 * Utility — Select networking model
 */
function pickNetworking(provider: string) {
  switch (provider) {
    case "aws":
      return "VPC + ALB + Route53";
    case "azure":
      return "VNet + Front Door + Traffic Manager";
    case "gcp":
      return "VPC + Cloud Load Balancing";
    case "oracle":
      return "VCN + Load Balancer";
    case "digitalocean":
      return "VPC + Load Balancer";
    case "linode":
      return "VPC + NodeBalancers";
    case "hetzner":
      return "Private Network + Load Balancer";
    default:
      return "Private network + reverse proxy";
  }
}

/**
 * Utility — Security model per tier + provider
 */
function pickSecurity(plan: string, provider: string, requested: string) {
  const base: string[] = [
    "IAM Roles & Access Policies",
    "Encrypted Storage",
    "HTTPS Everywhere",
  ];

  if (plan === "developer") return base;

  if (plan === "startup")
    return [...base, "MFA", "Basic SSO (Google/Microsoft)", "Audit Logs"];

  if (plan === "team")
    return [
      ...base,
      "SSO (Google/Microsoft/Okta/Auth0)",
      "TLS Termination Layer",
      "Private Networking Only",
      "RBAC + Audit Trails",
    ];

  if (plan === "enterprise")
    return [
      ...base,
      "Full Zero Trust (ZTA)",
      "Enterprise IAM",
      "Dedicated Security Boundary",
      "HSM-backed Keys",
      "SSO + SCIM Provisioning",
    ];

  return base;
}

/**
 * Utility — Automation based on tier + answers
 */
function pickAutomation(plan: string, automation: any[]) {
  const basic = ["GitHub Actions CI/CD"];

  if (plan === "developer") return basic;

  if (plan === "startup")
    return [...basic, "Docker Build Pipelines", "Nightly Backups"];

  if (plan === "team")
    return [
      ...basic,
      "Multi-environment CI/CD",
      "Health Checks",
      "Auto-scaling Scripts",
      "Infrastructure Drift Detection",
    ];

  if (plan === "enterprise")
    return [
      ...basic,
      "Full Terraform/Pulumi Orchestration",
      "Automated Failover Pipelines",
      "Compliance Scanning",
      "Blue/Green Deployments",
      "Traffic Shadowing",
    ];

  return basic;
}

/**
 * MAIN ENGINE — Creates the architecture result object
 */
export function generateArchitecture(answers: any): ArchitectureResult {
  const {
    plan,
    0: cloudPref,
    1: budget,
    2: tasks,
    3: maintenance,
    4: buildType,
  } = answers;

  const planInfo = getPlan(plan);
  const providerList = getProvidersForPlan(plan);

  // Resolve primary cloud provider
  const primaryProvider =
    cloudPref && cloudPref.length ? cloudPref[0] : "aws";

  const providerMeta = providerList.find((p) => p.id === primaryProvider);

  const compute = pickCompute(primaryProvider, budget, buildType);
  const networking = pickNetworking(primaryProvider);
  const security = pickSecurity(plan, primaryProvider, answers.security);
  const automation = pickAutomation(plan, tasks);

  // Multi-cloud support
  let multiCloud: string | undefined = undefined;
  let failover: string | undefined = undefined;

  if (answers.multiCloud === "Yes — deploy identical stacks") {
    multiCloud = "Active-active multi-cloud deployment";

    if (plan === "enterprise") {
      failover = "Global automated failover (AI-directed)";
    }
  }

  const costLevel =
    primaryProvider === "oracle" && convertBudget(budget) === "very_low"
      ? "Minimal (OCI always-free ARM)"
      : budget;

  return {
    primaryCloud: providerMeta?.name ?? "AWS",
    recommendedServices: [compute, "Managed Database", "Object Storage"],
    networking,
    compute,
    storage: "Block Storage + Object Storage",
    automation,
    security,
    multiCloudStrategy: multiCloud,
    failover,
    costLevel,
    rationale: `Selected ${primaryProvider} because it aligns with your plan tier, budget, and workload type.`,
  };
}
