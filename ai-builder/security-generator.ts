/**
 * DevVelocity AI — Security Model Generator
 *
 * Produces:
 *  - OS hardening guidelines
 *  - IAM architecture
 *  - SSO recommendations
 *  - Encryption layers
 *  - Secret management flow
 *  - Compliance notes (SOC2, HIPAA, PCI)
 *  - Plan-tier restricted features
 */

import { getAllowedCapabilities } from "./plan-logic";

export function generateSecurityModel(answers: any) {
  const plan = answers.plan ?? "developer";
  const caps = getAllowedCapabilities(plan);

  const cloud = answers[0];
  const securityPref = answers[5];
  const automation = answers[1];
  const multiCloud = (answers[2] || []).length > 1;

  // ===================================================================
  // 🔐 Base Security (always included)
  // ===================================================================

  const base = `
### 🔐 Base Security
Included in all tiers:
- Encrypted storage (provider native)
- HTTPS by default
- Firewall hardened (deny-all inbound except 80/443/22)
- Minimal SSH exposure (prefer Cloudflare Tunnel or identity-based SSH)
- Automated OS updates (if automation != "none")
- Threat logging enabled
`;

  // ===================================================================
  // 🔐 Tier-Specific Enhancements
  // ===================================================================

  let tierSecurity = "";

  if (caps.security === "none") {
    tierSecurity = `
### 🔒 Tier: Developer (Basic Protection)
- UFW / IPTables configuration
- Fail2ban for SSH
- Rotate SSH keys every 90 days
- No SSO
`;
  }

  if (caps.security === "basic") {
    tierSecurity = `
### 🔒 Tier: Startup (Basic + Light Access Control)
- MFA recommended (console)
- Enforce strong password policies
- Secure service accounts
- Encrypted secrets (KMS basic tier)
- Optional Google/Microsoft SSO
`;
  }

  if (caps.security === "advanced") {
    tierSecurity = `
### 🛡️ Tier: Team (Advanced Security)
- Mandatory MFA
- Identity federation (Google, Microsoft, Okta)
- IAM least privilege enforced per service
- Secret Manager integration
- Logging compliance (SOC2 readiness)
- Audit trails + IAM event hooks
- Automated patching windows
`;
  }

  if (caps.security === "enterprise") {
    tierSecurity = `
### 🛡️ Tier: Enterprise (Zero-Trust + Compliance)
- Zero-trust perimeter: identity required for all resources
- SSO everywhere (SAML, OAuth2, OpenID Connect)
- Hardware-backed keys (YubiKey, TPM)
- Vault-based secrets with automatic rotation
- Full IAM segmentation: dev/stage/prod isolation
- Cloud-native IDS (GuardDuty / Security Command Center)
- Threat correlation AI (SIEM integration)
- Compliance packs:
  - SOC2
  - HIPAA
  - PCI DSS
  - GDPR
  - FedRAMP (advisory only)
`;
  }

  // ===================================================================
  // 🔐 Cloud Provider Enhancements
  // ===================================================================

  const cloudEnhancements: Record<string, string> = {
    AWS: `
- AWS IAM with least privilege
- AWS KMS for encryption
- GuardDuty, Detect, Macie
- S3 Block Public Access
    `,
    Azure: `
- Azure AD access control
- Defender for Cloud
- Key Vault secrets
- Azure Policy controls
    `,
    GCP: `
- IAM Roles + Service Accounts
- Secret Manager
- Cloud Armor
- VPC Service Controls
    `,
    "Oracle Cloud": `
- OCI Vault
- Identity Domains
- OSMS patching
- Cloud Guard
    `,
    DigitalOcean: `
- DO Firewalls
- DO Spaces Private Access
- Backup encryption
    `,
    Hetzner: `
- UFW hardened
- SSH CA signing recommended
- Private networking for DB
    `,
    Vultr: `
- Firewall Groups
- Private VLANs
- Backup encryption
    `,
    Linode: `
- Cloud Firewalls
- LKE RBAC (if Kubernetes)
- Encrypted block storage
    `,
    Scaleway: `
- IAM with project isolation
- Secret Manager
- Private networks
    `,
    Cloudflare: `
- Zero Trust (ZTNA)
- WAF + DDoS
- Access with identity rules
    `,
    Flyio: `
- WireGuard mesh
- per-app identity tokens
- encrypted volumes
    `
  };

  const cloudBlock =
    cloudEnhancements[cloud] ??
    "- Standard VM firewall + hardening\n";

  // ===================================================================
  // 🔐 Multi-Cloud Security
  // ===================================================================

  let multiCloudBlock = "";
  if (multiCloud) {
    multiCloudBlock = `
### 🌐 Multi-Cloud Security Alignment
- Consistent access policies across providers
- Identity normalization
- Secrets replication with encryption
- Cross-cloud logging sync
- Optional active/active trust model
`;
  }

  // ===================================================================
  // 🔐 Automation-Aware Security
  // ===================================================================

  const automationBlock = `
### 🔧 Automation-Aware Security
Since automation is set to **${automation}**, DevVelocity will:

- Restrict CI/CD runners to least privilege
- Sign all build artifacts
- Use secure hash validation on deploy
- Ensure rollback safety
- Enable insider-risk detection on pipelines
`;

  // ===================================================================
  // FINAL OUTPUT
  // ===================================================================

  return `
# 🔐 Security Architecture Overview

${base}

${tierSecurity}

---

## ☁️ Cloud-Specific Enhancements for ${cloud}
${cloudBlock}

---

${multiCloudBlock}

---

${automationBlock}

---

## 🔑 Secrets Management Strategy
Tier-limited:

${
  caps.sso === "none"
    ? "- Environment variables stored in encrypted .env"
    : caps.sso === "basic"
    ? "- Provider KMS + encrypted env"
    : caps.sso === "advanced"
    ? "- Secret Manager + per-service IAM roles"
    : "- Vault-based auto-rotating secrets with identity federation"
}

---

## 📜 Compliance Notes
${
  plan === "enterprise"
    ? "- SOC2/HIPAA/PCI/GDPR frameworks supported\n- Audit trails + retention policies\n"
    : plan === "team"
    ? "- SOC2 readiness enabled\n"
    : "- No regulatory compliance guarantees\n"
}

---

## 🧩 Additional Recommended Hardening
- Disable password SSH
- Enforce TLS 1.3
- Block metadata IP exposure
- Enable kernel hardening (sysctl)
- Use distro security baselines (Ubuntu Pro, Hardened AMI, etc.)

`;
}
