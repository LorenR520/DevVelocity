import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET USAGE METRICS
 * ---------------------------------------------------------
 * POST /api/files/usage
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Returns:
 *  - total pipelines this month
 *  - provider API calls
 *  - build minutes
 *  - file actions
 *  - 30-day chart data
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

    // ---------------------------------------------------------
    // Developer Tier → Limited visibility
    // ---------------------------------------------------------
    const restrictedView = plan === "developer";

    // ---------------------------------------------------------
    // Supabase (service role)
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load last 30 days of usage
    // ---------------------------------------------------------
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: logs, error } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .gte("date", since.toISOString())
      .order("date", { ascending: true });

    if (error) {
      console.error("Usage load error:", error);
      return NextResponse.json(
        { error: "Failed to load usage logs" },
        { status: 500 }
      );
    }

    // Aggregate totals
    const totals = logs.reduce(
      (acc, row) => {
        acc.pipelines += row.pipelines_run ?? 0;
        acc.apiCalls += row.provider_api_calls ?? 0;
        acc.buildMinutes += row.build_minutes ?? 0;
        acc.deletedFiles += row.deleted_files ?? 0;
        acc.renamedFiles += row.renamed_files ?? 0;
        acc.clonedFiles += row.cloned_files ?? 0;
        return acc;
      },
      {
        pipelines: 0,
        apiCalls: 0,
        buildMinutes: 0,
        deletedFiles: 0,
        renamedFiles: 0,
        clonedFiles: 0,
      }
    );

    // ---------------------------------------------------------
    // Developer tier = partial data, no totals, no sensitive data
    // ---------------------------------------------------------
    if (restrictedView) {
      return NextResponse.json({
        upgrade_required: true,
        message: "Usage analytics are available on Startup, Team, and Enterprise plans.",
        chart: logs.map((row) => ({
          date: row.date,
          pipelines: row.pipelines_run ?? 0,
        })),
      });
    }

    // ---------------------------------------------------------
    // Full usage return for paid tiers
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      totals,
      chart: logs.map((row) => ({
        date: row.date,
        pipelines: row.pipelines_run ?? 0,
        apiCalls: row.provider_api_calls ?? 0,
        buildMinutes: row.build_minutes ?? 0,
      })),
    });
  } catch (err: any) {
    console.error("Usage endpoint error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
