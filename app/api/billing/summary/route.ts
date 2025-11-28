import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get the user from RLS session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ======================================
    // 1) Fetch organization
    // ======================================
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // ======================================
    // 2) Resolve pricing plan details
    // ======================================
    const currentPlan =
      pricing.plans.find((p) => p.id === org.plan_id) ??
      pricing.plans.find((p) => p.id === "developer"); // fallback

    // ======================================
    // 3) Seats info
    // ======================================
    const totalSeats = org.seat_count ?? 1;
    const included = currentPlan.seats_included;
    const overage =
      typeof included === "number" ? Math.max(0, totalSeats - included) : 0;

    // ======================================
    // 4) Pull 5 recent invoices (Stripe, Lemon & Internal)
    // ======================================
    const { data: invoices } = await supabase
      .from("billing_events")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // ======================================
    // 5) Determine provider
    // ======================================
    const provider = org.billing_provider || "internal";

    // ======================================
    // 6) Build response
    // ======================================
    return NextResponse.json({
      current_plan: currentPlan,
      provider,
      seats: {
        total: totalSeats,
        included,
        overage,
      },
      pending_overage_amount: org.pending_overage_amount ?? 0,
      next_invoice_date:
        org.next_invoice_date ?? new Date().toISOString(), // placeholder
      recent_invoices: invoices ?? [],
    });
  } catch (err: any) {
    console.error("Error in billing summary:", err);
    return NextResponse.json(
      { error: err.message ?? "Billing summary error" },
      { status: 500 }
    );
  }
}
