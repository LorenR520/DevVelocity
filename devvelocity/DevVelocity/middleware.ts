import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DevVelocity Middleware
 * -------------------------------------------------
 * - Protects /dashboard/*
 * - Loads session + plan into cookies
 * - Ensures SSO users are mapped to an org
 * - Redirects to login if missing access
 */

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Only protect dashboard routes
  const protectedPaths = ["/dashboard"];
  const isProtected = protectedPaths.some((p) =>
    pathname.startsWith(p)
  );

  if (!isProtected) return NextResponse.next();

  // ----------------------------------------------------------
  // Read cookies
  // ----------------------------------------------------------
  const userId = req.cookies.get("user_id")?.value ?? null;
  const orgId = req.cookies.get("org_id")?.value ?? null;
  const plan = req.cookies.get("user_plan")?.value ?? null;

  // Missing session — redirect to login
  if (!userId) {
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // ----------------------------------------------------------
  // Supabase Admin Client
  // ----------------------------------------------------------
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ----------------------------------------------------------
  // 1. Load Organization if missing
  // ----------------------------------------------------------
  let finalOrgId = orgId;
  let finalPlan = plan;

  if (!finalOrgId) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", userId)
      .single();

    if (!membership) {
      // User exists but has no org — reroute to onboarding
      const redirectUrl = new URL("/onboarding", req.url);
      return NextResponse.redirect(redirectUrl);
    }

    finalOrgId = membership.org_id;
  }

  // ----------------------------------------------------------
  // 2. Load plan tier if missing
  // ----------------------------------------------------------
  if (!finalPlan) {
    const { data: org } = await supabase
      .from("organizations")
      .select("plan_id")
      .eq("id", finalOrgId)
      .single();

    finalPlan = org?.plan_id ?? "developer";
  }

  // ----------------------------------------------------------
  // 3. Attach cookies for next navigation
  // ----------------------------------------------------------
  const res = NextResponse.next();

  res.cookies.set("org_id", String(finalOrgId), {
    path: "/",
    httpOnly: false,
  });

  res.cookies.set("user_plan", String(finalPlan), {
    path: "/",
    httpOnly: false,
  });

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
