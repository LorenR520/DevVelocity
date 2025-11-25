import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Supabase cookies (Cloudflare + Next.js compatible)
  const accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  // Protected routes
  const protectedPaths = ["/dashboard", "/billing"];
  const path = url.pathname;

  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (isProtected && !accessToken && !refreshToken) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*"],
};
