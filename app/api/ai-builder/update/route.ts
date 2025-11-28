import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAIPrompt } from "@/ai-builder/prompt";

export async function POST(req: Request) {
  try {
    const { pastedFile, plan } = await req.json();

    if (!pastedFile) {
      return NextResponse.json(
        { error: "Missing pastedFile content" },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Initialize Supabase with service role
    // ----------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract user from auth token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid auth token" },
        { status: 401 }
      );
    }

    const orgId = user.user_metadata?.org_id;

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization found in user metadata" },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Parse their pasted file into AI-ready input
    // ----------------------------------------

    let parsed: any = null;

    try {
      parsed = JSON.parse(pastedFile);
    } catch (err) {
      return NextResponse.json(
        { error: "Pasted content is not valid JSON" },
        { status: 400 }
      );
    }

    // Validate structure
    const requiredSections = [
      "architecture",
      "cloud_init",
      "docker_compose",
      "pipelines",
      "security_model",
    ];

    const missing = requiredSections.filter((r) => !parsed[r]);

    // Build interpretation instructions
    const summary = parsed.summary || "No summary found";
    const cloud = parsed.architecture ?? "";
    const buildType = parsed.buildType ?? "general";
    const security = parsed.security_model ?? "";
    const budget = parsed.budget_projection ?? "unknown";
    const automation = parsed.pipelines ?? "";
    const maintenance = parsed.maintenance_plan ?? "";
    const providers = parsed.clouds ?? [];
    const project = summary ?? "";

    // ----------------------------------------
    // Construct new AI prompt (Smart restore mode)
    // ----------------------------------------

    const prompt = `
You are DevVelocity AI.
The user has pasted an OLD build output and wants it AUTOMATICALLY UPDATED.

Your job:

1. Detect outdated sections  
2. Rewrite architecture to modern standards  
3. Add missing sections: ${missing.join(", ")}  
4. Apply plan tier limits for: ${plan}
5. Recommend upgrades if needed
6. Always output runnable code
7. Improve security & budget optimization
8. Infer missing answers from pasted content

Here is the pasted file:

${JSON.stringify(parsed, null, 2)}

Rebuild using CURRENT DevVelocity AI format:

${buildAIPrompt({
  0: cloud,
  1: automation,
  2: providers,
  3: maintenance,
  4: budget,
  5: security,
  6: buildType,
  7: project,
  plan,
})}
`;

    // ----------------------------------------
    // Send prompt to OpenAI
    // ----------------------------------------
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiJson = await aiRes.json();

    if (!aiJson.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: "AI response was empty" },
        { status: 500 }
      );
    }

    const output = JSON.parse(aiJson.choices[0].message.content);

    // ----------------------------------------
    // Log usage for billing
    // ----------------------------------------
    await supabase.from("activity_logs").insert({
      org_id: orgId,
      user_id: user.id,
      action: "ai_update_build",
      details: `Updated file using AI Builder v2`,
    });

    return NextResponse.json(
      {
        success: true,
        output,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("AI Update Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
