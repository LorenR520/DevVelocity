import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Read user plan from cookie (set at login)
  const plan = req.cookies.get("user_plan")?.value ?? "developer";

  const restrictedForDeveloper = [
    "/dashboard/files",
    "/dashboard/files/update",
    "/dashboard/files/history",
    "/dashboard/files/restore",
    "/dashboard/ai-builder",
  ];

  const isRestricted = restrictedForDeveloper.some((p) =>
    pathname.startsWith(p)
  );

  if (plan === "developer" && isRestricted) {
    const redirectUrl = new URL("/upgrade", req.url);
    redirectUrl.searchParams.set("reason", "feature_requires_upgrade");

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard/files/:path*",
    "/dashboard/ai-builder",
  ],
};
