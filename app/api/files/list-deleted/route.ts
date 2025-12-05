import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LIST *DELETED* FILES FOR AN ORG (Trash Bin)
 * ----------------------------------------------------------
 * Used by:
 *  - Trash panel
 *  - Version restore interface
 *  - Enterprise audit logs
 *
 * Tier Rules:
 *  - Developer → ❌ no access
 *  - Startup / Team → full access
 *  - Enterprise → includes audit metadata
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

    // ------------------------------------------------------
    // 1. Developer tier blocked
    // ------------------------------------------------------
    if (tier === "developer") {
      return NextResponse.json(
        {
          files: [],
          upgrade_required: true,
          message: "Trash view is available on Startup, Team, and Enterprise plans.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------
    // 2. Admin Supabase client needed for joins
    // ------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------
    // 3. Fetch deleted files
    // ------------------------------------------------------
    const { data: files, error: filesErr } = await supabase
      .from("files")
      .select(`
        id,
        filename,
        description,
        deleted_at,
        updated_at,
        last_modified_by,
        version_count:file_version_history(count),
        audit_deleted_by,
        audit_deleted_reason
      `)
      .eq("org_id", orgId)
      .not("deleted_at", "is", null) // deleted files only
      .order("deleted_at", { ascending: false });

    if (filesErr) {
      console.error("Deleted files load error:", filesErr);
      return NextResponse.json(
        { error: "Failed to load deleted files" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------
    // 4. Filter metadata for lower tiers
    // ------------------------------------------------------
    const sanitized = files.map((file) => ({
      id: file.id,
      filename: file.filename,
      description: file.description,
      deleted_at: file.deleted_at,
      updated_at: file.updated_at,
      last_modified_by: file.last_modified_by,
      version_count: file.version_count,
      ...(tier === "enterprise"
        ? {
            audit_deleted_by: file.audit_deleted_by,
            audit_deleted_reason: file.audit_deleted_reason,
          }
        : {}),
    }));

    return NextResponse.json({
      success: true,
      files: sanitized,
    });
  } catch (err: any) {
    console.error("List deleted files error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
