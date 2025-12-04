// app/api/billing/get-usage/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Returns aggregated usage data for the authenticated user's organization.
 *
 * Used by:
 *  - Billing usage chart
 *  - Billing breakdown
 */

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    // -------------------------------------
    // Block Developer tier from usage data
    // -------------------------------------
    if (plan === "developer") {
      return NextResponse.json({
        usage: null,
        message: "Upgrade required to view usage analytics.",
      });
    }

    // -------------------------------------
    // Initialize Supabase Admin Client
    // -------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------------
    // Get the authenticated user's session
    // -------------------------------------
    const authToken = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(authToken);

    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const orgId = user.user_metadata?.org_id;

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // -------------------------------------
    // Fetch usage logs for org
    // -------------------------------------
    const { data: logs, error: usageErr } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .order("date", { ascending: false })
      .limit(120); // ~4 months of logs

    if (usageErr) {
      return NextResponse.json(
        { error: "Failed to fetch usage logs" },
        { status: 500 }
      );
    }

    // -------------------------------------
    // Aggregate totals
    // -------------------------------------
    const totals = {
      pipelines: 0,
      api_calls: 0,
      build_minutes: 0,
      ai_generations: 0,
      upgrades: 0,
    };

    logs.forEach((log) => {
      totals.pipelines += log.pipelines_run ?? 0;
      totals.api_calls += log.provider_api_calls ?? 0;
      totals.build_minutes += log.build_minutes ?? 0;
      totals.ai_generations += log.ai_generations ?? 0;
      totals.upgrades += log.upgrades ?? 0;
    });

    return NextResponse.json({
      usage: {
        orgId,
        logs,
        totals,
      },
    });
  } catch (err: any) {
    console.error("Billing usage error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
