import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/billing/recordActivity";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { id, content } = await req.json();

    if (!id || !content) {
      return NextResponse.json(
        { error: "Missing file ID or content." },
        { status: 400 }
      );
    }

    // 1. Ensure user is authenticated
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch file metadata
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or inaccessible." },
        { status: 404 }
      );
    }

    // 2. Create version history entry BEFORE updating main file
    const { error: versionErr } = await supabase
      .from("file_version_history")
      .insert({
        file_id: id,
        org_id: file.org_id,
        previous_content: file.content,
        created_by: user.id,
      });

    if (versionErr) {
      return NextResponse.json(
        { error: "Failed to create version history." },
        { status: 500 }
      );
    }

    // 3. Update the file content
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update file." },
        { status: 500 }
      );
    }

    // 4. Record user activity (counts as billable action)
    await recordActivity({
      userId: user.id,
      orgId: file.org_id,
      type: "file_update",
      metadata: { fileId: id },
    });

    return NextResponse.json({
      success: true,
      message: "File updated successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
