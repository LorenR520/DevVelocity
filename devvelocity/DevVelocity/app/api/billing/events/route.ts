import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ events: [] });
    }

    // Fetch usage & seat overage events for their org
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ events: [] });
    }

    const { data: events, error: evErr } = await supabase
      .from("billing_events")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false });

    if (evErr) {
      console.error("Billing events error:", evErr);
      return NextResponse.json({ events: [] });
    }

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        amount: e.amount,
        details: e.details,
        created_at: e.created_at,
      })),
    });
  } catch (err: any) {
    console.error("Billing events route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
