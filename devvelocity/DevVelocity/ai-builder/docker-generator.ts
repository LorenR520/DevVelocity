/**
 * DevVelocity AI: Docker Generator
 *
 * Generates a fully runnable docker-compose.yaml tailored to:
 *  - Cloud provider
 *  - Plan tier capabilities
 *  - Security model
 *  - App complexity
 *  - Budget constraints
 *  - Automation goals
 *  - Expansion packs (networking, payments, SSO, observability)
 */

import { getAllowedCapabilities } from "./plan-logic";

export function generateDockerCompose(answers: any) {
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

  // --------------------------
  // Base services always included
  // --------------------------
  const services: any = {
    app: {
      image: "node:20",
      restart: "always",
      working_dir: "/app",
      volumes: ["./:/app"],
      command: "npm run start",
      networks: ["devnet"],
    },
    nginx: {
      image: "nginx:alpine",
      restart: "always",
      volumes: ["./nginx.conf:/etc/nginx/nginx.conf"],
      ports: ["80:80", "443:443"],
      networks: ["devnet"],
    },
  };

  // -----------------------------------------------------
  // Databases — Smart selection based on cloud + budget
  // -----------------------------------------------------
  if (budget === "<$25") {
    services.db = {
      image: "postgres:15",
      restart: "always",
      environment: {
        POSTGRES_PASSWORD: "devpassword",
        POSTGRES_USER: "devuser",
      },
      volumes: ["db-data:/var/lib/postgresql/data"],
      networks: ["devnet"],
    };
  } else {
    // High availability database container
    services.db = {
      image: "postgres:15",
      restart: "always",
      environment: {
        POSTGRES_PASSWORD: "secure_pass_123",
        POSTGRES_USER: "dev",
      },
      deploy: {
        replicas: 1,
        restart_policy: { condition: "on-failure" },
      },
      volumes: ["db-data:/var/lib/postgresql/data"],
      networks: ["devnet"],
    };
  }

  // -----------------------
  // Redis for automation
  // -----------------------
  if (automation?.includes("CI/CD") || automation?.includes("Scaling")) {
    services.redis = {
      image: "redis:7",
      restart: "always",
      networks: ["devnet"],
    };
  }

  // -----------------------
  // Object Storage (MinIO)
  // -----------------------
  if (
    buildType?.includes("media") ||
    buildType?.includes("api") ||
    description?.includes("files") ||
    security === "advanced"
  ) {
    services.minio = {
      image: "minio/minio",
      command: "server /data",
      environment: {
        MINIO_ROOT_USER: "admin",
        MINIO_ROOT_PASSWORD: "password123",
      },
      ports: ["9000:9000"],
      volumes: ["minio-data:/data"],
      networks: ["devnet"],
    };
  }

  // ------------------------------------------
  // Queue workers (Team + Enterprise tiers)
  // ------------------------------------------
  if (
    caps.automation.ci_cd !== "basic" ||
    automation?.includes("API Automation")
  ) {
    services.worker = {
      image: "node:20",
      working_dir: "/app",
      volumes: ["./:/app"],
      command: "npm run worker",
      networks: ["devnet"],
    };
  }

  // ------------------------------------------
  // Observability Stack (Enterprise + Team)
  // ------------------------------------------
  if (caps.automation.observability === "full") {
    services.grafana = {
      image: "grafana/grafana:latest",
      ports: ["3000:3000"],
      networks: ["devnet"],
    };

    services.prometheus = {
      image: "prom/prometheus:latest",
      volumes: ["./prometheus.yml:/etc/prometheus/prometheus.yml"],
      ports: ["9090:9090"],
      networks: ["devnet"],
    };
  }

  // --------------------------
  // Build final compose file
  // --------------------------
  const yaml = `
version: "3.9"

services:
${Object.entries(services)
  .map(([name, config]) => formatService(name, config))
  .join("\n")}

networks:
  devnet:
    driver: bridge

volumes:
  db-data:
  minio-data:
`;

  return yaml.trim();
}

/* Format a single docker-compose service block */
function formatService(name: string, config: any): string {
  let out = `  ${name}:\n`;

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      out += `    ${key}: ${value}\n`;
    } else if (Array.isArray(value)) {
      out += `    ${key}:\n`;
      value.forEach((v) => {
        out += `      - ${v}\n`;
      });
    } else if (typeof value === "object") {
      out += `    ${key}:\n`;
      for (const [subKey, subVal] of Object.entries(value)) {
        out += `      ${subKey}: ${JSON.stringify(subVal).replace(/"/g, "")}\n`;
      }
    }
  }

  return out;
}
