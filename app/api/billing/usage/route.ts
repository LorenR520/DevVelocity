import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

export async function GET(req: Request) {
  try {
    // Init Supabase Admin Client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------
    // 1. Get user from request
    // -------------------------------
    const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -------------------------------
    // 2. Get user's organization
    // -------------------------------
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!orgMember) {
      return NextResponse.json({ error: "No org linked" }, { status: 403 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgMember.org_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    const planId = org.plan_id;

    // -------------------------------
    // 3. Get usage logs in cycle
    // -------------------------------
    const { data: usageLogs } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", org.id)
      .gte("date", org.current_cycle_start);

    const logs = usageLogs ?? [];

    const total_build_minutes = logs.reduce((t, u) => t + (u.build_minutes ?? 0), 0);
    const total_pipelines = logs.reduce((t, u) => t + (u.pipelines_run ?? 0), 0);
    const total_api_calls = logs.reduce((t, u) => t + (u.provider_api_calls ?? 0), 0);

    // -------------------------------
    // 4. Respond with usage info
    // -------------------------------
    return NextResponse.json({
      planId,
      cycle_start: org.current_cycle_start,
      totals: {
        total_build_minutes,
        total_pipelines,
        total_api_calls,
      },
    });
  } catch (err: any) {
    console.error("Usage API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
