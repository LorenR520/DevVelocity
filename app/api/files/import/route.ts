import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

/**
 * IMPORT FILE INTO DEVVELOCITY
 * -------------------------------------------------------
 * POST /api/files/import
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string,
 *    filename: string,
 *    rawContent: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer tier ❌ blocked
 *  - Startup / Team / Enterprise allowed
 *  - AI normalizes + modernizes file on import
 *  - Creates initial version entry
 *  - Logs usage
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan, filename, rawContent, userId } = await req.json();

    if (!orgId || !filename || !rawContent || !userId) {
      return NextResponse.json(
        { error: "Missing orgId, filename, rawContent, or userId" },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------
    // Developer tier BLOCKED from importing
    // ----------------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to import infrastructure files.",
          upgrade_required: true
        },
        { status: 403 }
      );
    }

    // ----------------------------------------------------------------
    // Supabase Admin Client
    // ----------------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------------------------------------------
    // Prevent duplicate filenames in the same org
    // ----------------------------------------------------------------
    const { data: existing } = await supabase
      .from("files")
      .select("id")
      .eq("filename", filename)
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .limit(1);

    if (existing?.length) {
      return NextResponse.json(
        { error: "A file with this name already exists." },
        { status: 409 }
      );
    }

    // ----------------------------------------------------------------
    // AI Normalization Pass
    // ----------------------------------------------------------------
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const aiPrompt = `
Normalize, clean, and modernize this file.

Rules:
- Maintain functionality
- Improve readability + structure
- Fix obsolete syntax
- DO NOT add commentary or explanation
- Return fully upgraded file only

${rawContent}
`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are an expert DevOps file transformation engine." },
        { role: "user", content: aiPrompt }
      ]
    });

    const upgraded = aiResponse.choices[0].message?.content ?? rawContent;

    // ----------------------------------------------------------------
    // Insert File Entry
    // ----------------------------------------------------------------
    const { data: newFile, error: insertErr } = await supabase
      .from("files")
      .insert({
        org_id: orgId,
        filename,
        content: upgraded,
        last_modified_by: userId
      })
      .select()
      .single();

    if (insertErr || !newFile) {
      return NextResponse.json(
        { error: "Failed to create file" },
        { status: 500 }
      );
    }

    // ----------------------------------------------------------------
    // Create Initial Version Log
    // ----------------------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: newFile.id,
      org_id: orgId,
      previous_content: null,
      new_content: upgraded,
      change_summary: "Initial import",
      last_modified_by: userId
    });

    // ----------------------------------------------------------------
    // Usage Logging (import = pipeline event)
    // ----------------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 1,
      build_minutes: 0,
      imported_files: 1,
      date: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      fileId: newFile.id,
      filename,
      upgradedContent: upgraded
    });
  } catch (err: any) {
    console.error("Import route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
