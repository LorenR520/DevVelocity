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
    // 1. AUTH — validate token
    // -------------------------------
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 401 }
      );
    }

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
        { error: "User missing org_id" },
        { status: 403 }
      );
    }

    // -------------------------------
    // Plan Restrictions
    // -------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error:
            "File Portal is not available on the Developer plan. Upgrade to Startup or higher.",
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
        { error: "File not found." },
        { status: 404 }
      );
    }

    // -------------------------------
    // 3. Create version history
    // -------------------------------
    await supabase.from("file_version_history").insert({
      file_id,
      org_id: orgId,
      content: file.content,
      version: file.latest_version + 1,
    });

    // -------------------------------
    // 4. Update the file
    // -------------------------------
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        content: content,
        latest_version: file.latest_version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", file_id)
      .eq("org_id", orgId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update file." },
        { status: 500 }
      );
    }

    // -------------------------------
    // 5. USAGE TRACKING (important)
    // -------------------------------
    // Every file update counts as:
    // +1 pipeline
    // +1 provider API call
    // +1 build minute (approximate)
    const usagePayload = {
      org_id: orgId,
      date: new Date().toISOString().slice(0, 10),
      build_minutes: 1,
      pipelines_run: 1,
      provider_api_calls: 1,
    };

    await supabase.from("usage_logs").insert(usagePayload);

    return NextResponse.json({
      success: true,
      version: file.latest_version + 1,
      usage_tracked: usagePayload,
    });
  } catch (err: any) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
