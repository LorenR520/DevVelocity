import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LOAD SSO SETTINGS + PLAN + ORG
 * ------------------------------------------------------
 * Returns:
 *  - plan ("developer" | "startup" | "team" | "enterprise")
 *  - sso_provider ("google" | "microsoft" | "okta" | "auth0" | null)
 *  - sso_config (JSON)
 *
 * Behavior:
 *  - Developer plan → SSO disabled (returns provider=null, config={})
 */

export async function POST() {
  try {
    // ---------------------------------------------
    // 1. Create Supabase Admin Client
    // ---------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------
    // 2. Identify user via JWT cookie
    // ---------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ---------------------------------------------
    // 3. Fetch user -> org mapping
    // ---------------------------------------------
    const { data: membership, error: memErr } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userId)
      .single();

    if (memErr || !membership) {
      return NextResponse.json(
        { error: "User is not assigned to an organization" },
        { status: 403 }
      );
    }

    const orgId = membership.org_id;

    // ---------------------------------------------
    // 4. Fetch org plan + SSO settings
    // ---------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id, sso_provider, sso_config")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = org.plan_id ?? "developer";

    // ---------------------------------------------
    // 5. Developer Plan → Force SSO disabled
    // ---------------------------------------------
    if (plan === "developer") {
      return NextResponse.json({
        plan: "developer",
        sso_provider: null,
        sso_config: {},
      });
    }

    // ---------------------------------------------
    // 6. Return SSO data (Startup / Team / Enterprise)
    // ---------------------------------------------
    return NextResponse.json({
      plan,
      sso_provider: org.sso_provider ?? null,
      sso_config: org.sso_config ?? {},
    });
  } catch (err: any) {
    console.error("SSO Load Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
