import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require user login
const protectedRoutes = [
  "/dashboard",
  "/providers",
  "/account",
  "/billing",
];

// Routes that require a paid subscription
const paidRoutes = [
  "/enterprise",
  "/automations",
  "/pipelines",
  "/images/hardened",
];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;

  // Read cookies set by Supabase Auth
  const token = req.cookies.get("sb-access-token")?.value;

  // ---- AUTH REQUIRED ----
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  }

  // ---- SUBSCRIPTION REQUIRED ----
  if (paidRoutes.some((route) => pathname.startsWith(route))) {
    const sub = req.cookies.get("subscription-tier")?.value;

    if (!token) {
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    if (!sub || sub !== "pro") {
      url.pathname = "/pricing";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Required for middleware to run on all routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/providers/:path*",
    "/account/:path*",
    "/billing/:path*",
    "/enterprise/:path*",
    "/automations/:path*",
    "/pipelines/:path*",
    "/images/:path*",
  ],
};
