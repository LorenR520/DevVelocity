import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LIST ALL FILES FOR USER'S ORG
 *
 * Returned:
 * - id, filename, description
 * - created_at, updated_at
 * - version_count
 * - last_modified_by
 *
 * Tier Restrictions:
 * - Developer → returns empty list (no access to File Portal)
 * - Startup / Team / Enterprise → full access
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

    // --------------------------------------------------
    // 1. Developer tier has NO access to saved files
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json({
        files: [],
        message: "Upgrade required to access saved infrastructure files.",
      });
    }

    // --------------------------------------------------
    // 2. Supabase client
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // 3. Fetch files
    // --------------------------------------------------
    const { data: files, error: filesErr } = await supabase
      .from("files")
      .select(
        `
        id,
        filename,
        description,
        created_at,
        updated_at,
        org_id,
        deleted_at,
        last_modified_by,
        version_count: file_version_history(count)
      `
      )
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (filesErr) {
      return NextResponse.json(
        { error: "Failed to load files" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      files: files ?? [],
    });
  } catch (err: any) {
    console.error("File list error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
