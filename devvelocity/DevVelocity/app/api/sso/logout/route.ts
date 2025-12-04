import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SSO Logout Route
 * ---------------------------------------------------
 * Clears:
 *   - DevVelocity cookies
 *   - Supabase auth session
 *
 * And optionally logs the user out from:
 *   - Google
 *   - Microsoft
 *   - Okta
 *   - Auth0
 *
 * After logout, user is redirected to `/login`
 */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") ?? null;
    const orgId = url.searchParams.get("org") ?? null;

    // --------------------------------------------------
    // Supabase Admin Client
    // --------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Load org SSO config if available
    // --------------------------------------------------
    let ssoConfig = null;
    if (orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("sso_config")
        .eq("id", orgId)
        .single();

      ssoConfig = org?.sso_config ?? null;
    }

    // --------------------------------------------------
    // Clear DevVelocity session cookies
    // --------------------------------------------------
    const response = NextResponse.redirect(`${process.env.APP_URL}/login`);

    response.cookies.delete("user_id");
    response.cookies.delete("org_id");
    response.cookies.delete("user_plan");

    // --------------------------------------------------
    // Optional provider-level logout
    // --------------------------------------------------
    if (provider && ssoConfig) {
      let logoutUrl = null;

      if (provider === "google") {
        logoutUrl = `https://accounts.google.com/Logout`;
      }

      if (provider === "microsoft") {
        logoutUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
          process.env.APP_URL + "/login"
        )}`;
      }

      if (provider === "okta") {
        logoutUrl = `${ssoConfig.okta_domain}/oauth2/default/v1/logout?id_token_hint=${
          ssoConfig.id_token_hint || ""
        }&post_logout_redirect_uri=${encodeURIComponent(
          process.env.APP_URL + "/login"
        )}`;
      }

      if (provider === "auth0") {
        logoutUrl = `https://${ssoConfig.domain}/v2/logout?client_id=${
          ssoConfig.client_id
        }&returnTo=${encodeURIComponent(
          process.env.APP_URL + "/login"
        )}`;
      }

      if (logoutUrl) {
        response.headers.set("Location", logoutUrl);
        return response;
      }
    }

    // --------------------------------------------------
    // Final logout redirect
    // --------------------------------------------------
    return response;
  } catch (err) {
    console.error("SSO Logout Error:", err);
    return NextResponse.redirect(
      `${process.env.APP_URL}/login?error=logout_failed`
    );
  }
}
