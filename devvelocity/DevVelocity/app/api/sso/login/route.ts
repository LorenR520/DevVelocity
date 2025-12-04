import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SSO LOGIN START
 * -------------------------------------------
 * Responsibilities:
 *  - Read org + plan + SSO provider
 *  - Block Developer tier
 *  - Generate provider-specific login URL
 *  - Return redirect target for client-side nav
 */

export async function POST(req: Request) {
  try {
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // 1. Supabase Admin Client
    // ----------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------------------------------
    // 2. Load organization details
    // ----------------------------------------------------
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
    const provider = org.sso_provider ?? null;
    const config = org.sso_config ?? {};

    // ----------------------------------------------------
    // 3. Developer Tier Block
    // ----------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error:
            "SSO cannot be used on the Developer plan. Upgrade to enable SSO."
        },
        { status: 403 }
      );
    }

    // ----------------------------------------------------
    // 4. Validate provider chosen
    // ----------------------------------------------------
    if (!provider) {
      return NextResponse.json(
        { error: "SSO provider has not been configured." },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // 5. Build redirect URL based on provider
    // ----------------------------------------------------
    let loginUrl = null;

    switch (provider) {
      case "google":
        if (!config.client_id) {
          return NextResponse.json(
            { error: "Google SSO missing client_id" },
            { status: 500 }
          );
        }

        loginUrl =
          "https://accounts.google.com/o/oauth2/v2/auth" +
          "?response_type=code" +
          `&client_id=${encodeURIComponent(config.client_id)}` +
          `&redirect_uri=${encodeURIComponent(config.redirect_uri)}` +
          "&scope=openid%20email%20profile" +
          `&state=${encodeURIComponent(orgId)}`;
        break;

      case "microsoft":
        if (!config.client_id || !config.tenant_id) {
          return NextResponse.json(
            { error: "Microsoft SSO missing tenant or client_id" },
            { status: 500 }
          );
        }

        loginUrl =
          `https://login.microsoftonline.com/${config.tenant_id}/oauth2/v2.0/authorize` +
          "?response_type=code" +
          `&client_id=${encodeURIComponent(config.client_id)}` +
          `&redirect_uri=${encodeURIComponent(config.redirect_uri)}` +
          "&scope=openid%20email%20profile%20User.Read" +
          `&state=${encodeURIComponent(orgId)}`;
        break;

      case "okta":
        if (!config.okta_domain || !config.client_id) {
          return NextResponse.json(
            { error: "Okta SSO missing okta_domain or client_id" },
            { status: 500 }
          );
        }

        loginUrl =
          `${config.okta_domain}/oauth2/default/v1/authorize` +
          "?response_type=code" +
          `&client_id=${encodeURIComponent(config.client_id)}` +
          `&redirect_uri=${encodeURIComponent(config.redirect_uri)}` +
          "&scope=openid%20email%20profile" +
          `&state=${encodeURIComponent(orgId)}`;
        break;

      case "auth0":
        if (!config.domain || !config.client_id) {
          return NextResponse.json(
            { error: "Auth0 SSO missing domain or client_id" },
            { status: 500 }
          );
        }

        loginUrl =
          `https://${config.domain}/authorize` +
          "?response_type=code" +
          `&client_id=${encodeURIComponent(config.client_id)}` +
          `&redirect_uri=${encodeURIComponent(config.redirect_uri)}` +
          "&scope=openid%20profile%20email" +
          `&state=${encodeURIComponent(orgId)}`;
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported SSO provider" },
          { status: 400 }
        );
    }

    // ----------------------------------------------------
    // 6. Return login URL
    // ----------------------------------------------------
    return NextResponse.json({
      success: true,
      loginUrl,
    });
  } catch (err: any) {
    console.error("SSO Login Handler Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
