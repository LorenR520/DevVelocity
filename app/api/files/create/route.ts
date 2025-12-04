import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * CREATE A NEW SAVED FILE
 * ------------------------------------------------------------
 * Inputs:
 * {
 *   orgId: string,
 *   userId: string,
 *   plan: string,
 *   filename: string,
 *   description?: string,
 *   content: string
 * }
 *
 * Tier Rules:
 *  - Developer → ❌ cannot save files
 *  - Startup / Team / Enterprise → ✔ allowed
 *
 * Behavior:
 *  - Creates new file record
 *  - Inserts initial version history snapshot
 *  - Logs usage
 */

export async function POST(req: Request) {
  try {
    const { orgId, userId, plan, filename, description, content } =
      await req.json();

    if (!orgId || !userId || !filename || !content) {
      return NextResponse.json(
        { error: "Missing required fields (orgId, userId, filename, content)" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 1. Developer tier blocked
    // ------------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to save generated infrastructure files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 2. Supabase Admin Client
    // ------------------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------------
    // 3. Create file
    // ------------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .insert({
        org_id: orgId,
        user_id: userId,
        filename,
        description: description ?? "",
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .select()
      .single();

    if (fileErr || !file) {
      console.error("Create file error:", fileErr);
      return NextResponse.json(
        { error: "Failed to create file" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 4. Initial version snapshot
    // ------------------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: file.id,
      org_id: orgId,
      previous_content: content,
      new_content: content,
      change_summary: "Initial version — file created",
      last_modified_by: userId,
    });

    // ------------------------------------------------------------
    // 5. Usage Logging
    // ------------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1, // saving a file counts as a pipeline
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File created successfully",
      fileId: file.id,
    });
  } catch (err: any) {
    console.error("Create file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
