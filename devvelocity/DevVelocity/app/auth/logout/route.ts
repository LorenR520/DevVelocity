// app/auth/logout/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic"; // Cloudflare requires this

export async function GET() {
  const supabase = getServerClient();

  // Sign out the current user
  await supabase.auth.signOut();

  // Redirect to login page
  return NextResponse.redirect("/auth/login");
}
