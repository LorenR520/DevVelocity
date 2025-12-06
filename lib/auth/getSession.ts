// lib/auth/getSession.ts
// UNIVERSAL AUTH + ORG + PLAN CONTROLLER
// -------------------------------------------------------------
// Used by:
// - dashboard layout
// - file portal
// - billing portal
// - middleware redirects
// - SSO passthrough
// - plan enforcement
// -------------------------------------------------------------

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getSession() {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (key) => cookieStore.get(key)?.value } }
    );

    // 1️⃣ AUTH: Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, org: null, plan: "developer", session: null };
    }

    // 2️⃣ Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return { user, org: null, plan: "developer", session: null };
    }

    // 3️⃣ Get organization + plan
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, plan_id")
      .eq("id", profile.org_id)
      .single();

    const plan = org?.plan_id ?? "developer";

    // 4️⃣ Active subscription metadata (Stripe or Lemon)
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("org_id", profile.org_id)
      .maybeSingle();

    return {
      user,
      org,
      plan,
      role: profile.role,
      subscription,
      session: { user, plan, org },
    };
  } catch (err) {
    console.error("getSession error:", err);
    return { user: null, org: null, plan: "developer", session: null };
  }
}
