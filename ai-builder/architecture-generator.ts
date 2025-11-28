/**
 * DevVelocity AI — Architecture Generator
 *
 * Creates full infrastructure architecture output based on:
 *  - cloud provider
 *  - plan tier
 *  - automation complexity
 *  - security model
 *  - scaling requirements
 *  - networking
 *  - multi-cloud level
 *  - expansion packs
 *
 * Output is consumed by:
 *   - AIBuildResult.tsx
 *   - cloud-init-generator
 *   - pipeline-generator
 */

import { getAllowedCapabilities } from "./plan-logic";

export function generateArchitecture(answers: any) {
  const plan = answers.plan ?? "developer";
  const caps = getAllowedCapabilities(plan);

  const cloud = answers[0];
  const automation = answers[1];
  const providers = answers[2] || [];
  const maintenance = answers[3];
  const budget = answers[4];
  const security = answers[5];
  const buildType = answers[6];
  const description = answers[7];

  // ======================================================
  // PROVIDER-SPECIFIC ARCHITECTURE BLOCKS
  // ======================================================

  const baseCompute: Record<string, string> = {
    AWS: "EC2 t3.medium + ALB",
    Azure: "Azure VM B2ms + Azure Load Balancer",
    GCP: "Compute Engine e2-standard + Cloud Load Balancing",
    "Oracle Cloud": "OCI VM.Standard.E2.2 + Load Balancer",
    DigitalOcean: "Droplet + Load Balancer",
    Hetzner: "CX31 + Load Balancer",
    Vultr: "VC2 + Load Balancer",
    Linode: "Linode Compute + NodeBalancer",
    Scaleway: "DEV1-M + Load Balancer",
    Cloudflare: "Workers + Durable Objects",
    Flyio: "Fly Machines + Global Anycast",
  };

  const compute = baseCompute[cloud] ?? "VM + Load Balancer";

  // ======================================================
  // MULTI-CLOUD LOGIC
  // ======================================================

  let multiCloudBlock = "";

  if (providers.length > 1) {
    multiCloudBlock = `
### 🌐 Multi-Cloud Deployment (Enabled)
You selected **${providers.length} cloud providers**.

DevVelocity will:

- deploy identical infrastructure to all regions/providers
- configure DNS failover
- sync secrets + environment
- replicate build artifacts
- optional active/active mode (team+)
- optional warm-standby (developer/startup)
`;
  }

  // ======================================================
  // SECURITY MODEL
  // ======================================================

  let securityBlock = "";

  if (security === "basic") {
    securityBlock = `
### 🔐 Security Tier: Basic
- SSH rate limiting
- UFW firewall
- Encrypted volumes
- Basic OS hardening
`;
  }

  if (security === "advanced") {
    securityBlock = `
### 🔐 Security Tier: Advanced
- MFA required for admin ops
- Full OS hardening (CIS L1)
- Automated patching
- Fail2ban + auditd
- Encrypted secrets sync
`;
  }

  if (security === "enterprise") {
    securityBlock = `
### 🛡️ Security Tier: Enterprise
- Zero-trust network
- SSO/Identity Federation
- Zero-downtime patching
- Hardware keys + TPM attestation
- CIS L2 + SOC2 ready configuration
- Automated secret rotation
`;
  }

  // ======================================================
  // SCALING LOGIC
  // ======================================================

  const scalingBlock = `
### 📈 Auto-Scaling
DevVelocity enables tier-appropriate scaling:

- CPU-optimized scaling
- Memory-triggered scaling
- Rolling updates
- Zero-downtime deployments (startup+)
${
  plan === "enterprise"
    ? "- Cross-region global load balancing\n- Multi-provider auto-failover\n"
    : ""
}
`;

  // ======================================================
  // PIPELINE INTEGRATION
  // ======================================================

  const pipelineBlock = `
### 🔄 CI/CD Integration
Includes:

- GitHub Actions templates
- Zero-downtime deploy workflow
- Health checks + rollback logic
- Automated image rebuilds
${
  caps.automation !== "basic"
    ? "- Scheduled automation tasks\n- API-triggered automation\n"
    : ""
}
`;

  // ======================================================
  // FILE PORTAL (Enterprise)
  // ======================================================

  let filePortalBlock = "";

  if (plan === "enterprise") {
    filePortalBlock = `
### 📦 File Portal
- Built-in storage portal for saving build templates
- MinIO backend or S3-compatible
- AES256 encryption at rest
- Signed private URLs
- Access control via SSO
`;
  }

  // ======================================================
  // FINAL ARCHITECTURE OUTPUT
  // ======================================================

  return `
# 🏗️ DevVelocity Architecture Plan
Generated for **${cloud}** — Plan: **${plan.toUpperCase()}**

---

## 🚀 Infrastructure Overview

### Compute Layer
Using: **${compute}**

### Networking
- Fully managed firewall
- Provider-native metadata integration
- Secure bootstrapping
- Automated DNS provisioning (Cloudflare preferred)
- Auto-generated TLS certificates

---

## 🔧 Stack Summary

**Application Type:** ${buildType}  
**Automation Level:** ${automation}  
**Maintenance:** ${maintenance}  
**Budget Estimate:** ${budget}

---

${multiCloudBlock}

${securityBlock}

${scalingBlock}

${pipelineBlock}

${filePortalBlock}

---

## 🧠 AI-Optimized Provider Notes

DevVelocity chooses the best defaults per provider:

- AWS → ALB, ECR, S3, CloudWatch
- Azure → VM Scale Sets, Key Vault, Log Analytics
- GCP → MIGs, Artifact Registry, Cloud Logging
- OCI → Autoscaling, Vault, Operator Insights
- DO → DOCR, Managed LB, Spaces
- Hetzner → Simple + cost-effective compute
- Vultr → Global Vultr LB + premium storage

---

## 📦 Suggested Directory Structure

\`\`\`
/infra
  /cloud-init.yaml
  /docker-compose.yaml
  /pipelines
  /monitoring
/secrets
/env
/src
/tests
\`\`\`

---

## 📌 Next Steps
- Generate cloud-init (already handled)
- Generate docker orchestration
- Generate CI/CD pipelines
- Generate security model
- Generate budget projection
- Finalize output packaging
`;
}
