import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const form = await req.formData();
  const memberId = form.get("memberId") as string;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  await supabase
    .from("organization_members")
    .delete()
    .eq("user_id", memberId);

  return NextResponse.redirect("/dashboard/team");
}
