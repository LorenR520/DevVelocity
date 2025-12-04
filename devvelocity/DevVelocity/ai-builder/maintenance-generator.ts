/**
 * DevVelocity AI Builder — Maintenance Engine
 *
 * Generates:
 *  - Maintenance tier plan
 *  - Monitoring stack recommendations
 *  - Backup frequency + retention
 *  - Patch schedules
 *  - Failover preparedness level
 *  - Human vs AI maintenance responsibilities
 *  - Upgrade nudges when user demands exceed plan limits
 */

import { getPlan } from "./plan-logic";

export function generateMaintenancePlan(answers: any) {
  const plan = answers.plan ?? "developer";
  const maintenance = answers[3];
  const providers = answers[2] || [];
  const automation = answers[1] || [];
  const cloud = answers[0];

  const planMeta = getPlan(plan);

  // ===================================================================
  // 🧩 maintenance level normalizer
  // ===================================================================

  const normalizedMaintenance = normalizeMaintenance(maintenance);

  // ===================================================================
  // 🌐 multi-cloud resilience level
  // ===================================================================
  const multiCloud = providers.length > 1;

  const failoverLevel = multiCloud
    ? normalizedMaintenance >= 2
      ? "Active/Active cross-cloud failover"
      : "Passive failover between cloud providers"
    : "Single-cloud — failover limited";

  // ===================================================================
  // 🛡 monitoring stack recommendations
  // ===================================================================
  const monitoring = buildMonitoringStack(plan, normalizedMaintenance, cloud);

  // ===================================================================
  // 💾 backup strategy
  // ===================================================================
  const backup = buildBackupPolicy(plan, normalizedMaintenance, multiCloud);

  // ===================================================================
  // 🛠 patching cycles
  // ===================================================================
  const patching = buildPatchingSchedule(plan, normalizedMaintenance);

  // ===================================================================
  // 🧠 AI maintenance role
  // ===================================================================
  const aiRole = getAIResponsibilityLevel(plan, normalizedMaintenance);

  // ===================================================================
  // 🔥 upgrade nudges
  // ===================================================================
  const upgrades = [];

  if (multiCloud && plan === "developer") {
    upgrades.push(
      "Multi-cloud redundancy requires at least the Startup plan. Developer plan supports single-cloud only."
    );
  }

  if (normalizedMaintenance === 0 && automation.includes("failover")) {
    upgrades.push(
      "Failover automation requires higher maintenance levels. Consider Startup or Team for automated health checks + failover orchestration."
    );
  }

  if (plan === "developer" && normalizedMaintenance >= 2) {
    upgrades.push(
      "Advanced monitoring and uptime SLAs require Startup or Team plan."
    );
  }

  // ===================================================================
  // 🧠 final maintenance result model
  // ===================================================================

  return {
    plan,
    maintenancePreference: maintenance,
    multiCloud,
    failoverLevel,
    monitoring,
    backup,
    patching,
    aiRole,
    upgradeSuggestions: upgrades,
  };
}

// ===================================================================
// 🔧 helpers
// ===================================================================

function normalizeMaintenance(level: string) {
  if (!level) return 0;

  if (level.includes("None")) return 0;
  if (level.includes("Minimal")) return 1;
  if (level.includes("Medium")) return 2;
  if (level.includes("High")) return 3;

  return 0;
}

function buildMonitoringStack(plan: string, level: number, cloud: string) {
  const base = ["Uptime checks", "Basic logs", "Error alerts"];

  const enhanced = [
    "Distributed tracing",
    "Full metrics dashboard",
    "Synthetic tests",
    "AI anomaly detection",
  ];

  // Developer (low)
  if (plan === "developer") {
    if (level === 0) return base.slice(0, 2);
    if (level === 1) return base;
    return [...base, "Upgrade to Startup for advanced monitoring"];
  }

  // Startup
  if (plan === "startup") {
    if (level <= 1) return [...base, "Basic dashboard (Prometheus/Grafana-lite)"];
    if (level === 2) return [...base, ...enhanced.slice(0, 2)];
    return [...base, ...enhanced];
  }

  // Team
  if (plan === "team") {
    return [...base, ...enhanced];
  }

  // Enterprise
  return [
    ...base,
    ...enhanced,
    "AI-driven RCA pipeline",
    "Compliance-grade audit logging",
    `Cloud-native monitoring (${cloud} best practices)`,
  ];
}

function buildBackupPolicy(plan: string, level: number, multi: boolean) {
  const base = {
    freq: "Daily",
    retention: "7 days",
  };

  const advanced = {
    freq: "Hourly",
    retention: "30 days",
  };

  const enterprise = {
    freq: "Continuous snapshots",
    retention: "1 year",
  };

  if (plan === "developer") {
    return level === 0 ? base : { freq: "Every 12 hours", retention: "14 days" };
  }

  if (plan === "startup") {
    return level <= 1 ? base : advanced;
  }

  if (plan === "team") {
    return multi ? advanced : { freq: "Every 6 hours", retention: "60 days" };
  }

  return enterprise;
}

function buildPatchingSchedule(plan: string, level: number) {
  if (plan === "developer") {
    return level === 0
      ? "Monthly patch cycle"
      : "Bi-weekly patches (auto-applied)";
  }

  if (plan === "startup") {
    return level <= 1 ? "Bi-weekly patches" : "Weekly patches";
  }

  if (plan === "team") {
    return "Weekly patches + rolling restarts";
  }

  return "Continuous patching + zero-downtime rolling waves";
}

function getAIResponsibilityLevel(plan: string, level: number) {
  if (plan === "developer") {
    return level === 0
      ? "AI handles basic monitoring only"
      : "AI handles monitoring + alerts; user handles emergencies";
  }

  if (plan === "startup") {
    return "AI runs monitoring, backups, and scaling; user only handles manual overrides";
  }

  if (plan === "team") {
    return "AI handles nearly all maintenance, auto-remediation, and predictive scaling";
  }

  return "AI is primary maintainer with enterprise-grade auto-remediation and compliance workflows";
}
