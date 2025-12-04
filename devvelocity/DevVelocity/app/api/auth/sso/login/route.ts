// app/api/auth/sso/login/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SSO Login Redirect Route
 * -------------------------
 * Input:
 *   - orgId
 *   - provider ("okta" | "azure" | "google" | "auth0" | "oidc")
 *
 * Output:
 *   - Redirects to the provider’s authorization URL with
 *     state = { orgId, provider }
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const orgId = searchParams.get("orgId");
    const provider = searchParams.get("provider") ?? "oidc";

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // 1. Load org SSO configuration (client ID, URLs, etc.)
    // -----------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name, sso_settings, plan_id")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // 2. Block SSO for Developer Tier
    // -----------------------------------------------------
    if (org.plan_id === "developer") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/upgrade?from=sso`
      );
    }

    const sso = org.sso_settings?.[provider];

    if (!sso) {
      return NextResponse.json(
        { error: `SSO provider '${provider}' not configured for this org.` },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // 3. Build the authorization URL
    // -----------------------------------------------------
    const state = Buffer.from(
      JSON.stringify({
        orgId,
        provider,
        timestamp: Date.now(),
      })
    ).toString("base64");

    const params = new URLSearchParams({
      client_id: sso.clientId,
      response_type: "code",
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/sso/callback`,
      scope: sso.scope ?? "openid profile email",
      state,
    });

    const authUrl = `${sso.authorizationUrl}?${params.toString()}`;

    // -----------------------------------------------------
    // 4. Redirect user to SSO provider
    // -----------------------------------------------------
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("SSO login redirect error:", err);
    return NextResponse.json(
      { error: err.message ?? "SSO redirect failed" },
      { status: 500 }
    );
  }
}
