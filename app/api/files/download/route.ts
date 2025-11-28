import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DOWNLOAD ENDPOINT
 * 
 * Supports:
 *  - Secure download (RLS + token validation)
 *  - Version-aware retrieval
 *  - Usage tracking for metered billing
 *  - Plan restrictions (Developer tier blocked)
 */

export async function POST(req: Request) {
  try {
    const { file_id, version } = await req.json();

    if (!file_id) {
      return NextResponse.json(
        { error: "Missing file_id" },
        { status: 400 }
      );
    }

    // ------------------------------------------
    // Init Supabase Admin (service key required)
    // ------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------
    // Validate Authorization Header
    // ------------------------------------------
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
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
        { error: "No org_id found" },
        { status: 403 }
      );
    }

    // ------------------------------------------
    // Plan Restriction — no File Portal for Developer
    // ------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error:
            "File Portal is not available on the Developer plan. Upgrade to Startup or higher.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------
    // Load the file metadata
    // ------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", file_id)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // ------------------------------------------
    // If version specified → retrieve from history
    // ------------------------------------------
    let contentToReturn = file.content;

    if (version && version !== file.latest_version) {
      const { data: versionRow, error: versionErr } = await supabase
        .from("file_version_history")
        .select("content")
        .eq("file_id", file_id)
        .eq("version", version)
        .eq("org_id", orgId)
        .single();

      if (versionErr || !versionRow) {
        return NextResponse.json(
          { error: "Requested version not found" },
          { status: 404 }
        );
      }

      contentToReturn = versionRow.content;
    }

    // ------------------------------------------
    // Log usage for download (1 API call)
    // ------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      date: new Date().toISOString().slice(0, 10),
      build_minutes: 0,
      pipelines_run: 0,
      provider_api_calls: 1,
    });

    // ------------------------------------------
    // Return file to user
    // ------------------------------------------
    return NextResponse.json({
      success: true,
      file_id,
      version: version ?? file.latest_version,
      content: contentToReturn,
    });
  } catch (err: any) {
    console.error("File download error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
