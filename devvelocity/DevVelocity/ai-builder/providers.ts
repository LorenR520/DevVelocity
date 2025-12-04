// ai-builder/providers.ts
/**
 * DevVelocity — Provider Knowledge Engine (Hybrid Expansion Pack System)
 *
 * This file controls:
 *  - cloud provider metadata
 *  - automation ecosystem metadata
 *  - identity + auth integrations
 *  - payment processors
 *  - database engines
 *  - multi-cloud intelligence
 *
 * Each group supports expansion packs which can be unlocked
 * based on plan tier OR addon purchases.
 */

export type ProviderPack =
  | "core_cloud"
  | "extended_cloud"
  | "global_cloud"
  | "identity_pack"
  | "payments_pack"
  | "automation_pack"
  | "database_pack";

export interface ProviderInfo {
  id: string;
  name: string;
  category: string;
  tier_required: "developer" | "startup" | "team" | "enterprise" | "addon";
  description: string;
  strengths: string[];
  weaknesses?: string[];
  recommended_for: string[];
}

/**
 * ----------------------------------------
 * CORE CLOUD PACK (always included)
 * ----------------------------------------
 */
export const coreCloudProviders: ProviderInfo[] = [
  {
    id: "aws",
    name: "Amazon Web Services",
    category: "cloud",
    tier_required: "developer",
    description: "Most mature cloud with deep service catalog.",
    strengths: ["scaling", "serverless", "enterprise support", "global reach"],
    recommended_for: ["production apps", "scalable workloads", "enterprise infra"],
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    category: "cloud",
    tier_required: "developer",
    description: "Strong enterprise integrations and Microsoft tooling.",
    strengths: ["Active Directory", "enterprise SSO", ".NET apps"],
    recommended_for: ["corporate apps", "SSO-heavy", "Windows-based workloads"],
  },
  {
    id: "gcp",
    name: "Google Cloud",
    category: "cloud",
    tier_required: "developer",
    description: "Best-in-class data, ML/AI tooling, and global networking.",
    strengths: ["ML", "big data", "global networking"],
    recommended_for: ["AI apps", "data pipelines", "Kubernetes"],
  },
  {
    id: "oracle",
    name: "Oracle Cloud (OCI)",
    category: "cloud",
    tier_required: "developer",
    description: "Best performance-per-dollar and powerful ARM free tier.",
    strengths: ["cost efficiency", "high-performance VMs"],
    recommended_for: ["solo devs", "cost-sensitive workloads", "DB-heavy apps"],
  },
];

/**
 * ----------------------------------------
 * EXTENDED CLOUD PACK (Startup+)
 * ----------------------------------------
 */
export const extendedCloudProviders: ProviderInfo[] = [
  {
    id: "digitalocean",
    name: "DigitalOcean",
    category: "cloud",
    tier_required: "startup",
    description: "Simple, developer-friendly cloud.",
    strengths: ["simplicity", "fast deploys"],
    recommended_for: ["startups", "quick prototypes"],
  },
  {
    id: "linode",
    name: "Linode/Akamai",
    category: "cloud",
    tier_required: "startup",
    description: "Predictable pricing, simple infra.",
    strengths: ["cost", "simplicity"],
    recommended_for: ["small teams", "API servers"],
  },
  {
    id: "vultr",
    name: "Vultr",
    category: "cloud",
    tier_required: "startup",
    description: "High-performance VMs with global datacenters.",
    strengths: ["performance", "locations"],
    recommended_for: ["global apps", "fast deploys"],
  },
];

/**
 * ----------------------------------------
 * GLOBAL CLOUD PACK (Team+ or Add-on)
 * ----------------------------------------
 */
export const globalCloudProviders: ProviderInfo[] = [
  {
    id: "hetzner",
    name: "Hetzner",
    category: "cloud",
    tier_required: "team",
    description: "Cheapest global dedicated + cloud provider.",
    strengths: ["pricing", "bare metal"],
    recommended_for: ["EU customers", "dedicated servers"],
  },
  {
    id: "scaleway",
    name: "Scaleway",
    category: "cloud",
    tier_required: "team",
    description: "European cloud with strong GPU offerings.",
    strengths: ["EU compliance", "GPU"],
    recommended_for: ["AI", "EU workloads"],
  },
  {
    id: "alibaba",
    name: "Alibaba Cloud",
    category: "cloud",
    tier_required: "enterprise",
    description: "Strongest cloud presence in Asia.",
    strengths: ["Asia region availability"],
    recommended_for: ["Asia-based apps", "global expansion"],
  },
  {
    id: "tencent",
    name: "Tencent Cloud",
    category: "cloud",
    tier_required: "enterprise",
    description: "China-first cloud with strong CDN + media services.",
    strengths: ["China delivery", "media"],
    recommended_for: ["gaming", "video apps"],
  },
];

/**
 * ----------------------------------------
 * PAYMENTS PACK
 * ----------------------------------------
 */
export const paymentsPack = [
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    tier_required: "developer",
    description: "Best developer-first payments platform.",
    strengths: ["subscriptions", "webhooks", "global support"],
    recommended_for: ["SaaS", "marketplaces"],
  },
  {
    id: "lemonsqueezy",
    name: "Lemon Squeezy",
    category: "payments",
    tier_required: "developer",
    description: "Easiest digital sales + VAT handling.",
    strengths: ["EU VAT", "digital products"],
    recommended_for: ["SaaS", "creators"],
  },
  {
    id: "paddle",
    name: "Paddle",
    category: "payments",
    tier_required: "startup",
    description: "Full merchant of record + global tax handling.",
    strengths: ["MoR", "tax compliance"],
    recommended_for: ["global SaaS", "EU sales"],
  },
];

/**
 * ----------------------------------------
 * IDENTITY PACK
 * ----------------------------------------
 */
export const identityPack = [
  {
    id: "supabase_auth",
    name: "Supabase Auth",
    category: "identity",
    tier_required: "developer",
    description: "Simple, secure auth with Postgres.",
    strengths: ["email", "magic link"],
    recommended_for: ["startups", "serverless"],
  },
  {
    id: "clerk",
    name: "Clerk.dev",
    category: "identity",
    tier_required: "startup",
    description: "Modern identity + MFA + social logins.",
    strengths: ["MFA", "social auth", "zero-config"],
    recommended_for: ["teams", "SaaS"],
  },
  {
    id: "auth0",
    name: "Auth0",
    category: "identity",
    tier_required: "team",
    description: "Enterprise identity and compliance features.",
    strengths: ["enterprise SSO", "RBAC"],
    recommended_for: ["enterprise apps"],
  },
];

/**
 * ----------------------------------------
 * AUTOMATION PACK
 * ----------------------------------------
 */
export const automationPack = [
  { id: "github_actions", name: "GitHub Actions", category: "automation", tier_required: "developer" },
  { id: "gitlab_ci", name: "GitLab CI", category: "automation", tier_required: "developer" },
  { id: "jenkins", name: "Jenkins", category: "automation", tier_required: "startup" },
  { id: "circleci", name: "CircleCI", category: "automation", tier_required: "startup" },
  { id: "terraform", name: "Terraform", category: "automation", tier_required: "team" },
  { id: "pulumi", name: "Pulumi", category: "automation", tier_required: "team" },
];

/**
 * ----------------------------------------
 * DATABASE PACK
 * ----------------------------------------
 */
export const databasePack = [
  { id: "postgres", name: "PostgreSQL", category: "database", tier_required: "developer" },
  { id: "mysql", name: "MySQL", category: "database", tier_required: "developer" },
  { id: "neon", name: "Neon Postgres", category: "database", tier_required: "startup" },
  { id: "planetscale", name: "PlanetScale", category: "database", tier_required: "startup" },
  { id: "mongodb", name: "MongoDB Atlas", category: "database", tier_required: "team" },
  { id: "dynamodb", name: "DynamoDB", category: "database", tier_required: "team" },
];

/**
 * ----------------------------------------
 * FULL PROVIDER RESOLUTION ENGINE
 * ----------------------------------------
 */
export function getProvidersForPlan(plan: string) {
  const packs: ProviderInfo[] = [
    ...coreCloudProviders,
  ];

  if (plan === "startup" || plan === "team" || plan === "enterprise")
    packs.push(...extendedCloudProviders);

  if (plan === "team" || plan === "enterprise")
    packs.push(...globalCloudProviders);

  // Add-ons allowed for any plan
  packs.push(...paymentsPack, ...identityPack, ...automationPack, ...databasePack);

  return packs.filter((p) => {
    return (
      p.tier_required === "developer" ||
      p.tier_required === plan ||
      plan === "enterprise" ||
      p.tier_required === "addon"
    );
  });
}
