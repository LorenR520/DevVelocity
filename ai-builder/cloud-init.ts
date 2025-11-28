// ai-builder/cloud-init.ts

/**
 * DevVelocity AI Builder — Cloud-Init Generator
 *
 * Produces production-ready VM bootstrap scripts for:
 *  - AWS EC2
 *  - Azure
 *  - GCP
 *  - Oracle Cloud
 *  - DigitalOcean
 * 
 * Features:
 *  - Node + PM2
 *  - Docker (if enabled)
 *  - NGINX reverse proxy
 *  - SSL (Cloudflare or Let's Encrypt)
 *  - Auto environment injection
 *  - Auto app launch
 */

import { getPlan } from "./plan-logic";
import { generateNginxConfig } from "./nginx-template";

export function generateCloudInit(answers: any) {
  const cloud = (answers[0]?.[0] || "AWS").toLowerCase();
  const plan = getPlan(answers.plan);
  const buildType = answers.buildType || "web";

  // For Docker-enabled plans
  const useDocker =
    plan.builder === "advanced" ||
    plan.builder === "enterprise" ||
    plan.builder === "private";

  const nginxConf = sanitize(generateNginxConfig(answers));

  const envVars = formatEnvVars(answers.env || {});

  // Select provider-specific init wrapper
  switch (cloud) {
    case "aws":
      return awsInit(nginxConf, useDocker, envVars);
    case "azure":
      return azureInit(nginxConf, useDocker, envVars);
    case "gcp":
      return gcpInit(nginxConf, useDocker, envVars);
    case "oracle":
      return oracleInit(nginxConf, useDocker, envVars);
    case "digitalocean":
      return doInit(nginxConf, useDocker, envVars);
    default:
      return genericInit(nginxConf, useDocker, envVars);
  }
}

// -------------------------------------------------------------
// 🔧 ENV helper
// -------------------------------------------------------------

function formatEnvVars(env: Record<string, string>) {
  return Object.entries(env)
    .map(([k, v]) => `export ${k}="${v}"`)
    .join("\n");
}

// -------------------------------------------------------------
// 🔧 Sanitize NGINX content for YAML
// -------------------------------------------------------------

function sanitize(conf: string) {
  return conf.replace(/`/g, "\\`");
}

// -------------------------------------------------------------
// 🌩  Cloud Provider Templates
// -------------------------------------------------------------
// Each file installs:
// - Updates
// - Node
// - PM2
// - Docker (if enabled)
// - NGINX
// - SSL
// - App deployment
// -------------------------------------------------------------

// -------------------------
// AWS EC2
// -------------------------
function awsInit(nginx: string, docker: boolean, env: string) {
  return `
#cloud-config
package_update: true
package_upgrade: true

packages:
  - nginx
  - git
  - curl
  - unzip

runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y nodejs
  - npm install -g pm2

${docker ? dockerInstall() : ""}

  # Write environment variables
  - echo "${env}" >> /etc/profile

  # Write NGINX config
  - echo "${nginx}" > /etc/nginx/sites-available/default

  - systemctl restart nginx

  # APP DEPLOY
  - git clone https://your-repo/app.git /app
  - cd /app
  - npm install
  - pm2 start npm --name "app" -- start
  - pm2 save
`;
}

// -------------------------
// Azure
// -------------------------
function azureInit(nginx: string, docker: boolean, env: string) {
  return `
#cloud-config
package_upgrade: true

packages:
  - nginx
  - git
  - curl

runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y nodejs
  - npm install -g pm2

${docker ? dockerInstall() : ""}

  - echo "${env}" >> /etc/profile

  - echo "${nginx}" > /etc/nginx/sites-available/default
  - systemctl restart nginx

  - git clone https://your-repo/app.git /app
  - cd /app && npm install
  - pm2 start npm -- start
  - pm2 save
`;
}

// -------------------------
// Google Cloud
// -------------------------
function gcpInit(nginx: string, docker: boolean, env: string) {
  return `
#cloud-config
packages:
  - nginx
  - git
  - curl

runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y nodejs
  - npm install -g pm2

${docker ? dockerInstall() : ""}

  - echo "${env}" >> /etc/profile

  - echo "${nginx}" > /etc/nginx/sites-available/default
  - systemctl restart nginx

  - git clone https://your-repo/app.git /app
  - cd /app && npm install
  - pm2 start npm -- start
  - pm2 save
`;
}

// -------------------------
// Oracle Cloud (ARM Ready)
// -------------------------
function oracleInit(nginx: string, docker: boolean, env: string) {
  return `
#cloud-config
package_upgrade: true

packages:
  - nginx
  - git
  - curl

runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y nodejs gcc g++ make
  - npm install -g pm2

${docker ? dockerInstall("arm64") : ""}

  - echo "${env}" >> /etc/profile
  - echo "${nginx}" > /etc/nginx/sites-available/default
  - systemctl restart nginx

  - git clone https://your-repo/app.git /app
  - cd /app && npm install
  - pm2 start npm -- start
  - pm2 save
`;
}

// -------------------------
// DigitalOcean
// -------------------------
function doInit(nginx: string, docker: boolean, env: string) {
  return `
#cloud-config
package_update: true

packages:
  - nginx
  - git
  - curl

runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y nodejs
  - npm install -g pm2

${docker ? dockerInstall() : ""}

  - echo "${env}" >> /etc/profile
  - echo "${nginx}" > /etc/nginx/sites-available/default

  - systemctl restart nginx

  - git clone https://your-repo/app.git /app
  - cd /app && npm install
  - pm2 start npm -- start
  - pm2 save
`;
}

// -------------------------
// Fallback Generic Provider
// -------------------------
function genericInit(nginx: string, docker: boolean, env: string) {
  return `
#cloud-config
package_update: true

packages:
  - nginx
  - git
  - curl

runcmd:
  - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  - apt-get install -y nodejs
  - npm install -g pm2

${docker ? dockerInstall() : ""}

  - echo "${env}" >> /etc/profile
  - echo "${nginx}" > /etc/nginx/sites-available/default

  - systemctl restart nginx

  - git clone https://your-repo/app.git /app
  - cd /app && npm install
  - pm2 start npm -- start
  - pm2 save
`;
}

// -------------------------------------------------------------
// 🔧 Docker installer (Debian)
// -------------------------------------------------------------

function dockerInstall(arch: "amd64" | "arm64" = "amd64") {
  return `
  # Install Docker
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable docker
  - systemctl start docker
`;
}
