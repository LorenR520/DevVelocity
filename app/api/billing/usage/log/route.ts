// app/api/billing/usage/log/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();
  const { org_id, build_minutes, pipelines_run, provider_api_calls } = body;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  await supabase.from("usage_logs").insert({
    org_id,
    build_minutes,
    pipelines_run,
    provider_api_calls,
    date: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
