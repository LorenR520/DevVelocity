/**
 * DevVelocity AI Builder — Budget Engine
 *
 * Generates:
 *  - Monthly projected cloud cost
 *  - Automation overhead cost
 *  - Multi-cloud cost penalty
 *  - Recommended cost tiers
 *  - Warnings when user is under-budget
 *  - Upgrade suggestions
 */

import { getPlan } from "./plan-logic";

export function generateBudgetModel(answers: any) {
  const plan = answers.plan ?? "developer";
  const cloud = answers[0];
  const automation = answers[1];
  const providers = answers[2] || [];
  const budget = answers[4];
  const security = answers[5];

  const planMeta = getPlan(plan);

  // ===================================================================
  // 🎯 Budget Normalization (string → number)
  // ===================================================================
  const normalizedBudget = parseBudget(budget);

  // ===================================================================
  // 📌 Base Cloud Costs by Provider
  // ===================================================================
  const cloudBase = {
    AWS: 40,
    Azure: 35,
    GCP: 30,
    "Oracle Cloud": 20,
    DigitalOcean: 10,
  };

  const baseCost = cloudBase[cloud] ?? 25;

  // ===================================================================
  // ⭐ Multi-Cloud Penalty (if applicable)
  // ===================================================================
  const multiPenalty =
    providers.length > 1 ? providers.length * 20 : 0;

  // ===================================================================
  // 🤖 Automation Overhead
  // ===================================================================
  const automationMultiplier = {
    "Deployments": 10,
    "Monitoring": 15,
    "Scaling": 15,
    "Backups": 15,
    "Failover": 40,
    "CI/CD Pipelines": 20,
    "API Automation": 10,
    "Scheduled Jobs": 10,
  };

  let automationCost = 0;

  if (Array.isArray(automation)) {
    automation.forEach((a) => {
      automationCost += automationMultiplier[a] ?? 5;
    });
  }

  // ===================================================================
  // 🔐 Security Cost Modifier
  // ===================================================================
  const securityCost = calculateSecurityCost(security, plan);

  // ===================================================================
  // 📦 Tier Cost Modifier
  // ===================================================================
  const planBaseCost = planTierCost(plan);

  // ===================================================================
  // 📊 Final Projection
  // ===================================================================
  let projectedMonthly =
    baseCost +
    automationCost +
    multiPenalty +
    securityCost +
    planBaseCost;

  let projectedYearly = projectedMonthly * 12;

  // ===================================================================
  // 🚨 Budget Warnings & Upgrade Nudges
  // ===================================================================
  const warnings = [];

  if (normalizedBudget < projectedMonthly) {
    warnings.push(
      `Your projected infra cost (~$${projectedMonthly}/mo) exceeds your stated budget (${budget}).`
    );
  }

  if (providers.length > 1 && plan === "developer") {
    warnings.push(
      `Multi-cloud requires at least Startup plan. Developer will be limited to 1 provider.`
    );
  }

  if (security?.toLowerCase()?.includes("sso") && plan === "developer") {
    warnings.push(
      `SSO is not supported on Developer plan. Upgrade to Startup or higher.`
    );
  }

  // ===================================================================
  // 🧠 Return structured model
  // ===================================================================
  return {
    cloud,
    plan,
    baseCost,
    automationCost,
    multiPenalty,
    securityCost,
    planBaseCost,
    projectedMonthly: Math.round(projectedMonthly),
    projectedYearly: Math.round(projectedYearly),
    budget,
    recommended: recommendBudgetTier(projectedMonthly),
    warnings,
  };
}

// ===================================================================
// 💵 Helpers
// ===================================================================

function parseBudget(budgetString: string) {
  if (!budgetString) return 0;

  if (budgetString.includes("<$25")) return 20;
  if (budgetString.includes("$25")) return 60;
  if (budgetString.includes("$100")) return 300;
  if (budgetString.includes("$500")) return 1000;
  if (budgetString.includes("$2000")) return 2500;

  return 0;
}

function calculateSecurityCost(security: string, plan: string) {
  if (!security) return 0;

  const s = security.toLowerCase();

  if (s.includes("google") || s.includes("microsoft") || s.includes("okta") || s.includes("auth0")) {
    return plan === "enterprise" ? 50 : 30;
  }

  if (s.includes("saml") || s.includes("oidc")) return 20;

  return 0;
}

function planTierCost(plan: string) {
  switch (plan) {
    case "developer":
      return 0;
    case "startup":
      return 20;
    case "team":
      return 50;
    case "enterprise":
      return 200;
    default:
      return 0;
  }
}

function recommendBudgetTier(monthly: number) {
  if (monthly < 40) return "Developer";
  if (monthly < 200) return "Startup";
  if (monthly < 750) return "Team";
  return "Enterprise";
}
