// ai-builder/pipelines.ts

/**
 * DevVelocity — Pipeline Generator
 *
 * Generates CI/CD pipelines for:
 *  - GitHub Actions
 *  - GitLab CI
 *  - Bitbucket Pipelines
 *  - Azure DevOps YAML
 *  - CircleCI
 *  - AWS CodePipeline (template)
 *  - Google Cloud Build
 *  - Oracle DevOps (template)
 *
 * Automatically adapts to:
 *  - Docker / non-Docker builds
 *  - Multi-cloud deployment
 *  - Plan tier limits
 *  - Security level
 *  - Automation preferences
 */

import { getPlan, hasFeature } from "./plan-logic";

export function generatePipelines(answers: any) {
  const plan = getPlan(answers.plan);
  const automation = answers.automation || [];
  const useDocker =
    plan.builder === "advanced" ||
    plan.builder === "enterprise" ||
    plan.builder === "private";

  const multiCloud =
    hasFeature(answers.plan, "multi_cloud") &&
    answers.multiCloud === "Yes — deploy identical stacks";

  return {
    github: githubActions(useDocker, multiCloud),
    gitlab: gitlabCi(useDocker, multiCloud),
    bitbucket: bitbucketPipeline(useDocker),
    azure: azurePipeline(useDocker),
    circleci: circleCi(useDocker),
    aws: awsPipeline(),
    gcp: gcpCloudBuild(useDocker),
    oracle: oracleDevOpsTemplate(),

    upgradeNotes: buildUpgradeNotes(plan, answers),
  };
}

/* ------------------------------------------------------------
  UPGRADE NOTES — If user selects automations beyond their plan
------------------------------------------------------------ */
function buildUpgradeNotes(plan: any, answers: any) {
  const notes = [];

  if (
    answers.automation?.includes("Failover") &&
    plan.automation.multi_cloud_failover !== true
  ) {
    notes.push("Failover automation requires the Team plan or higher.");
  }

  if (
    answers.multiCloud &&
    plan.providers === 1
  ) {
    notes.push("Multi-cloud deployments require Startup or higher.");
  }

  if (
    answers.security?.includes("SSO") &&
    plan.sso === "none"
  ) {
    notes.push("SSO requires the Startup plan or higher.");
  }

  return notes;
}

/* ------------------------------------------------------------
  GitHub Actions
------------------------------------------------------------ */
function githubActions(docker: boolean, multi: boolean) {
  return `
name: Deploy Application

on:
  push:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      ${docker ? dockerGithub() : nodeGithub()}

      - name: Deploy
        run: |
          echo "Deploying to server..."
          # SSH or cloud-provider deploy commands here
          ${multi ? "# Multi-cloud sync enabled" : ""}
`;
}

function nodeGithub() {
  return `
      - name: Install Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Build
        run: npm run build
`;
}

function dockerGithub() {
  return `
      - name: Build Docker Image
        run: docker build -t app .

      - name: Push Image
        run: echo "Push to registry here"
`;
}

/* ------------------------------------------------------------
  GitLab CI
------------------------------------------------------------ */
function gitlabCi(docker: boolean, multi: boolean) {
  return `
stages:
  - build
  - deploy

build:
  stage: build
  script:
    - npm install
    - npm run build

deploy:
  stage: deploy
  script:
    - echo "Deploying..."
    ${multi ? "# Multi-cloud replication" : ""}
`;
}

/* ------------------------------------------------------------
  Bitbucket Pipelines
------------------------------------------------------------ */
function bitbucketPipeline(docker: boolean) {
  return `
pipelines:
  default:
    - step:
        name: Build
        image: node:20
        script:
          - npm install
          - npm run build
`;
}

/* ------------------------------------------------------------
  Azure DevOps Pipeline
------------------------------------------------------------ */
function azurePipeline(docker: boolean) {
  return `
trigger:
  - main

pool:
  vmImage: ubuntu-latest

steps:
  - checkout: self
  - task: NodeTool@0
    inputs:
      version: "20"
  - script: |
      npm install
      npm run build
    displayName: "Build"
`;
}

/* ------------------------------------------------------------
  CircleCI
------------------------------------------------------------ */
function circleCi(docker: boolean) {
  return `
version: 2.1

jobs:
  build:
    docker:
      - image: node:20
    steps:
      - checkout
      - run: npm install
      - run: npm run build

workflows:
  build:
    jobs:
      - build
`;
}

/* ------------------------------------------------------------
  AWS CodePipeline (Template)
------------------------------------------------------------ */
function awsPipeline() {
  return `
# AWS CodePipeline typical buildspec.yml placeholder
version: 0.2

phases:
  install:
    commands:
      - npm install
  build:
    commands:
      - npm run build
`;
}

/* ------------------------------------------------------------
  Google Cloud Build
------------------------------------------------------------ */
function gcpCloudBuild(docker: boolean) {
  return `
steps:
  - name: node:20
    entrypoint: npm
    args: ["install"]

  - name: node:20
    entrypoint: npm
    args: ["run", "build"]

  ${docker ? gcpDockerStep() : ""}
`;
}

function gcpDockerStep() {
  return `
  - name: "gcr.io/cloud-builders/docker"
    args: ["build", "-t", "gcr.io/PROJECT/app", "."]
`;
}

/* ------------------------------------------------------------
  Oracle DevOps Template
------------------------------------------------------------ */
function oracleDevOpsTemplate() {
  return `
# Oracle DevOps Pipeline Template
steps:
  - checkout
  - run: npm install
  - run: npm run build
`;
}
