import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/files/[id]
 * Returns:
 *   - file metadata
 *   - file content
 *   - version history
 * Access:
 *   - restricted by org_id (RLS in Supabase)
 */
export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const fileId = context.params.id;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
    );

    // -----------------------------------
    // 1. AUTH — extract user session
    // -----------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing auth" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (!user || userError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const orgId = user.app_metadata?.org_id;
    if (!orgId) {
      return NextResponse.json(
        { error: "No org assigned" },
        { status: 403 }
      );
    }

    // -----------------------------------
    // 2. Fetch File (RLS protected)
    // -----------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied." },
        { status: 404 }
      );
    }

    // -----------------------------------
    // 3. Fetch Version History
    // -----------------------------------
    const { data: history } = await supabase
      .from("file_version_history")
      .select("*")
      .eq("file_id", fileId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    // -----------------------------------
    // 4. Return entire file data bundle
    // -----------------------------------
    return NextResponse.json({
      file: {
        ...file,
        history: history ?? [],
      },
    });
  } catch (err: any) {
    console.error("File fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
