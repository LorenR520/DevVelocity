// app/api/billing/usage/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * BILLING USAGE API
 * -----------------------------------------
 * Returns:
 *  - All usage logs for the org
 *  - Aggregated totals
 *  - Requires Startup+ tier (Developer blocked)
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Developer cannot view billing usage
    // -----------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          usage: [],
          totals: {
            pipelines_run: 0,
            provider_api_calls: 0,
            build_minutes: 0,
          },
          message: "Upgrade required to access usage analytics.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // Supabase Admin
    // -----------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------------
    // Fetch usage logs for org
    // -----------------------------------------
    const { data: logs, error: logsErr } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .order("date", { ascending: false });

    if (logsErr) {
      return NextResponse.json(
        { error: "Failed to load usage logs" },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // Compute Totals
    // -----------------------------------------
    const totals = {
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
    };

    logs?.forEach((l) => {
      totals.pipelines_run += l.pipelines_run ?? 0;
      totals.provider_api_calls += l.provider_api_calls ?? 0;
      totals.build_minutes += l.build_minutes ?? 0;
    });

    return NextResponse.json({
      usage: logs ?? [],
      totals,
    });
  } catch (err: any) {
    console.error("Billing usage error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
