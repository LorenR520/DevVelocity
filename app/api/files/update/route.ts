import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { file_id, content } = await req.json();

    if (!file_id || typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing file_id or content" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------
    // 1. AUTH — validate user session
    // -------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (!user || userErr) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const orgId = user.app_metadata?.org_id;
    const plan = user.app_metadata?.plan || "developer";

    if (!orgId) {
      return NextResponse.json(
        { error: "User is missing an org_id" },
        { status: 403 }
      );
    }

    // -------------------------------
    // Restrict feature by plan tier
    // -------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error:
            "File Portal is not included in the Developer plan. Upgrade to Startup or higher to save files.",
        },
        { status: 403 }
      );
    }

    // -------------------------------
    // 2. Load the file
    // -------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", file_id)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied." },
        { status: 404 }
      );
    }

    // -------------------------------
    // 3. Write version history entry
    // -------------------------------
    await supabase.from("file_version_history").insert({
      file_id,
      org_id: orgId,
      content: file.content,
      version: file.latest_version + 1,
    });

    // -------------------------------
    // 4. Update main file content
    // -------------------------------
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        content: content,
        latest_version: file.latest_version + 1,
      })
      .eq("id", file_id)
      .eq("org_id", orgId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update file." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File updated and version saved.",
      new_version: file.latest_version + 1,
    });
  } catch (err: any) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
