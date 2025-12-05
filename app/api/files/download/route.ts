import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DOWNLOAD FILE OR VERSION (PRODUCTION READY)
 * --------------------------------------------------------
 * GET /api/files/download?id=123
 * GET /api/files/download?id=456&type=version
 *
 * Security:
 *  - Enforces org isolation using RLS + org_id check
 *  - Developer plan cannot download
 *  - User must be authenticated & belong to an org
 *
 * Supports:
 *  - Current file download
 *  - Old version download
 *
 * Logs:
 *  - Adds a download usage event for Startup+ tiers
 */

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const type = searchParams.get("type"); // optional: "version"

    if (!id) {
      return NextResponse.json(
        { error: "Missing file ID" },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // 1. Authentication check
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 2. Load user's org + plan
    // ----------------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json(
        { error: "User is not assigned to an organization" },
        { status: 403 }
      );
    }

    const orgId = profile.org_id;

    const { data: org } = await supabase
      .from("organizations")
      .select("plan_id")
      .eq("id", orgId)
      .single();

    const plan = org?.plan_id ?? "developer";

    // ----------------------------------------------------
    // 3. Tier enforcement
    // ----------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Downloads are not available on the Developer plan.",
          upgradeRequired: true,
          upgradeMessage:
            "Upgrade to Startup or above to unlock downloads.",
        },
        { status: 403 }
      );
    }

    // ----------------------------------------------------
    // 4. Fetch file OR version with strict org enforcement
    // ----------------------------------------------------
    let record: { filename: string; content: string | null } | null = null;

    if (type === "version") {
      // Load specific version record
      const { data, error } = await supabase
        .from("file_version_history")
        .select("id, new_content, created_at")
        .eq("id", id)
        .eq("org_id", orgId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Version not found or access denied" },
          { status: 404 }
        );
      }

      record = {
        filename: `version-${data.id}-${data.created_at}.txt`.replace(/[: ]/g, "_"),
        content: data.new_content ?? "",
      };
    } else {
      // Load main file
      const { data, error } = await supabase
        .from("files")
        .select("filename, content")
        .eq("id", id)
        .eq("org_id", orgId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "File not found or access denied" },
          { status: 404 }
        );
      }

      record = {
        filename: data.filename || "file.txt",
        content: data.content ?? "",
      };
    }

    // ----------------------------------------------------
    // 5. Log download usage
    // ----------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      downloads: 1,
      date: new Date().toISOString(),
    });

    // ----------------------------------------------------
    // 6. Return downloadable file
    // ----------------------------------------------------
    return new Response(record.content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${record.filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Download API error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
