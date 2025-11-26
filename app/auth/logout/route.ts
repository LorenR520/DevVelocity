import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";  // Required for Cloudflare Pages

export async function GET() {
  await supabase.auth.signOut();
  return NextResponse.redirect("/");
}
