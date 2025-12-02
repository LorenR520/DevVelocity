// middleware.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * DevVelocity Middleware
 * -----------------------
 * Purpose:
 *  - Attach user session
 *  - Inject org_id + plan into requests
 *  - Block AI Builder / File Portal for Developer tier
 *  - Basic rate limiting for AI endpoints
 */

export async function middleware(req: Request) {
  const url = new URL(req.url);

  // We only protect /dashboard and /api
  const protectedRoutes = [
    "/dashboard",
    "/api/ai-builder",
    "/api/files",
    "/api/billing",
  ];

  const isProtected = protectedRoutes.some((path) =>
    url.pathname.startsWith(path)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // --------------------------------------------
  // Create Supabase Server Client
  // --------------------------------------------
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.headers.get("cookie")
            ?.split("; ")
            .find((c) => c.startsWith(`${name}=`))
            ?.split("=")[1] ?? "";
        },
      },
    }
  );

  // --------------------------------------------
  // Fetch user session
  // --------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${url.origin}/login`);
  }

  // user.app_metadata contains plan + org_id pushed during subscription sync
  const plan = user.app_metadata?.plan ?? "developer";
  const orgId = user.app_metadata?.org_id ?? null;

  // Attach values to request headers for API routes
  const response = NextResponse.next({
    request: {
      headers: new Headers(req.headers),
    },
  });

  response.headers.set("x-user-id", user.id);
  response.headers.set("x-org-id", orgId);
  response.headers.set("x-plan", plan);

  // --------------------------------------------
  // BLOCK FEATURES FOR DEVELOPER PLAN
  // --------------------------------------------

  const blockList = [
    "/dashboard/files",            // File Portal
    "/api/files",                  // File APIs
    "/api/ai-builder/upgrade-file" // Upgrade engine
  ];

  if (plan === "developer") {
    if (blockList.some((x) => url.pathname.startsWith(x))) {
      return NextResponse.json(
        {
          error:
            "This feature is only available for Startup, Team, or Enterprise plans.",
        },
        { status: 403 }
      );
    }
  }

  // --------------------------------------------
  // AI Route Rate Limiting (basic)
  // --------------------------------------------
  if (url.pathname.startsWith("/api/ai-builder")) {
    const ip = req.headers.get("CF-Connecting-IP") ?? "unknown";
    const key = `ratelimit:${ip}`;

    // naive global rate limit stored at CF cache
    const limit = await fetch(`https://workers.dev/ratelimit?key=${key}`)
      .then((r) => r.json())
      .catch(() => ({ count: 0 }));

    if (limit.count > 25) {
      return NextResponse.json(
        { error: "AI rate limit exceeded. Try again in 60 seconds." },
        { status: 429 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*"
  ],
};
