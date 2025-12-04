// ai-builder/nginx-template.ts

/**
 * DevVelocity AI Builder — NGINX Config Generator
 *
 * Generates:
 *  - SSL-ready production reverse proxy
 *  - Auto HTTP→HTTPS redirect
 *  - Static file caching
 *  - Compression
 *  - API routing
 *  - Multi-cloud optimizations
 *  - Load balancing (Team + Enterprise)
 *  - WebSockets support
 */

import { getPlan } from "./plan-logic";

export function generateNginxConfig(answers: any) {
  const plan = getPlan(answers.plan);
  const provider = (answers[0]?.[0] || "AWS").toLowerCase();
  const buildType = answers.buildType || "web";

  const enableLoadBalancing = plan.id === "team" || plan.id === "enterprise";
  const enableEnterprise = plan.id === "enterprise";

  // Provider-sensitive optimizations
  const providerHints = getProviderOptimizations(provider);

  // SSL mode
  const sslMode = provider === "cloudflare" ? "cloudflare" : "lets_encrypt";

  let upstream = "";
  if (enableLoadBalancing) {
    upstream = `
upstream app_servers {
    server app:3000;
    server app_replica_one:3000;
    server app_replica_two:3000;
}
`;
  }

  const proxyTarget = enableLoadBalancing ? "app_servers" : "app:3000";

  return `
# -----------------------------------------------------------
# DevVelocity Auto-Generated NGINX Config
# Cloud Provider: ${provider}
# Build Type: ${buildType}
# Tier: ${plan.name}
# -----------------------------------------------------------

${upstream}

server {
    listen 80;
    server_name _;

    # Redirect HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;

    # -------------------------
    # SSL Handling
    # -------------------------
    ${sslMode === "cloudflare" ? cloudflareSSL() : letsEncryptSSL()}

    # -------------------------
    # Logging
    # -------------------------
    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log warn;

    # -------------------------
    # Compression
    # -------------------------
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml+rss;
    gzip_min_length 1000;

    # -------------------------
    # Static File Caching
    # -------------------------
    location /_next/static/ {
        alias /app/.next/static/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # -------------------------
    # Web App Routing
    # -------------------------
    location / {
        proxy_pass http://${proxyTarget};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        # Provider-optimized proxy settings
        ${providerHints}
    }

    # -------------------------
    # API Routing
    # -------------------------
    location /api/ {
        proxy_pass http://${proxyTarget};
        proxy_set_header Host $host;
        proxy_http_version 1.1;
    }
}
`;
}

// -----------------------------------------------------------------------------
// Provider-Specific Optimizations
// -----------------------------------------------------------------------------

function getProviderOptimizations(provider: string) {
  switch (provider) {
    case "aws":
      return `
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        # Optimized for EC2 networking
      `;
    case "oracle":
      return `
        proxy_buffers 16 16k;
        proxy_buffer_size 32k;
        # Oracle Cloud ARM optimized buffer settings
      `;
    case "azure":
      return `
        proxy_read_timeout 180s;
        # Azure load balancer compatible timeouts
      `;
    case "gcp":
      return `
        proxy_buffering on;
        # GCP LB prefers buffering enabled
      `;
    case "digitalocean":
      return `
        keepalive_timeout 65;
        # Droplet-optimized keepalive settings
      `;
    default:
      return `
        proxy_read_timeout 120s;
      `;
  }
}

// -----------------------------------------------------------------------------
// SSL Templates
// -----------------------------------------------------------------------------

function cloudflareSSL() {
  return `
    # SSL handled by Cloudflare edge
    ssl_certificate     /etc/ssl/certs/cloudflare.crt;
    ssl_certificate_key /etc/ssl/private/cloudflare.key;
  `;
}

function letsEncryptSSL() {
  return `
    # Let's Encrypt Certificate (Certbot)
    ssl_certificate      /etc/letsencrypt/live/devvelocity/fullchain.pem;
    ssl_certificate_key  /etc/letsencrypt/live/devvelocity/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  `;
}
