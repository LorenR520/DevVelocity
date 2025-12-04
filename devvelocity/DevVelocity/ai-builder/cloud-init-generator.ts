/**
 * DevVelocity AI — Cloud-Init Generator
 *
 * Generates cloud-init for any cloud provider.
 * Dynamically adapts to:
 *  - selected cloud
 *  - automation complexity
 *  - security tier
 *  - budget
 *  - expansion packs
 *  - provider-native networking & metadata
 */

import { getAllowedCapabilities } from "./plan-logic";

export function generateCloudInit(answers: any) {
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
  // PROVIDER-SPECIFIC BASE PACKAGES
  // ======================================================
  const providerPackages: Record<string, string[]> = {
    AWS: ["awscli", "cloud-guest-utils"],
    Azure: ["azure-cli", "walinuxagent"],
    GCP: ["google-cloud-cli", "google-osconfig-agent"],
    "Oracle Cloud": ["oci-cli"],
    DigitalOcean: ["do-agent"],
    Hetzner: ["hcloud"],
    Vultr: ["vultr-cli"],
  };

  const packages =
    providerPackages[cloud] || ["curl", "git", "docker.io", "docker-compose"];

  // Add universal tooling
  packages.push(
    "curl",
    "git",
    "ufw",
    "docker.io",
    "docker-compose-plugin",
    "fail2ban"
  );

  if (security === "advanced" || security === "enterprise") {
    packages.push("unattended-upgrades", "auditd");
  }

  // ======================================================
  // NETWORKING — UNIVERSAL + CLOUD NATIVE
  // ======================================================
  let networkingConfig = `
# NETWORKING CONFIGURATION
manage_etc_hosts: true
fqdn: devvelocity-instance
preserve_hostname: false
`;

  if (caps.builder !== "basic") {
    networkingConfig += `
# Enable firewall
runcmd:
  - ufw allow OpenSSH
  - ufw allow 80
  - ufw allow 443
  - ufw --force enable
`;
  }

  // Team/Enterprise get auto-hardening
  if (plan === "team" || plan === "enterprise") {
    networkingConfig += `
  - sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
  - systemctl restart sshd
`;
  }

  // Enterprise gets DDoS-prep
  if (plan === "enterprise") {
    networkingConfig += `
  - ufw limit 2222/tcp
  - apt-get install -y fail2ban
  - systemctl enable fail2ban
`;
  }

  // ======================================================
  // FILE PORTAL MOUNTING (Enterprise Only)
  // ======================================================
  let filePortalMount = "";

  if (plan === "enterprise") {
    filePortalMount = `
# FILE PORTAL STORAGE
write_files:
  - path: /etc/devvelocity/portal.conf
    permissions: "0644"
    content: |
      storage_backend: minio
      bucket: devvelocity-files
      encryption: AES256
`;
  }

  // ======================================================
  // CLOUD-INIT TEMPLATE
  // ======================================================
  const cloudInit = `
#cloud-config

package_update: true
package_upgrade: true

packages:
${packages.map((p) => `  - ${p}`).join("\n")}

${filePortalMount}

${networkingConfig}

write_files:
  - path: /etc/motd
    permissions: "0644"
    content: |
      Welcome to DevVelocity
      Cloud: ${cloud}
      Plan: ${plan}

runcmd:
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable docker
  - systemctl start docker
  - mkdir -p /opt/devvelocity
  - cd /opt/devvelocity
  - git clone https://github.com/LorenR520/DevVelocity.git app
  - cd app
  - docker compose up -d
  - echo "DevVelocity deployment completed."
`;

  return cloudInit.trim();
}
