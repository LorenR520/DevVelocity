// app/api/billing/usage/view/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // TODO: Replace with real org context from session
  const ORG_ID = "test-org-id"; // placeholder

  const { data, error } = await supabase
    .from("usage_logs")
    .select("*")
    .eq("org_id", ORG_ID)
    .order("date", { ascending: false });

  return NextResponse.json({ usage: data ?? [] });
}
