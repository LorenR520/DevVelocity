import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * IMPORT TEMPLATE
 * ---------------------------------------------------------
 * POST /api/templates/import
 *
 * Inputs:
 *  {
 *    name: string,
 *    content: string
 *  }
 *
 * Rules:
 *  - Developer = allowed but with limits:
 *        - Max 20 templates
 *        - Max content size 100 KB
 *  - Startup/Team/Enterprise = full access
 *  - Must belong to org
 */

export async function POST(req: Request) {
  try {
    const { name, content } = await req.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: "Missing name or content" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Supabase user-scoped client
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    // 2. Load user's org + plan
    // ---------------------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json(
        { error: "User not assigned to an org" },
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
    // 3. Developer tier import restrictions
    // ---------------------------------------------------------
    if (plan === "developer") {
      // Check count
      const { count } = await supabase
        .from("templates")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);

      if ((count ?? 0) >= 20) {
        return NextResponse.json(
          {
            error:
              "Developer plan allows up to 20 templates. Upgrade to import more.",
            upgrade_required: true,
          },
          { status: 403 }
        );
      }

      // Check size (100 KB)
      const sizeKb = Buffer.byteLength(content, "utf8") / 1024;
      if (sizeKb > 100) {
        return NextResponse.json(
          {
            error:
              "Template exceeds 100 KB size limit for Developer tier. Upgrade required.",
            upgrade_required: true,
          },
          { status: 403 }
        );
      }
    }

    // ---------------------------------------------------------
    // 4. Insert new template
    // ---------------------------------------------------------
    const { error: insertErr } = await supabase
      .from("templates")
      .insert({
        org_id: orgId,
        name,
        content,
        created_by: user.id,
      });

    if (insertErr) {
      console.error("Import error:", insertErr);
      return NextResponse.json(
        { error: "Failed to import template" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template imported successfully",
    });
  } catch (err: any) {
    console.error("Import route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
