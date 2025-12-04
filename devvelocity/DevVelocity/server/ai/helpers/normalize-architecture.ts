// server/ai/helpers/normalize-architecture.ts

/**
 * Normalizes an AI-generated or user-supplied architecture JSON.
 * This ensures the structure is consistent before:
 *   - saving
 *   - updating
 *   - diffing
 *   - generating new versions
 *   - validating against plan limits
 */

export function normalizeArchitecture(raw: any) {
  if (!raw || typeof raw !== "object") {
    return baseShape();
  }

  return {
    summary: safeString(raw.summary),
    architecture: safeString(raw.architecture),
    cloud_init: safeString(raw.cloud_init),
    docker_compose: safeString(raw.docker_compose),

    pipelines: {
      provider: safeString(raw?.pipelines?.provider),
      automation: safeString(raw?.pipelines?.automation),
    },

    maintenance_plan: safeString(raw.maintenance_plan),
    sso_recommendations: safeString(raw.sso_recommendations),
    security_model: safeString(raw.security_model),
    budget_projection: safeString(raw.budget_projection),

    upgrade_paths: safeString(raw.upgrade_paths),
    next_steps: safeString(raw.next_steps),

    // Metadata for version history integrity
    metadata: {
      v: raw?.metadata?.v ?? 1,
      updated_at: new Date().toISOString(),
      original_provider: raw?.metadata?.original_provider ?? null,
      user_plan: raw?.metadata?.user_plan ?? null,
      cloud_choices: raw?.metadata?.cloud_choices ?? [],
    },
  };
}

/**
 * Base shape for the architecture if missing or invalid.
 */
function baseShape() {
  return {
    summary: "",
    architecture: "",
    cloud_init: "",
    docker_compose: "",
    pipelines: {
      provider: "",
      automation: "",
    },
    maintenance_plan: "",
    sso_recommendations: "",
    security_model: "",
    budget_projection: "",
    upgrade_paths: "",
    next_steps: "",
    metadata: {
      v: 1,
      updated_at: new Date().toISOString(),
      original_provider: null,
      user_plan: null,
      cloud_choices: [],
    },
  };
}

/**
 * Protects against null, undefined, objects, arrays, or numbers.
 */
function safeString(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}
