import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * DevVelocity Middleware (Final Production Version)
 * -------------------------------------------------
 * - Protects /dashboard/*
 * - Protects /api/private/*
 * - Loads session, org_id, plan
 * - Ensures Developer is a PAID tier (no free access restrictions)
 * - Enforces restricted features for lower tiers
 * - Supports Supabase SSR auth (Cloudflare + Vercel compatible)
 */

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Public pages
  const publicRoutes = ["/login", "/signup", "/onboarding", "/auth"];
  if (publicRoutes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protected routes
  const isDashboard = pathname.startsWith("/dashboard");
  const isPrivateApi = pathname.startsWith("/api/private");

  if (!isDashboard && !isPrivateApi) {
    return NextResponse.next();
  }

  // Prepare edge response
  const res = NextResponse.next();

  // ----------------------------------------------------------
  // Bind Supabase SSR client (reads/writes auth cookies)
  // ----------------------------------------------------------
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          res.cookies.delete(name, options);
        },
      },
    }
  );

  // ----------------------------------------------------------
  // 1. Load authenticated user
  // ----------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ----------------------------------------------------------
  // 2. Load organization + plan
  // ----------------------------------------------------------
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!membership?.org_id) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  const orgId = membership.org_id;

  const { data: org } = await supabase
    .from("organizations")
    .select("plan_id")
    .eq("id", orgId)
    .single();

  const plan = org?.plan_id ?? "developer"; // Developer is PAID

  // Attach plan + org to cookies for UI client-side access
  res.cookies.set("org_id", String(orgId), {
    path: "/",
    httpOnly: false,
  });

  res.cookies.set("user_plan", String(plan), {
    path: "/",
    httpOnly: false,
  });

  // ----------------------------------------------------------
  // 3. PLAN-BASED PROTECTIONS (Developer is paid → but limited)
  // ----------------------------------------------------------
  if (plan === "developer") {
    // Developer-tier restrictions (since this is paid but entry-level)

    if (pathname.startsWith("/dashboard/ai-builder")) {
      return NextResponse.redirect(new URL("/upgrade?from=ai-builder", req.url));
    }

    if (pathname.startsWith("/dashboard/files")) {
      return NextResponse.redirect(new URL("/upgrade?from=file-portal", req.url));
    }

    // Any other restricted sections can be added here...
  }

  return res;
}

// Matcher defines exactly which routes middleware applies to
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/private/:path*",
  ],
};
