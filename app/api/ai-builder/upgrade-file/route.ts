import { NextResponse } from "next/server";
import OpenAI from "openai";
import pricing from "@/marketing/pricing.json";
import { buildAIPrompt } from "@/ai-builder/prompt";

// ------------------------------
// Helper: Detect plan from old build file
// ------------------------------
function detectPlanFromBuild(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("enterprise")) return "enterprise";
  if (lower.includes("team")) return "team";
  if (lower.includes("startup")) return "startup";

  return "developer"; // default for older builds
}

// ------------------------------
// Helper: Extract metadata heuristically
// (AI will refine this)
// ------------------------------
function extractBuildContext(input: string) {
  return {
    cloud: /aws|azure|gcp|oracle|digitalocean/i.exec(input)?.[0] ?? "unknown",
    providers:
      input.match(/providers:\s*(.*)/i)?.[1]?.split(/[, ]+/) ?? ["unknown"],
    buildType:
      /docker|container|vm|serverless/i.exec(input)?.[0] ?? "unknown",
    maintenance:
      /maintenance:\s*(low|medium|high|none)/i.exec(input)?.[1] ?? "unknown",
    automation:
      /ci\/cd|pipelines|auto-update|automation/i.test(input)
        ? "advanced"
        : "basic",
  };
}

// ------------------------------
// Main Route
// ------------------------------
export async function POST(req: Request) {
  try {
    const { fileContent } = await req.json();

    if (!fileContent) {
      return NextResponse.json(
        { error: "Missing fileContent" },
        { status: 400 }
      );
    }

    const plan = detectPlanFromBuild(fileContent);
    const context = extractBuildContext(fileContent);

    // Build contextual prompt with tier-aware restrictions
    const aiPrompt = buildAIPrompt({
      0: context.cloud,
      1: context.automation,
      2: context.providers,
      3: context.maintenance,
      4: "$100–$500",
      5: "basic",
      6: context.buildType,
      7: fileContent,
      plan,
    });

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: aiPrompt },
        { role: "user", content: fileContent },
      ],
      temperature: 0,
    });

    const rawOutput = completion.choices?.[0]?.message?.content;

    if (!rawOutput) {
      return NextResponse.json(
        { error: "AI returned no output" },
        { status: 500 }
      );
    }

    // Attempt to parse JSON output
    let parsedOutput: any = null;

    try {
      parsedOutput = JSON.parse(rawOutput);
    } catch {
      // If it's not JSON, return raw text for debugging
      return NextResponse.json({
        provider: "ai",
        raw: rawOutput,
        warning: "Output was not valid JSON",
      });
    }

    return NextResponse.json({
      provider: "ai",
      planDetected: plan,
      upgrade: parsedOutput.upgrade_paths ?? null,
      output: parsedOutput,
    });
  } catch (err: any) {
    console.error("Upgrade-file route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
