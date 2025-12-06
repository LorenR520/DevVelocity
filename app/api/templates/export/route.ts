import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * EXPORT TEMPLATE
 * ---------------------------------------------------------
 * GET /api/templates/export?id=123
 *
 * Rules:
 *  - Developer plan ❌ cannot export templates
 *  - Startup / Team / Enterprise → ✅ allowed
 *
 * Behavior:
 *  - Ensures user belongs to org
 *  - Loads template from templates table
 *  - Returns file download: text/plain
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Supabase user-scoped client (RLS enforced)
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // ---------------------------------------------------------
    // 1. Verify authenticated user
    // ---------------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. Fetch user org + plan
    // ---------------------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json(
        { error: "User does not belong to an organization" },
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

    // ---------------------------------------------------------
    // 3. Restrict developer tier
    // ---------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Template export is not available on the Developer plan.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 4. Load template with RLS enforcement
    // ---------------------------------------------------------
    const { data: template, error: tplErr } = await supabase
      .from("templates")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (tplErr || !template) {
      return NextResponse.json(
        { error: "Template not found or unauthorized" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 5. Serve file content
    // ---------------------------------------------------------
    const filename =
      template.name?.replace(/\s+/g, "-").toLowerCase() + ".txt";

    return new Response(template.content || "", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Template export error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
