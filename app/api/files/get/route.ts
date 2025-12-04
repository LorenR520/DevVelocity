import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET A SINGLE FILE (PRODUCTION)
 * -------------------------------
 * Called by:
 *  - /dashboard/files/[id]
 *
 * Includes:
 *  - File metadata
 *  - Content
 *  - Version count
 *  - Enforced org membership
 *  - Enforced plan tier
 *
 * Restrictions:
 *  - Developer tier → cannot load saved files
 */

export async function POST(req: Request) {
  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId" },
        { status: 400 }
      );
    }

    // --------------------------------------------
    // 1. Initialize Supabase Auth Server Client
    // --------------------------------------------
    const supabase = createClient();

    // Identify user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --------------------------------------------
    // 2. Get user's organization
    // --------------------------------------------
    const { data: membership, error: memErr } = await supabase
      .from("user_org_membership")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (memErr || !membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 403 }
      );
    }

    const orgId = membership.org_id;

    // --------------------------------------------
    // 3. Fetch organization plan
    // --------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = org.plan_id ?? "developer";

    // --------------------------------------------
    // 4. Developer Plan = No Access
    // --------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Your current plan does not include saved file access.",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // --------------------------------------------
    // 5. Fetch file (must belong to org)
    // --------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select(
        `
          id,
          filename,
          description,
          content,
          created_at,
          updated_at,
          org_id,
          last_modified_by,
          version_count
        `
      )
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------
    // 6. Return file + metadata
    // --------------------------------------------
    return NextResponse.json({
      file: {
        ...file,
        plan, // pass plan to UI (for banners + upgrade)
      },
    });

  } catch (err: any) {
    console.error("GET FILE ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
