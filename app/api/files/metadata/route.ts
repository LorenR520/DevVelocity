// app/api/files/metadata/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET FILE METADATA (no content)
 * ---------------------------------------------------------
 * POST /api/files/metadata
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Behavior:
 *  - Developer → allowed (metadata is safe)
 *  - Startup / Team / Enterprise → full
 *  - Ensures file belongs to org
 *  - Returns: filename, size, created_at, updated_at, deleted_at
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan } = await req.json();

    if (!fileId || !orgId) {
      return NextResponse.json(
        { error: "Missing fileId or orgId" },
        { status: 400 }
      );
    }

    // Supabase service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Load file metadata
    const { data: file, error } = await supabase
      .from("files")
      .select(`
        id,
        org_id,
        filename,
        created_at,
        updated_at,
        deleted_at,
        last_modified_by,
        content
      `)
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (error || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    const sizeInBytes = Buffer.byteLength(file.content || "", "utf8");

    // Return metadata only — no file content
    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      size: sizeInBytes,
      created_at: file.created_at,
      updated_at: file.updated_at,
      deleted_at: file.deleted_at,
      last_modified_by: file.last_modified_by,
    });
  } catch (err: any) {
    console.error("Metadata route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
