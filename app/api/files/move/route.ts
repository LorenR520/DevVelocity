// app/api/files/move/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * MOVE FILE INTO A FOLDER (or out of one)
 * ---------------------------------------------------------
 * POST /api/files/move
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    userId: string,
 *    targetFolderId: string | null,  // null = move to root
 *    plan: string
 *  }
 *
 * Behavior:
 *  - All paid tiers allowed (Developer → Enterprise)
 *  - Validates org ownership
 *  - Ensures folder belongs to the same org
 *  - Updates file's folder_id
 *  - Logs an activity entry
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, userId, targetFolderId, plan } =
      await req.json();

    // ---------------------------------------------------------
    // Input validation
    // ---------------------------------------------------------
    if (!fileId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing fileId, orgId, or userId" },
        { status: 400 }
      );
    }

    // All tiers can move files because all tiers are paid
    // No "developer restriction" needed here anymore

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Ensure file belongs to org
    // ---------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, org_id, filename")
      .eq("id", fileId)
      .single();

    if (fileErr || !file || file.org_id !== orgId) {
      return NextResponse.json(
        { error: "File not found or unauthorized" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // If moving to a folder, validate the folder exists
    // ---------------------------------------------------------
    if (targetFolderId) {
      const { data: folder, error: folderErr } = await supabase
        .from("file_folders")
        .select("id, org_id, name")
        .eq("id", targetFolderId)
        .single();

      if (folderErr || !folder || folder.org_id !== orgId) {
        return NextResponse.json(
          { error: "Folder not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    // ---------------------------------------------------------
    // Update file with new folder location
    // ---------------------------------------------------------
    const { error: moveErr } = await supabase
      .from("files")
      .update({
        folder_id: targetFolderId ?? null,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", fileId);

    if (moveErr) {
      return NextResponse.json(
        { error: "Failed to move file" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Log movement in activity log
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      moved_files: 1,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File moved successfully",
    });
  } catch (err: any) {
    console.error("File move error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
