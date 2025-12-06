// app/api/files/duplicate/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DUPLICATE / CLONE FILE
 * ---------------------------------------------------------
 * POST /api/files/duplicate
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    userId: string,
 *    plan: string
 *  }
 *
 * Behavior:
 *  - All paid plans allowed (Developer → Enterprise)
 *  - Copies file content + metadata
 *  - Creates new file with "Copy of <name>"
 *  - Inserts version entry
 *  - Logs usage (1 pipeline)
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, userId, plan } = await req.json();

    // ---------------------------------------------------------
    // Validate input
    // ---------------------------------------------------------
    if (!fileId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing fileId, orgId, or userId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Supabase Client (Admin)
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load original file
    // ---------------------------------------------------------
    const { data: original, error: origErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (origErr || !original) {
      return NextResponse.json(
        { error: "Original file not found or access denied" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Create duplicate name
    // ---------------------------------------------------------
    const duplicateName = `Copy of ${original.filename}`;

    // ---------------------------------------------------------
    // Insert duplicated file
    // ---------------------------------------------------------
    const { data: newFile, error: insertErr } = await supabase
      .from("files")
      .insert({
        filename: duplicateName,
        description: original.description,
        content: original.content,
        org_id: orgId,
        last_modified_by: userId,
      })
      .select("*")
      .single();

    if (insertErr) {
      console.error("Duplicate insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to duplicate file" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Create version history entry for duplication
    // ---------------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: newFile.id,
      org_id: orgId,
      previous_content: null,
      new_content: original.content,
      change_summary: `Duplicated from ${original.filename}`,
      last_modified_by: userId,
    });

    // ---------------------------------------------------------
    // Usage logging (pipeline event)
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File duplicated successfully",
      newFileId: newFile.id,
    });
  } catch (err: any) {
    console.error("Duplicate route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
