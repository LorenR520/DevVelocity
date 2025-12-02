import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/billing/recordActivity";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing file ID." },
        { status: 400 }
      );
    }

    // 1. Auth check
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

    // 2. Fetch file metadata to validate org match
    const { data: file, error: fetchErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !file) {
      return NextResponse.json(
        { error: "File not found or inaccessible." },
        { status: 404 }
      );
    }

    // 3. Delete file
    const { error: deleteErr } = await supabase
      .from("files")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      return NextResponse.json(
        { error: "Failed to delete file." },
        { status: 500 }
      );
    }

    // 4. Log billable activity (applies to all tiers except Developer)
    await recordActivity({
      userId: user.id,
      orgId: file.org_id,
      type: "file_delete",
      metadata: { fileId: id },
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
