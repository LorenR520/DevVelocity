// ai-builder/docker.ts

/**
 * DevVelocity AI Builder — Docker + Compose Generator
 *
 * Generates:
 *  - Dockerfile
 *  - docker-compose.yml
 *  - NGINX reverse proxy (if required)
 *  - DB cache layers (Postgres, Redis)
 *  - Auto-update behavior based on plan tier
 *  - Cloud-tuned optimizations
 */

import { getPlan } from "./plan-logic";

export function generateDockerStack(answers: any) {
  const plan = getPlan(answers.plan);
  const provider = (answers[0]?.[0] || "AWS").toLowerCase();
  const buildType = answers.buildType || "web";
  const tasks = answers[2] || [];

  const wantsDB = buildType === "fullstack" || buildType === "api";
  const wantsCache = tasks.includes("Scaling") || buildType === "fullstack";

  const enableNGINX = buildType === "web" || buildType === "fullstack";
  const enableAutoRestart = plan.updates !== "none";

  const dockerfile = generateDockerFile(buildType, provider);
  const compose = generateCompose(buildType, {
    wantsDB,
    wantsCache,
    enableNGINX,
    enableAutoRestart,
  });

  return {
    dockerfile,
    compose,
  };
}

// -----------------------------------------------------------------------------
// DOCKERFILE GENERATOR
// -----------------------------------------------------------------------------

function generateDockerFile(buildType: string, provider: string) {
  const base = provider === "oracle" ? "arm64" : "amd64";

  return `
# ---------------------------------------------------------
# DevVelocity Auto-Generated Dockerfile
# Cloud Provider: ${provider}
# Architecture: ${base}
# Build Type: ${buildType}
# ---------------------------------------------------------

FROM node:20-${base} AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

FROM node:20-${base}
WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
`;
}

// -----------------------------------------------------------------------------
// COMPOSE GENERATOR
// -----------------------------------------------------------------------------

function generateCompose(
  buildType: string,
  opts: {
    wantsDB: boolean;
    wantsCache: boolean;
    enableNGINX: boolean;
    enableAutoRestart: boolean;
  }
) {
  const { wantsDB, wantsCache, enableNGINX, enableAutoRestart } = opts;

  let services = `
services:
  app:
    build: .
    container_name: devvelocity_app
    ports:
      - "3000:3000"
    restart: ${enableAutoRestart ? "always" : "no"}
    environment:
      - NODE_ENV=production
`;

  if (enableNGINX) {
    services += `
  nginx:
    image: nginx:latest
    container_name: devvelocity_nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
    restart: ${enableAutoRestart ? "always" : "no"}
`;
  }

  if (wantsDB) {
    services += `
  postgres:
    image: postgres:15
    container_name: devvelocity_db
    restart: ${enableAutoRestart ? "always" : "no"}
    environment:
      POSTGRES_PASSWORD=devvelocity
      POSTGRES_USER=devvelocity
      POSTGRES_DB=devvelocity
    volumes:
      - db_data:/var/lib/postgresql/data
`;
  }

  if (wantsCache) {
    services += `
  redis:
    image: redis:7
    container_name: devvelocity_cache
    restart: ${enableAutoRestart ? "always" : "no"}
`;
  }

  let volumes = `
volumes:
  db_data:
`;

  return `# ---------------------------------------------------------
# DevVelocity Auto-Generated docker-compose.yml
# ---------------------------------------------------------

version: "3.9"

${services}
${wantsDB ? volumes : ""}
`;
}
