// ai-builder/cloud-init.ts

/**
 * DevVelocity AI Builder — Cloud Init Generator
 *
 * Generates production-ready cloud-init based on:
 *  - Cloud provider
 *  - Budget tier
 *  - Plan limitations
 *  - Automation tasks
 *  - Security requirements
 *  - Build type (API, Web, Serverless, Worker, DB, etc)
 */

import { getPlan } from "./plan-logic";

export function generateCloudInit(answers: any) {
  const plan = getPlan(answers.plan);
  const provider = (answers[0]?.[0] || "AWS").toLowerCase();
  const buildType = answers.buildType || "web";
  const tasks = answers[2] || [];

  const enableDocker =
    ["web", "api", "fullstack", "docker"].includes(buildType);

  const enableAgent =
    plan.id !== "developer"; // Only developer excludes observability

  const enableFirewall = plan.security !== "none";
  const enableFail2Ban = plan.security !== "none";

  const enableSSOAgent =
    plan.sso === "advanced" || plan.sso === "enterprise";

  const enableAutoUpdates =
    plan.updates !== "none";

  const enableCron =
    tasks.includes("Scheduled Jobs") ||
    plan.automation?.scheduled_tasks !== "basic";

  // -----------------------------
  // Provider-specific metadata
  // -----------------------------

  const providerBanner = {
    aws: "🚀 AWS Instance Bootstrapped",
    azure: "☁️ Azure VM Bootstrapped",
    gcp: "🌎 GCP VM Bootstrapped",
    oracle: "🔥 OCI Ampere VM Bootstrapped",
    digitalocean: "🌊 DigitalOcean Droplet Bootstrapped",
    hetzner: "⚡ Hetzner Server Provisioned",
    linode: "🌐 Linode Server Provisioned",
  }[provider] || "🔧 Generic Linux VM Bootstrapped";

  // -----------------------------
  // BEGIN Cloud Init
  // -----------------------------

  return `#cloud-config

package_update: true
package_upgrade: ${enableAutoUpdates ? "true" : "false"}

hostname: devvelocity-node
fqdn: devvelocity-node.internal

write_files:
  - path: /etc/motd
    permissions: "0644"
    content: |
      ##############################################
      ${providerBanner}
      Managed by DevVelocity AI Builder
      ##############################################

${enableDocker ? writeDockerSection() : ""}

${enableFirewall ? writeFirewallSection() : ""}

${enableFail2Ban ? writeFail2BanSection() : ""}

${enableAgent ? writeMonitoringSection(provider) : ""}

${enableCron ? writeCronSection() : ""}

runcmd:
  - echo "Running startup tasks..."

  ${enableDocker ? dockerStartCmds() : ""}
  ${enableFirewall ? " - systemctl enable ufw && systemctl start ufw" : ""}
  ${enableFail2Ban ? " - systemctl enable fail2ban && systemctl start fail2ban" : ""}
  ${enableAgent ? monitoringStartCmds() : ""}

  - echo "DevVelocity AI Builder provisioning complete."
`;
}

// -----------------------------
// SECTION BUILDERS
// -----------------------------

function writeDockerSection() {
  return `
  - path: /etc/systemd/system/docker.service.d/devvelocity.conf
    permissions: "0644"
    content: |
      [Service]
      ExecStartPost=/usr/bin/docker ps

packages:
  - docker.io
  - docker-compose-plugin
`;
}

function dockerStartCmds() {
  return `
  - systemctl enable docker
  - systemctl start docker
`;
}

function writeFirewallSection() {
  return `
packages:
  - ufw

runcmd:
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22
  - ufw allow 80
  - ufw allow 443
  - ufw --force enable
`;
}

function writeFail2BanSection() {
  return `
packages:
  - fail2ban

write_files:
  - path: /etc/fail2ban/jail.local
    permissions: "0644"
    content: |
      [sshd]
      enabled = true
      bantime = 10m
      maxretry = 5
`;
}

function writeMonitoringSection(provider: string) {
  return `
packages:
  - curl
  - htop
  - sysstat

write_files:
  - path: /etc/devvelocity-monitor
    permissions: "0755"
    content: |
      SERVER_PROVIDER="${provider}"
      ENABLE_METRICS="true"
      ENABLE_LOG_PUSH="true"
`;
}

function monitoringStartCmds() {
  return `
  - echo "Starting metrics collection..."
  - systemctl restart sysstat
`;
}

function writeCronSection() {
  return `
write_files:
  - path: /etc/cron.daily/devvelocity-maintenance
    permissions: "0755"
    content: |
      #!/bin/bash
      echo "Running daily maintenance..."
      apt-get update -y
      apt-get autoremove -y
`;
}
