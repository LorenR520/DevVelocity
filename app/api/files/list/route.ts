import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LIST ALL FILES FOR USER'S ORG
 *
 * This endpoint powers:
 *  - /dashboard/files
 *  - update/edit page preloading
 *  - version history modal
 *  - restore-file operation
 *  - AI upgrade (needs fileId)
 *
 * Tier Rules:
 *  - Developer     → no access (returns empty list + upgrade CTA)
 *  - Startup       → full access
 *  - Team          → full access
 *  - Enterprise    → full access + future multi-org support
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    const tier = plan ?? "developer";

    // --------------------------------------------------
    // 1. Developer Tier → Blocked
    // --------------------------------------------------
    if (tier === "developer") {
      return NextResponse.json({
        files: [],
        upgrade_required: true,
        message: "The File Portal is available on Startup, Team, and Enterprise plans.",
      });
    }

    // --------------------------------------------------
    // 2. Supabase service-role client
    //    (Required for reading version counts)
    // --------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,               // Use secure internal URL
      process.env.SUPABASE_SERVICE_ROLE_KEY!   // Required for RLS bypass + joins
    );

    // --------------------------------------------------
    // 3. Fetch all active (non-deleted) files
    // --------------------------------------------------
    const { data: files, error: filesErr } = await supabase
      .from("files")
      .select(
        `
        id,
        filename,
        description,
        org_id,
        created_at,
        updated_at,
        deleted_at,
        last_modified_by,
        version_count: file_version_history(count)
      `
      )
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (filesErr) {
      console.error("Supabase filesErr:", filesErr);
      return NextResponse.json(
        { error: "Failed to load files" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      files: files ?? [],
      upgrade_required: false,
    });

  } catch (err: any) {
    console.error("File list error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
