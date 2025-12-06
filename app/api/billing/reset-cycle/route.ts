// app/api/billing/reset-cycle/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESET BILLING CYCLE
 * ------------------------------------------------------------
 * POST /api/billing/reset-cycle
 *
 * Inputs:
 *  {
 *    orgId: string
 *  }
 *
 * What this does:
 *  - Validates organization exists
 *  - Calculates next cycle window
 *  - Updates billing cycle start/end
 *  - (Optionally) Zeroes usage_logs for new cycle separation
 *
 * Notes:
 *  - Cron job calls this automatically at midnight on cycle_end
 *  - Admin panel may call this manually in the future
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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------------
    // 1. Load org billing info
    // ------------------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("cycle_start, cycle_end, plan_id")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const oldEnd = new Date(org.cycle_end);

    // ------------------------------------------------------------
    // 2. Determine new billing cycle window
    //    – 30 days default
    //    – Enterprise can be 30 / 90 / 365 later
    // ------------------------------------------------------------
    const newStart = new Date();
    const newEnd = new Date();
    newEnd.setDate(newStart.getDate() + 30);

    // ------------------------------------------------------------
    // 3. Update org billing cycle
    // ------------------------------------------------------------
    const { error: updateErr } = await supabase
      .from("organizations")
      .update({
        cycle_start: newStart.toISOString(),
        cycle_end: newEnd.toISOString(),
      })
      .eq("id", orgId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to reset billing cycle" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 4. OPTIONAL: Add reset event to usage logs
    // ------------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      deleted_files: 0,
      renamed_files: 0,
      cycle_reset: true,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Billing cycle reset successfully",
      new_cycle_start: newStart,
      new_cycle_end: newEnd,
    });
  } catch (err: any) {
    console.error("Reset cycle API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
