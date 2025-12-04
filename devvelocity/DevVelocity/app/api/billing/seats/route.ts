import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SEAT ANALYTICS ROUTE
 * -------------------------
 * Returns seat usage, plan limits, and any overage charges.
 *
 * Output:
 * {
 *   plan_id: "team",
 *   included_seats: 5,
 *   active_seats: 8,
 *   overage: 3,
 *   overage_cost: 30,
 *   seat_price: 10,
 *   seats: [ { id, email, role, created_at } ]
 * }
 */

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // 1. Decode org_id from request
    // --------------------------------------------------
    const { orgId } = await req.json();
    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // --------------------------------------------------
    // 2. Load organization & plan
    // --------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id, seats_purchased")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const plan = org.plan_id ?? "developer";

    // --------------------------------------------------
    // Developer plan does NOT support seats
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          plan_id: "developer",
          included_seats: 1,
          active_seats: 1,
          overage: 0,
          overage_cost: 0,
          seats: [],
          message: "Upgrade required to view team seat details.",
        },
        { status: 200 }
      );
    }

    // --------------------------------------------------
    // 3. Fetch all users belonging to the org
    // --------------------------------------------------
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, email, role, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    if (usersErr) {
      return NextResponse.json({ error: "Failed to load seat data" }, { status: 500 });
    }

    const activeSeats = users.length;

    // --------------------------------------------------
    // 4. Plan tier seat limits
    // (can be customized easily for pricing changes)
    // --------------------------------------------------
    const PLAN_LIMITS: Record<string, number> = {
      startup: 3,
      team: 10,
      enterprise: 9999,
    };

    const includedSeats =
      org.seats_purchased || PLAN_LIMITS[plan] || PLAN_LIMITS["startup"];

    const SEAT_PRICE = 10; // $10 per overage seat

    const overage = Math.max(0, activeSeats - includedSeats);
    const overageCost = overage * SEAT_PRICE;

    // --------------------------------------------------
    // 5. Response
    // --------------------------------------------------
    return NextResponse.json({
      plan_id: plan,
      included_seats: includedSeats,
      active_seats: activeSeats,
      overage,
      overage_cost: overageCost,
      seat_price: SEAT_PRICE,
      seats: users ?? [],
    });
  } catch (err: any) {
    console.error("Seat analytics error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
