/**
 * DevVelocity AI — SSO & Identity Architecture Generator
 *
 * Produces:
 *  - SSO recommendations based on cloud + tier
 *  - IAM architecture
 *  - Access control layers
 *  - Zero-trust identity (enterprise)
 *  - Upgrade suggestions if user requests features outside tier cap
 */

import { getAllowedCapabilities } from "./plan-logic";

export function generateSSOModel(answers: any) {
  const plan = answers.plan ?? "developer";
  const caps = getAllowedCapabilities(plan);

  const cloud = answers[0];
  const securityPref = answers[5] || "";
  const wantsSSO =
    securityPref.toLowerCase().includes("google") ||
    securityPref.toLowerCase().includes("microsoft") ||
    securityPref.toLowerCase().includes("okta") ||
    securityPref.toLowerCase().includes("auth0");

  // ===================================================================
  // 🚫 If plan cannot use SSO
  // ===================================================================
  if (!caps.sso || caps.sso === "none") {
    return {
      tier: plan,
      allowed: false,
      message:
        "SSO is not available on your current plan. Upgrade to Startup or higher to enable Google/Microsoft SSO.",
      recommendedUpgrade: "startup",
      sso: null,
      iam: "Basic IAM via local accounts + MFA recommended",
    };
  }

  // ===================================================================
  // 💡 If SSO is allowed but user didn’t explicitly choose a provider
  // ===================================================================
  if (!wantsSSO) {
    return {
      tier: plan,
      allowed: true,
      message: "SSO available. User did not select a provider — defaulting to email login.",
      sso: "Email + MFA",
      iam: buildIAM(cloud, plan),
    };
  }

  // ===================================================================
  // 🔐 SSO Provider Options (full support)
  // ===================================================================
  const provider = detectProvider(securityPref);

  // If plan limits advanced SSO (enterprise-only)
  if (provider === "enterprise_provider" && caps.sso !== "enterprise") {
    return {
      tier: plan,
      allowed: false,
      message: `${provider} requires Enterprise plan.`,
      recommendedUpgrade: "enterprise",
      sso: null,
      iam: buildIAM(cloud, plan),
    };
  }

  // ===================================================================
  // FINAL SSO MODEL
  // ===================================================================
  return {
    tier: plan,
    allowed: true,
    provider,
    sso: buildSSO(provider, cloud, plan),
    iam: buildIAM(cloud, plan),
  };
}

// ===================================================================
// 🔍 Detect which provider the user selected
// ===================================================================

function detectProvider(pref: string) {
  const s = pref.toLowerCase();
  if (s.includes("google")) return "google";
  if (s.includes("microsoft")) return "microsoft";
  if (s.includes("okta")) return "okta";
  if (s.includes("auth0")) return "auth0";
  if (s.includes("saml")) return "saml";
  if (s.includes("oidc")) return "oidc";
  return "email";
}

// ===================================================================
// 🧩 Build SSO Stack by Provider
// ===================================================================

function buildSSO(provider: string, cloud: string, plan: string) {
  switch (provider) {
    case "google":
      return `
### 🔐 Google SSO
- OAuth2 / OpenID Connect
- Enforce MFA via Google Workspace
- Auto-provision users with SCIM (Team/Enterprise)
- Map Google Groups to DevVelocity roles`;

    case "microsoft":
      return `
### 🔐 Microsoft Entra ID (Azure AD)
- SAML or OIDC
- Conditional Access (IP/location/device)
- User provisioning via SCIM
- Group-based role mapping`;

    case "okta":
      return `
### 🔐 Okta SSO
- Enterprise-grade access control
- Device trust and MFA rules
- Lifecycle management compatible
- Automated provisioning`;

    case "auth0":
      return `
### 🔐 Auth0 Universal Login
- Passwordless supported
- Multi-tenant identity
- Token lifetime customization
- Role-based access`;

    case "saml":
      return `
### 🔐 Generic SAML
- Works with corporate IdP
- Supports MFA and identity policies
- Roles passed as SAML assertions`;

    case "oidc":
      return `
### 🔐 OIDC Provider
- Lightweight identity integration
- JWT-based access tokens
- Ideal for developer or startup use`;

    default:
      return `
### 🔐 Email + MFA
- Email login with magic links
- Optional TOTP MFA
- Provider-managed passwords disabled`;
  }
}

// ===================================================================
// 🛡️ IAM Architecture (per Cloud + Tier)
// ===================================================================

function buildIAM(cloud: string, plan: string) {
  const enterprise = plan === "enterprise";

  switch (cloud) {
    case "AWS":
      return `
### 🛡️ AWS IAM Architecture
- Least privilege IAM roles for every service
- Admin role separate from deploy roles
- ${enterprise ? "STS Federation + IAM Identity Center" : "IAM Users with MFA"}
- Secrets in AWS Secrets Manager
- KMS CMK encryption for everything`;

    case "Azure":
      return `
### 🛡️ Azure Identity
- Entra ID role-based access control
- Managed Identities for services
- Key Vault for secrets
- Conditional access
${enterprise ? "- Privileged Identity Management enabled" : ""}`;

    case "GCP":
      return `
### 🛡️ Google Cloud IAM
- Service Accounts for workloads
- Workload Identity Federation (Enterprise)
- Secret Manager
- Organization policies for security baselines`;

    case "Oracle Cloud":
      return `
### 🛡️ Oracle Identity Domains
- IAM policies per Compartment
- Vault for keys + secrets
- IDCS federation options`;

    case "DigitalOcean":
      return `
### 🛡️ DigitalOcean IAM
- DO OAuth tokens
- Project-level access control
- Scoped API keys`;

    default:
      return `
### 🛡️ General IAM (Generic Cloud)
- SSH certificates
- Role-based identities
- Secrets encrypted at rest`;
  }
}
