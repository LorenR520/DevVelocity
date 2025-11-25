import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  await supabase.auth.signOut();
  return NextResponse.redirect("/");
}
