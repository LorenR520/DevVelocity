import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Billing Plan Summary API
 * -----------------------------------------
 * Returns:
 *  - plan name + tier
 *  - seats / usage
 *  - pipeline usage
 *  - build minute usage
 *  - provider limit
 *  - next reset window
 *
 * Used by <BillingPlanSummary /> and Billing Dashboard.
 */

export async function POST(req: Request) {
  try {
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------------------------------
    // 1. Get org → plan tier
    // ----------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id, seats")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const planId = org.plan_id ?? "developer";
    const seatsAllowed = org.seats ?? 1;

    // ----------------------------------------------------
    // 2. Load full plan from pricing.json mirror
    //    (You can later store this in DB if needed)
    // ----------------------------------------------------
    const PLAN_MAP: any = {
      developer: {
        id: "developer",
        name: "Developer",
        seats: seatsAllowed,
        provider_limit: 1,
        pipeline_limit: 50,
        build_minutes: 200,
      },
      startup: {
        id: "startup",
        name: "Startup",
        seats: seatsAllowed,
        provider_limit: 3,
        pipeline_limit: 200,
        build_minutes: 1000,
      },
      team: {
        id: "team",
        name: "Team",
        seats: seatsAllowed,
        provider_limit: 7,
        pipeline_limit: 500,
        build_minutes: 5000,
      },
      enterprise: {
        id: "enterprise",
        name: "Enterprise",
        seats: seatsAllowed,
        provider_limit: "unlimited",
        pipeline_limit: 999999,
        build_minutes: 999999,
      },
    };

    const plan = PLAN_MAP[planId];

    // ----------------------------------------------------
    // 3. Usage Logs (pipelines + build minutes)
    // ----------------------------------------------------
    const { data: usage, error: usageErr } = await supabase
      .from("usage_logs")
      .select("pipelines_run, build_minutes, date")
      .eq("org_id", orgId);

    let pipelinesUsed = 0;
    let buildMinutesUsed = 0;

    if (!usageErr && usage) {
      pipelinesUsed = usage.reduce(
        (acc: number, u: any) => acc + (u.pipelines_run || 0),
        0
      );

      buildMinutesUsed = usage.reduce(
        (acc: number, u: any) => acc + (u.build_minutes || 0),
        0
      );
    }

    // ----------------------------------------------------
    // 4. Seat usage (users table)
    // ----------------------------------------------------
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id")
      .eq("org_id", orgId);

    const seatsUsed = !usersErr && users ? users.length : 1;

    // ----------------------------------------------------
    // 5. Next reset cycle (monthly billing)
    // ----------------------------------------------------
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);

    // ----------------------------------------------------
    // 6. Response JSON
    // ----------------------------------------------------
    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,

        seats: plan.seats,
        seats_used: seatsUsed,

        provider_limit: plan.provider_limit,

        pipeline_limit: plan.pipeline_limit,
        pipelines_used: pipelinesUsed,

        build_minutes: plan.build_minutes,
        build_minutes_used: buildMinutesUsed,

        next_reset_date: nextReset.toLocaleDateString(),
      },
    });
  } catch (err: any) {
    console.error("Plan Summary Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
