// ------------------------------------------------------
//  DevVelocity — AI Builder Engine (Core Orchestration)
// ------------------------------------------------------
//  This module constructs the full prompt payload for GPT
//  after merging:
//      ✓ deterministic recommendations
//      ✓ provider packs
//      ✓ architecture presets
//      ✓ compliance + security shaping
//      ✓ tier limits
//
//  The engine does *not* call OpenAI. All AI execution
//  happens inside ai-client.ts.
// ------------------------------------------------------

import { RecommendationInputs } from "./recommendations";
import { generateRecommendations } from "./recommendations";
import { ProviderPack, providerLibrary } from "@/server/providers/provider-library";
import tierConfig from "@/marketing/tiers.json";

export interface BuilderInputs extends RecommendationInputs {
  tier: "developer" | "startup" | "team" | "enterprise";
  projectName: string;
  description: string;
}

export interface BuilderEngineOutput {
  finalPrompt: string;
  provider: string;
  architecture: string;
  db: string;
  compliance: Record<string, boolean>;
  securityDirectives: string[];
  limits: {
    fileLimit: number;
    maxServices: number;
    multiRegion: boolean;
  };
}

// ------------------------------------------------------
// MAIN BUILDER ENGINE
// ------------------------------------------------------
export function buildAIRequest(inputs: BuilderInputs): BuilderEngineOutput {
  const rec = generateRecommendations(inputs);

  const provider = resolveProvider(inputs.cloudPreference, rec.provider);
  const providerPack = providerLibrary[provider] as ProviderPack;

  const architecture = resolveArchitecture(inputs.workloadType, rec.architecture);
  const db = resolveDB(inputs.dbPreference, rec.db);
  const compliance = normalizeCompliance(inputs.compliance);
  const limits = computeTierLimits(inputs.tier);
  const securityDirectives = buildSecurityDirectives(compliance, provider);

  const finalPrompt = buildPrompt({
    inputs,
    rec,
    provider,
    providerPack,
    architecture,
    db,
    compliance,
    securityDirectives,
    limits,
  });

  return {
    finalPrompt,
    provider,
    architecture,
    db,
    compliance,
    securityDirectives,
    limits,
  };
}

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------
function resolveProvider(input: string, rec: string): string {
  if (input && providerLibrary[input]) return input;
  if (providerLibrary[rec]) return rec;
  return "aws";
}

function resolveArchitecture(input: string, rec: string): string {
  return input || rec || "web-app";
}

function resolveDB(input: string, rec: string): string {
  return input || rec || "postgres";
}

function normalizeCompliance(c: any): Record<string, boolean> {
  return {
    hipaa: !!c?.hipaa,
    soc2: !!c?.soc2,
    pci: !!c?.pci,
    fedramp: !!c?.fedramp,
    gdpr: !!c?.gdpr,
  };
}

function computeTierLimits(tier: BuilderInputs["tier"]) {
  const config = tierConfig[tier] || tierConfig["developer"];
  return {
    fileLimit: config.fileLimit,
    maxServices: config.maxServices,
    multiRegion: config.multiRegion,
  };
}

function buildSecurityDirectives(compliance: any, provider: string) {
  const out: string[] = [];
  if (compliance.hipaa) out.push("Apply HIPAA encryption + access logging.");
  if (compliance.soc2) out.push("Ensure SOC2 audit trails.");
  if (compliance.pci) out.push("Use PCI tokenization.");
  if (compliance.gdpr) out.push("GDPR data locality + right-to-forget flows.");
  if (compliance.fedramp) out.push("FedRAMP-moderate controls only.");
  out.push(`Follow ${provider.toUpperCase()} Well-Architected security practices.`);
  return out;
}

// ------------------------------------------------------
// PROMPT BUILDER
// ------------------------------------------------------
function buildPrompt(payload: any): string {
  const {
    inputs,
    rec,
    provider,
    providerPack,
    architecture,
    db,
    compliance,
    securityDirectives,
    limits,
  } = payload;

  return `
You are DevVelocity's AI Builder Engine.

PROJECT: ${inputs.projectName}
DESCRIPTION: ${inputs.description}

PROVIDER: ${provider}
ARCHITECTURE: ${architecture}
DB: ${db}

COMPLIANCE:
${Object.entries(compliance)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

SECURITY:
${securityDirectives.map((d: string) => `- ${d}`).join("\n")}

LIMITS:
- Max files: ${limits.fileLimit}
- Max services: ${limits.maxServices}
- Multi-region allowed: ${limits.multiRegion}

PROVIDER PACK:
${providerPack.context}

RECOMMENDATIONS:
${JSON.stringify(rec, null, 2)}

TASK:
Generate a complete infrastructure + code blueprint optimized for these constraints.
Return ONLY valid JSON following the DevVelocity schema.
`;
}
