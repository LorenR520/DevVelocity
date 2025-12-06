// server/ai/recommendations.ts
// ------------------------------------------------------
//  DevVelocity — AI-Assisted Recommendation Engine
// ------------------------------------------------------
//  This module produces lightweight "pre-AI" recommendations
//  to guide the Builder Engine. It ensures:
//
//   ✓ Provider suggestion
//   ✓ Architecture suggestion
//   ✓ Database recommendation
//   ✓ Compliance + security shaping
//   ✓ Tier-aware limitations
//
//  No heavy AI calls here — this is deterministic logic
//  designed to boost accuracy and stability of GPT-5.1 output.
// ------------------------------------------------------

import pricing from "@/marketing/pricing.json";

// -------------------------------
// TYPES
// -------------------------------
export interface RecommendationInputs {
  cloudPreference: string;
  workloadType: string;
  budget: string;
  experience: string;

  sla: string;
  dbPreference: string;

  compliance: {
    hipaa?: boolean;
    soc2?: boolean;
    pci?: boolean;
    fedramp?: boolean;
    gdpr?: boolean;
  };

  securityLevel: string;

  expectedUsers: number;
  expectedQps: number;
}

export interface RecommendationOutput {
  recommendedProvider: string;
  recommendedCompute: string;
  recommendedDatabase: string;
  recommendedRedundancy: string;
  riskFactors: string[];
  notes: string[];
}

// ------------------------------------------------------
// MAIN RECOMMENDATION ENGINE
// ------------------------------------------------------
export function getRecommendations(input: RecommendationInputs): RecommendationOutput {
  const notes: string[] = [];
  const risks: string[] = [];

  // ------------------------------------------
  // CLOUD PROVIDER SELECTION
  // ------------------------------------------
  let provider = input.cloudPreference;

  if (provider === "auto") {
    provider = selectProviderByWorkload(input);
    notes.push(`Provider auto-selected based on workload: ${provider}`);
  }

  // ------------------------------------------
  // REDUNDANCY BASED ON SLA
  // ------------------------------------------
  const redundancy = {
    "99.0": "single-zone",
    "99.5": "single-zone + backups",
    "99.9": "multi-AZ",
    "99.99": "multi-AZ + load balancer",
    "99.999": "multi-cloud failover",
  }[input.sla];

  // ------------------------------------------
  // COMPUTE SUGGESTION
  // ------------------------------------------
  const compute = recommendCompute(provider, input.workloadType, input.experience);

  // ------------------------------------------
  // DATABASE SUGGESTION
  // ------------------------------------------
  const database = recommendDatabase(provider, input.dbPreference);

  // ------------------------------------------
  // COMPLIANCE RISK ANALYSIS
  // ------------------------------------------
  evaluateCompliance(input, risks, notes);

  // ------------------------------------------
  // LOAD FINAL RESULT
  // ------------------------------------------
  return {
    recommendedProvider: provider,
    recommendedCompute: compute,
    recommendedDatabase: database,
    recommendedRedundancy: redundancy,
    riskFactors: risks,
    notes,
  };
}

// ------------------------------------------------------
// PROVIDER LOGIC
// ------------------------------------------------------
function selectProviderByWorkload(input: RecommendationInputs): string {
  switch (input.workloadType) {
    case "latency-sensitive":
    case "realtime":
      return "cloudflare";

    case "compute-heavy":
    case "ai-ml":
      return "aws";

    case "data-heavy":
      return "gcp";

    case "event-driven":
      return "aws";

    default:
      return "cloudflare";
  }
}

// ------------------------------------------------------
// COMPUTE ENGINE
// ------------------------------------------------------
function recommendCompute(provider: string, workload: string, exp: string): string {
  if (provider === "cloudflare") return "Cloudflare Workers";

  if (provider === "aws") {
    if (workload === "compute-heavy" || workload === "ai-ml") return "EC2 AutoScale";
    return "Lambda";
  }

  if (provider === "gcp") {
    if (workload === "data-heavy") return "Cloud Run + BigQuery adjacency";
    return "Cloud Run";
  }

  if (provider === "azure") return "Azure Functions";

  if (provider === "oracle") return "OCI Functions";

  return "Cloudflare Workers";
}

// ------------------------------------------------------
// DATABASE ENGINE
// ------------------------------------------------------
function recommendDatabase(provider: string, pref: string): string {
  if (pref === "sql") {
    switch (provider) {
      case "aws":
        return "RDS Postgres";
      case "gcp":
        return "Cloud SQL Postgres";
      case "azure":
        return "Azure Postgres";
      default:
        return "Supabase Postgres";
    }
  }

  if (pref === "nosql") {
    switch (provider) {
      case "aws":
        return "DynamoDB";
      case "gcp":
        return "Firestore";
      case "cloudflare":
        return "Cloudflare KV";
      default:
        return "Cloudflare KV";
    }
  }

  return "Hybrid (Supabase SQL + Cloudflare KV)";
}

// ------------------------------------------------------
// COMPLIANCE ANALYSIS
// ------------------------------------------------------
function evaluateCompliance(input: RecommendationInputs, risks: string[], notes: string[]) {
  const { compliance, expectedUsers, expectedQps } = input;

  if (compliance.hipaa || compliance.pci) {
    risks.push("Requires high security and encryption standards.");
    notes.push("Ensure database encryption-at-rest and end-to-end MFA.");
  }

  if (compliance.fedramp) {
    risks.push("FedRAMP workloads must not run on unsupported providers.");
    notes.push("Only AWS GovCloud or Azure Government permitted.");
  }

  if (expectedUsers > 100000) {
    risks.push("High user load may require multi-region failover.");
  }

  if (expectedQps > 2000) {
    risks.push("Throughput may require autoscaling or queueing.");
  }
}
