// app/api/usage/get/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * USAGE SUMMARY API
 * -------------------------------------------------------
 * Returns all metered consumption for an organization.
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Rules:
 *  - Developer → ❌ Cannot access usage dashboard
 *  - Startup / Team / Enterprise → full access
 *
 * Returns:
 *  - total pipelines run
 *  - total provider API calls
 *  - total build minutes
 *  - deleted/restored file counts
 *  - template generation counts
 *  - monthly + daily usage summary
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

    // Developer plan cannot access usage analytics
    if (plan === "developer") {
      return NextResponse.json(
        {
          upgrade_required: true,
          message: "Upgrade required to view detailed usage analytics.",
          usage: null,
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------
    // Supabase (service role required for summarizing usage)
    // -------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------------------------------
    // Load ALL usage logs for org
    // -------------------------------------------------------
    const { data: logs, error: logsErr } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .order("date", { ascending: false });

    if (logsErr) {
      console.error("Usage get error:", logsErr);
      return NextResponse.json(
        { error: "Failed to load usage logs" },
        { status: 500 }
      );
    }

    // -------------------------------------------------------
    // Aggregate totals
    // -------------------------------------------------------
    const totals = {
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      deleted_files: 0,
      restored_files: 0,
      templates_generated: 0,
    };

    logs.forEach((log) => {
      totals.pipelines_run += log.pipelines_run ?? 0;
      totals.provider_api_calls += log.provider_api_calls ?? 0;
      totals.build_minutes += log.build_minutes ?? 0;
      totals.deleted_files += log.deleted_files ?? 0;
      totals.restored_files += log.restored_files ?? 0;
      totals.templates_generated += log.templates_generated ?? 0;
    });

    // -------------------------------------------------------
    // Return full structured usage summary
    // -------------------------------------------------------
    return NextResponse.json({
      success: true,
      plan,
      orgId,
      totals,
      logs: logs ?? [],
    });
  } catch (err: any) {
    console.error("Usage API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
