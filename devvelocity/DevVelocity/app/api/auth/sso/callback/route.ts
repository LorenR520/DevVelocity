import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SSO Callback Route
 * -------------------------------
 * Supports ANY OIDC-compliant provider (Okta, Azure AD, Google Workspace).
 *
 * Flow:
 *  1. User returns with ?code=
 *  2. Exchange code for tokens
 *  3. Resolve user profile
 *  4. Upsert into Supabase `profiles`
 *  5. Attach to an org
 *  6. Load org plan → set cookie
 *  7. Redirect to /dashboard
 */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        { error: "Missing OAuth code" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Decode "state" (contains redirect + provider info)
    // --------------------------------------------------
    const parsedState = state ? JSON.parse(Buffer.from(state, "base64").toString()) : {};
    const provider = parsedState.provider ?? "oidc";
    const orgId = parsedState.orgId ?? null;

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing org context in OAuth state." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Exchange code → tokens
    // --------------------------------------------------
    const tokenRes = await fetch(`${process.env.SSO_TOKEN_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.SSO_REDIRECT_URL!,
        client_id: process.env.SSO_CLIENT_ID!,
        client_secret: process.env.SSO_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      console.error(await tokenRes.text());
      return NextResponse.json(
        { error: "Failed to exchange OAuth code." },
        { status: 500 }
      );
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;
    const accessToken = tokenData.access_token;

    // --------------------------------------------------
    // Fetch user profile from provider
    // --------------------------------------------------
    const profileRes = await fetch(process.env.SSO_USERINFO_URL!, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "Unable to load SSO user profile." },
        { status: 500 }
      );
    }

    const profile = await profileRes.json();

    const email = profile.email ?? profile.preferred_username;
    const name = profile.name ?? profile.given_name + " " + profile.family_name;

    if (!email) {
      return NextResponse.json(
        { error: "SSO profile missing email." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Supabase Admin
    // --------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Upsert user profile
    // --------------------------------------------------
    const { data: userProfile, error: profileErr } = await supabase
      .from("profiles")
      .upsert(
        {
          email,
          name,
          org_id: orgId,
          sso_provider: provider,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (profileErr) {
      console.error(profileErr);
      return NextResponse.json(
        { error: "Failed to sync SSO profile." },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Load org plan tier
    // --------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found." },
        { status: 404 }
      );
    }

    const plan = org.plan_id ?? "developer";

    // Developer tier cannot use SSO → BLOCK
    if (plan === "developer") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?reason=sso`
      );
    }

    // --------------------------------------------------
    // Set cookies (browser readable)
    // --------------------------------------------------
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
    );

    response.cookies.set("user_email", email, { path: "/" });
    response.cookies.set("user_name", name, { path: "/" });
    response.cookies.set("user_plan", plan, { path: "/" });
    response.cookies.set("user_org", orgId, { path: "/" });

    return response;
  } catch (err: any) {
    console.error("SSO CALLBACK ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal SSO Error" },
      { status: 500 }
    );
  }
}
