import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

/**
 * AI REGENERATE FILE CONTENT
 * -------------------------------------------------------
 * POST /api/files/ai/regenerate
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string,
 *    model: string (optional),
 *    prompt: string (optional override),
 *    userId: string
 *  }
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan, prompt, model, userId } = await req.json();

    if (!fileId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: fileId, orgId, userId" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 1. Developer tier → blocked
    // -------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to use AI-powered file regeneration.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------
    // 2. Supabase admin client
    // -------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------------------------------
    // 3. Load file content
    // -------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or unauthorized" },
        { status: 404 }
      );
    }

    const oldContent = file.content;

    // -------------------------------------------------------
    // 4. AI Model (OpenAI)
    // -------------------------------------------------------
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const aiPrompt =
      prompt ??
      `
Regenerate this code to be more modern, optimized, consistent, fully typed, and production-ready.

Return ONLY the regenerated file and nothing else.

${oldContent}
`;

    const aiResponse = await openai.chat.completions.create({
      model: model ?? "gpt-4.1",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a senior cloud architect and code generation engine." },
        { role: "user", content: aiPrompt },
      ],
    });

    const regenerated = aiResponse.choices[0].message?.content ?? oldContent;

    // -------------------------------------------------------
    // 5. Insert version history entry
    // -------------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: oldContent,
      new_content: regenerated,
      change_summary: "AI-regenerated file",
      last_modified_by: userId,
    });

    // -------------------------------------------------------
    // 6. Update main file
    // -------------------------------------------------------
    await supabase
      .from("files")
      .update({
        content: regenerated,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", fileId);

    // -------------------------------------------------------
    // 7. Usage Logging
    // -------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 1,
      build_minutes: 0,
      ai_regenerations: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      regenerated,
    });
  } catch (err: any) {
    console.error("AI regenerate error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
