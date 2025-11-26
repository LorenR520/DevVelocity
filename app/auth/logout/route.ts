import { NextResponse } from "next/server";
import { getServerClient } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic"; // 🚨 required

export async function GET() {
  const supabase = getServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect("/");
}
