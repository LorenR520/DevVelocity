import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SAVE or UPDATE a file
 * --------------------------------------------------
 * Supports:
 *   - Creating a NEW saved infrastructure file
 *   - Updating an existing file's metadata or content
 *
 * Tier Rules:
 *   - Developer → NO ACCESS (must upgrade)
 *   - Startup / Team / Enterprise → Full access
 *
 * Versioning:
 *   - If content changes, automatically store previous
 *     version in file_version_history
 *
 * Usage Tracking:
 *   - Each save/update = 1 "activity" credit
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan, fileId, filename, description, content, userId } =
      await req.json();

    if (!orgId || !filename || !content) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, filename, or content" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Tier restriction: Developer CANNOT save files
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to save infrastructure files.",
          upgrade_required: true,
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // Supabase client
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // If updating an existing file
    // --------------------------------------------------
    if (fileId) {
      // Load the current file
      const { data: existing, error: loadErr } = await supabase
        .from("files")
        .select("content, org_id")
        .eq("id", fileId)
        .single();

      if (loadErr || !existing) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      if (existing.org_id !== orgId) {
        return NextResponse.json(
          { error: "Unauthorized: Org mismatch" },
          { status: 403 }
        );
      }

      // If content changed → add version history
      if (existing.content !== content) {
        await supabase.from("file_version_history").insert({
          file_id: fileId,
          org_id: orgId,
          previous_content: existing.content,
          new_content: content,
          change_summary: "Manual update via File Portal",
        });
      }

      // Update the file itself
      await supabase
        .from("files")
        .update({
          filename,
          description,
          content,
          updated_at: new Date().toISOString(),
          last_modified_by: userId ?? null,
        })
        .eq("id", fileId);

      // Log usage
      await supabase.from("usage_logs").insert({
        org_id: orgId,
        pipelines_run: 0,
        provider_api_calls: 0,
        build_minutes: 0,
        date: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "File updated successfully",
        fileId,
      });
    }

    // --------------------------------------------------
    // Creating a NEW file
    // --------------------------------------------------
    const { data: created, error: createErr } = await supabase
      .from("files")
      .insert({
        org_id: orgId,
        filename,
        description,
        content,
        last_modified_by: userId ?? null,
      })
      .select("id")
      .single();

    if (createErr || !created) {
      return NextResponse.json(
        { error: "Failed to create file" },
        { status: 500 }
      );
    }

    // Log usage
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File saved successfully",
      fileId: created.id,
    });
  } catch (err: any) {
    console.error("Save file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
