import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * FILE METADATA FETCHER
 * ---------------------------------------------------------
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: "developer" | "startup" | "team" | "enterprise"
 *  }
 *
 * Returns:
 *  - filename
 *  - description
 *  - created_at / updated_at
 *  - last_modified_by
 *  - version_count
 *  - AI context block
 *  - Enterprise-only audit fields
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

    const tier = plan ?? "developer";

    // ---------------------------------------------------
    // 1. Developer tier → blocked
    // ---------------------------------------------------
    if (tier === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to view extended metadata.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------
    // 2. Supabase admin client
    // ---------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------
    // 3. Fetch file + metadata + version count
    // ---------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select(
        `
        id,
        filename,
        description,
        org_id,
        created_at,
        updated_at,
        last_modified_by,
        content,
        version_count:file_version_history(count),
        audit_last_opened,
        audit_last_opened_by
      `
      )
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------
    // 4. Build AI Context Block
    // ---------------------------------------------------
    const aiContext = {
      filename: file.filename,
      description: file.description,
      version_count: file.version_count,
      size: file.content?.length ?? 0,
      last_updated: file.updated_at,
      org_id: file.org_id,
    };

    // ---------------------------------------------------
    // 5. Enterprise-only audit metadata
    // ---------------------------------------------------
    let auditFields = {};

    if (tier === "enterprise") {
      auditFields = {
        audit_last_opened: file.audit_last_opened,
        audit_last_opened_by: file.audit_last_opened_by,
      };

      // Update audit trail automatically
      await supabase
        .from("files")
        .update({
          audit_last_opened: new Date().toISOString(),
          audit_last_opened_by: "system-metadata",
        })
        .eq("id", fileId);
    }

    // ---------------------------------------------------
    // 6. Construct response
    // ---------------------------------------------------
    return NextResponse.json({
      success: true,
      metadata: {
        id: file.id,
        filename: file.filename,
        description: file.description,
        created_at: file.created_at,
        updated_at: file.updated_at,
        last_modified_by: file.last_modified_by,
        version_count: file.version_count,
        ai_context: aiContext,
        ...auditFields,
      },
    });

  } catch (err: any) {
    console.error("Metadata route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
