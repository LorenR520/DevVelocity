import { NextResponse } from "next/server";
import { buildAIPrompt } from "@/ai-builder/prompt";
import { getPlan } from "@/ai-builder/plan-logic";

// -----------------------------
// POST /api/ai-builder/from-file
// -----------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fileContent = body?.file_content;
    const plan = body?.plan ?? "developer";

    // -----------------------------
    // Validate input
    // -----------------------------
    if (!fileContent || fileContent.trim().length < 10) {
      return NextResponse.json(
        { error: "Invalid or empty build file." },
        { status: 400 }
      );
    }

    // -----------------------------
    // Tier enforcement
    // -----------------------------
    const planInfo = getPlan(plan);

    if (!planInfo) {
      return NextResponse.json(
        { error: "Invalid plan tier" },
        { status: 400 }
      );
    }

    if (plan === "developer") {
      return NextResponse.json(
        { 
          error: "Build regeneration is not included in the Developer plan. Upgrade to Startup or higher."
        },
        { status: 403 }
      );
    }

    // -----------------------------
    // EXTRACT DATA FROM FILE
    // -----------------------------
    const extracted = extractBuildMetadata(fileContent);

    // If the file doesn't contain enough metadata, fallback to basic reconstruction
    const questions = extracted.answers ?? {};

    // Inject plan into answers so AI knows the limits
    questions.plan = plan;

    // -----------------------------
    // Build the AI prompt
    // -----------------------------
    const systemPrompt = buildAIPrompt(questions);

    // -----------------------------
    // Call OpenAI (or provider)
    // -----------------------------
    const aiRes = await fetch(process.env.OPENAI_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `
Here is the user-provided DevVelocity build file.

Please analyze this build, detect outdated configs, fix broken sections, update cloud-init/docker/pipelines, and apply all plan restrictions:

---
${fileContent}
---
            `,
          },
        ],
      }),
    });

    const aiJson = await aiRes.json();

    if (!aiJson.choices || !aiJson.choices[0]?.message) {
      return NextResponse.json(
        { error: "AI returned an invalid response." },
        { status: 500 }
      );
    }

    const output = safeParseJSON(aiJson.choices[0].message.content);

    // -----------------------------
    // Send updated build back
    // -----------------------------
    return NextResponse.json(
      {
        ok: true,
        updated: true,
        extractedMetadata: extracted,
        output,
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("AI update error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// -----------------------------
// Utility: Try to parse JSON safely
// -----------------------------
function safeParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// -----------------------------
// Utility: Extract metadata from saved file
// We pull:
//   - cloud provider
//   - automation options
//   - security
//   - maintenance
//   - build type
//   - answers JSON (if present)
// -----------------------------
function extractBuildMetadata(raw: string) {
  const metadata = {
    cloud: null,
    security: null,
    providers: [],
    automation: null,
    maintenance: null,
    budget: null,
    buildType: null,
    project: null,
    answers: null,
  };

  // Try to extract structured JSON block
  const jsonMatch = raw.match(/```json([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      metadata.answers = JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  // Fallback: simple regex extraction from plain text files
  const extract = (label: string) => {
    const regex = new RegExp(`${label}:\\s*(.*)`, "i");
    const match = raw.match(regex);
    return match ? match[1].trim() : null;
  };

  metadata.cloud = extract("Cloud Provider");
  metadata.automation = extract("Automation");
  metadata.security = extract("Security");
  metadata.maintenance = extract("Maintenance");
  metadata.budget = extract("Budget");
  metadata.buildType = extract("Workload Type");
  metadata.project = extract("Project");

  return metadata;
}
