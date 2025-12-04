import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SSO Callback Route
 * ---------------------------------------------
 * This handles:
 *  - OAuth2 code exchange
 *  - Validating the SSO provider
 *  - Fetching user profile
 *  - Creating / updating Supabase user
 *  - Attaching the user to the correct org
 *  - Setting cookies for dashboard authentication
 *
 * Supports:
 *  - Google
 *  - Microsoft
 *  - Okta
 *  - Auth0
 */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // orgId passed earlier
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/login?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/login?error=invalid_sso_callback`
      );
    }

    const orgId = state;

    // ---------------------------------------------------------
    // Supabase Admin Client
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load org → determine SSO provider + config
    // ---------------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("sso_provider, sso_config")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/login?error=org_not_found`
      );
    }

    const provider = org.sso_provider;
    const config = org.sso_config || {};

    // ---------------------------------------------------------
    // Exchange OAuth2 code for tokens
    // ---------------------------------------------------------
    let tokenResponse: any = null;

    if (provider === "google") {
      tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: config.client_id,
          client_secret: config.client_secret,
          redirect_uri: config.redirect_uri,
          grant_type: "authorization_code",
        }),
      }).then((r) => r.json());
    }

    else if (provider === "microsoft") {
      tokenResponse = await fetch(
        `https://login.microsoftonline.com/${config.tenant_id}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: config.client_id,
            client_secret: config.client_secret,
            code,
            redirect_uri: config.redirect_uri,
            grant_type: "authorization_code",
          }),
        }
      ).then((r) => r.json());
    }

    else if (provider === "okta") {
      tokenResponse = await fetch(
        `${config.okta_domain}/oauth2/default/v1/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: config.client_id,
            client_secret: config.client_secret,
            redirect_uri: config.redirect_uri,
            code,
          }),
        }
      ).then((r) => r.json());
    }

    else if (provider === "auth0") {
      tokenResponse = await fetch(`https://${config.domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: config.client_id,
          client_secret: config.client_secret,
          redirect_uri: config.redirect_uri,
          code,
        }),
      }).then((r) => r.json());
    }

    if (!tokenResponse || tokenResponse.error) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/login?error=token_exchange_failed`
      );
    }

    // ---------------------------------------------------------
    // Fetch user identity from provider
    // ---------------------------------------------------------
    let profile: any = null;

    if (provider === "google") {
      profile = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }
      ).then((r) => r.json());
    }

    else if (provider === "microsoft") {
      profile = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      }).then((r) => r.json());
    }

    else if (provider === "okta") {
      profile = await fetch(`${config.okta_domain}/oauth2/default/v1/userinfo`, {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }).then((r) => r.json());
    }

    else if (provider === "auth0") {
      profile = await fetch(`https://${config.domain}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }).then((r) => r.json());
    }

    if (!profile || profile.error) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/login?error=profile_fetch_failed`
      );
    }

    const email =
      profile.email ||
      profile.upn ||
      profile.preferred_username ||
      profile.userPrincipalName;

    if (!email) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/login?error=no_email_detected`
      );
    }

    // ---------------------------------------------------------
    // Create or update Supabase user
    // ---------------------------------------------------------
    const { data: user } = await supabase.auth.admin.getUserByEmail(email);

    let userId = user?.id;

    if (!userId) {
      const { data: newUser } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: profile.name,
          sso_provider: provider,
        },
      });

      userId = newUser?.id;
    }

    if (!userId) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/login?error=user_creation_failed`
      );
    }

    // ---------------------------------------------------------
    // Add user → org membership
    // ---------------------------------------------------------
    await supabase.from("org_members").upsert({
      org_id: orgId,
      user_id: userId,
    });

    // ---------------------------------------------------------
    // Set dashboard cookies
    // ---------------------------------------------------------
    const response = NextResponse.redirect(`${process.env.APP_URL}/dashboard`);

    response.cookies.set("user_id", userId, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "lax",
    });

    response.cookies.set("org_id", orgId, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    console.error("SSO Callback Error:", err);
    return NextResponse.redirect(
      `${process.env.APP_URL}/login?error=unexpected_sso_error`
    );
  }
}
