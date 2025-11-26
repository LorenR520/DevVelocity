import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic"; // 🚨 required

export async function GET() {
  const supabase = getServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect("/");
}
