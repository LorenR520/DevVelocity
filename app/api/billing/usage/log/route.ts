// app/api/billing/usage/log/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const body = await req.json();
  const { org_id, build_minutes, pipelines_run, provider_api_calls } = body;

  if (!org_id) {
    return NextResponse.json({ error: "Missing org_id" }, { status: 400 });
  }

  await supabase.from("usage_logs").insert({
    org_id,
    build_minutes: build_minutes ?? 0,
    pipelines_run: pipelines_run ?? 0,
    provider_api_calls: provider_api_calls ?? 0,
    date: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
