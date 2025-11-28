// server/ai/recommendations.ts

interface BuilderInputs {
  provider: string;
  budget: "low" | "medium" | "high" | "enterprise";
  experience: "beginner" | "intermediate" | "expert";
  environment?: string;
  region?: string;
  features?: string[];
}

export async function buildRecommendation(inputs: BuilderInputs) {
  const { provider, budget, experience, features = [] } = inputs;

  let modules: string[] = [];
  let warnings: string[] = [];

  // ---------------------------
  // 🔹 PROVIDER-SPECIFIC MODULES
  // ---------------------------

  switch (provider) {
    case "aws":
      modules.push("vpc", "ec2", "iam", "s3", "cloudwatch");
      if (budget === "high" || budget === "enterprise")
        modules.push("autoscaling", "elb", "rds");
      if (features.includes("serverless")) modules.push("lambda", "api-gateway");
      break;

    case "azure":
      modules.push("resource-group", "vm", "storage", "monitor");
      if (budget !== "low") modules.push("load-balancer", "sql-db");
      if (features.includes("serverless")) modules.push("functions", "api-mgmt");
      break;

    case "gcp":
      modules.push("vpc", "compute-engine", "gcs", "stackdriver");
      if (budget !== "low") modules.push("cloud-sql", "gke");
      if (features.includes("serverless")) modules.push("cloud-run");
      break;

    case "cloudflare":
      modules.push("pages", "workers", "kv", "r2", "tunnels");
      if (experience === "expert") modules.push("durable-objects");
      break;

    case "oracle":
      modules.push("oci-vcn", "oci-compute", "oci-storage");
      if (budget !== "low") modules.push("load-balancer", "oci-database");
      break;

    default:
      warnings.push(`Unknown provider '${provider}'.`);
  }

  // ---------------------------
  // 🔹 EXPERIENCE LEVEL FILTERS
  // ---------------------------

  if (experience === "beginner") {
    modules = modules.filter(
      (m) =>
        ![
          "autoscaling",
          "gke",
          "cloud-sql",
          "durable-objects",
          "api-gateway",
          "lambda"
        ].includes(m)
    );
    warnings.push("Some advanced modules removed for beginner mode.");
  }

  // ---------------------------
  // 🔹 BUDGET FILTERS
  // ---------------------------

  if (budget === "low") {
    modules = modules.filter(
      (m) =>
        ![
          "elb",
          "rds",
          "cloud-sql",
          "gke",
          "oci-database",
          "api-mgmt"
        ].includes(m)
    );
    warnings.push("High-cost modules removed for budget settings.");
  }

  // ---------------------------
  // 🔹 OPTIONAL FEATURE LOGIC
  // ---------------------------

  if (features.includes("monitoring-advanced"))
    modules.push("grafana", "prometheus");

  if (features.includes("security-hardened"))
    modules.push("waf", "csp", "zero-trust");

  // Deduplicate
  modules = [...new Set(modules)];

  return {
    provider,
    modules,
    warnings,
  };
}
