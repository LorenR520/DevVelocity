import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DOWNLOAD FILE OR VERSION
 *
 * GET /api/files/download?id=123
 * GET /api/files/download?id=456&type=version
 *
 * Rules:
 * - Developer tier cannot download
 * - Must verify authenticated user belongs to file's org
 * - Supports version downloads via file_version_history
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

    // ------------------------------------------
    // 1. Verify user is authenticated
    // ------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ------------------------------------------
    // 2. Load user’s org + plan
    // ------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json(
        { error: "User not assigned to an organization" },
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

    // Developer tier cannot download files
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Downloads are not available on the Developer plan.",
          upgrade: true,
          upgradeMessage:
            "Upgrade to the Startup Tier to unlock file downloads.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------
    // 3. Fetch file or version safely with RLS
    // ------------------------------------------
    let record: any = null;

    if (type === "version") {
      // Load version history entry
      const { data, error } = await supabase
        .from("file_version_history")
        .select("*")
        .eq("id", id)
        .eq("org_id", orgId) // ensure ownership
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 }
        );
      }

      record = {
        filename: `version-${data.id}.txt`,
        content: data.new_content,
      };
    } else {
      // Load main file
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("id", id)
        .eq("org_id", orgId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      record = {
        filename: data.filename,
        content: data.content,
      };
    }

    // ------------------------------------------
    // 4. Serve file content for download
    // ------------------------------------------
    return new Response(record.content ?? "", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${record.filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Download API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
