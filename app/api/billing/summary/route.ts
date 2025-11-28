// app/api/billing/summary/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 1. Get the current org (for now: first org)
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found", details: orgErr },
        { status: 500 }
      );
    }

    // 2. Lookup plan from pricing.json
    const planDetails = pricing.plans.find((p) => p.id === org.plan_id) || null;

    // 3. Count seats used
    const { count: seatCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id);

    // 4. Usage overage total
    const usageOverage = org.pending_overage_amount || 0;

    // 5. Seat overage total
    const seatOverage = org.pending_seat_charges || 0;

    // 6. Billing provider (stripe or lemon)
    const billingProvider = org.billing_provider || "unknown";

    return NextResponse.json({
      org_id: org.id,

      plan: planDetails,
      billing_provider: billingProvider,

      seats_used: seatCount ?? 0,
      seats_included: planDetails?.seats_included ?? 0,
      seat_overage_pending: seatOverage,

      usage_overage_pending: usageOverage,

      next_invoice_date: org.next_billing_date ?? null,
      current_cycle_start: org.current_cycle_start ?? null,
    });
  } catch (err: any) {
    console.error("Billing summary error:", err);
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}
