import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const session = req.cookies.get("sb-access-token");

  const protectedPaths = ["/dashboard", "/billing"];
  const attemptedPath = url.pathname;

  if (protectedPaths.some((path) => attemptedPath.startsWith(path))) {
    if (!session) {
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*"],
};
