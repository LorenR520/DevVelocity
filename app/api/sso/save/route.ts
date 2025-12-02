import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SAVE SSO SETTINGS
 * --------------------------------------------------
 * Documentation:
 *  - Startup / Team / Enterprise can save SSO config
 *  - Developer plan CANNOT save (blocked)
 *  - Valid providers: google, microsoft, okta, auth0
 *  - sso_config MUST be valid JSON
 */

export async function POST(req: Request) {
  try {
    const { sso_provider, sso_config } = await req.json();

    // --------------------------------------------------
    // 1. Validate provider
    // --------------------------------------------------
    const allowedProviders = ["google", "microsoft", "okta", "auth0", null];

    if (!allowedProviders.includes(sso_provider)) {
      return NextResponse.json(
        { error: "Invalid SSO provider" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Validate config shape
    // --------------------------------------------------
    if (sso_config && typeof sso_config !== "object") {
      return NextResponse.json(
        { error: "sso_config must be an object" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Supabase Admin Client
    // --------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // 4. Identify User
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 5. Fetch user's org ID
    // --------------------------------------------------
    const { data: membership, error: memErr } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userId)
      .single();

    if (memErr || !membership) {
      return NextResponse.json(
        { error: "User does not belong to an organization" },
        { status: 403 }
      );
    }

    const orgId = membership.org_id;

    // --------------------------------------------------
    // 6. Load org plan
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 7. Block Developer Tier
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        { error: "Upgrade required to enable SSO features" },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 8. Save SSO into organizations table
    // --------------------------------------------------
    const { error: updateErr } = await supabase
      .from("organizations")
      .update({
        sso_provider: sso_provider ?? null,
        sso_config: sso_config ?? {},
      })
      .eq("id", orgId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to save SSO configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "SSO settings updated successfully",
    });
  } catch (err: any) {
    console.error("SSO Save Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
