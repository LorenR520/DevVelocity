// app/api/templates/list/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LIST TEMPLATES AVAILABLE TO THE ORG
 * -------------------------------------------------------------
 * Visibility Rules:
 *  - Developer tier ❌ cannot use templates
 *  - Startup / Team / Enterprise → full access
 *
 * Template Types Supported:
 *  - Private templates (owned by org)
 *  - Public templates (future marketplace support)
 *
 * Response Includes:
 *  - template id
 *  - name
 *  - description
 *  - created_at
 *  - updated_at
 *  - version_count
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

    // -------------------------------------------------------------
    // 1. Developer plan → BLOCKED
    // -------------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          templates: [],
          message: "Upgrade required to access deployment templates.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------------
    // 2. Supabase (service role)
    // -------------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------------------------------------
    // 3. Fetch templates belonging to org
    // -------------------------------------------------------------
    const { data: templates, error: templateErr } = await supabase
      .from("templates")
      .select(
        `
        id,
        org_id,
        name,
        description,
        created_at,
        updated_at,
        type
      `
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (templateErr) {
      console.error("Template list error:", templateErr);
      return NextResponse.json(
        { error: "Failed to load templates" },
        { status: 500 }
      );
    }

    // -------------------------------------------------------------
    // 4. Fetch version count for each template
    // -------------------------------------------------------------
    const templateIds = templates.map((t) => t.id);

    let versionCounts: Record<string, number> = {};

    if (templateIds.length > 0) {
      const { data: versionRows } = await supabase
        .from("template_version_history")
        .select("template_id, id");

      versionRows?.forEach((v) => {
        versionCounts[v.template_id] =
          (versionCounts[v.template_id] || 0) + 1;
      });
    }

    // Attach version_count to each template
    const enriched = templates.map((t) => ({
      ...t,
      version_count: versionCounts[t.id] ?? 0,
    }));

    return NextResponse.json({
      orgId,
      templates: enriched,
    });
  } catch (err: any) {
    console.error("Template-list API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
