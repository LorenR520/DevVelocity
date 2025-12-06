// app/api/usage/reset/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESET USAGE (Admin-only)
 * ---------------------------------------------------------
 * POST /api/usage/reset
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    secret: string  // DevVelocity internal secret
 *  }
 *
 * Behavior:
 *  - ONLY accessible with internal secret key
 *  - Clears this month’s usage for an org
 *  - Used for billing cycles or admin corrections
 */

export async function POST(req: Request) {
  try {
    const { orgId, secret } = await req.json();

    if (!orgId || !secret) {
      return NextResponse.json(
        { error: "Missing orgId or secret" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Internal DevVelocity admin secret check
    // ---------------------------------------------------------
    if (secret !== process.env.INTERNAL_ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Delete usage logs for this billing month
    // ---------------------------------------------------------
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { error } = await supabase
      .from("usage_logs")
      .delete()
      .eq("org_id", orgId)
      .gte("date", firstOfMonth.toISOString());

    if (error) {
      console.error("Usage reset error:", error);
      return NextResponse.json(
        { error: "Failed to reset usage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Usage reset for org ${orgId}`,
    });
  } catch (err: any) {
    console.error("Usage reset API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
