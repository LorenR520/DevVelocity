// server/billing/seats-bill.ts

import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

export async function billSeatOverages(env: any) {
  console.log("🔎 Running Seat Billing Sync...");

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // ------------------------------
  // 1. Load all organizations
  // ------------------------------
  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .select("id, name, plan_id, pending_seat_amount");

  if (orgErr || !orgs) {
    console.error("❌ Could not fetch organizations:", orgErr);
    return;
  }

  for (const org of orgs) {
    const plan = pricing.plans.find((p) => p.id === org.plan_id);

    if (!plan || !plan.seats_included) continue;

    // Enterprise has custom seat billing handled manually
    if (plan.id === "enterprise") {
      console.log(`🏢 Skipping enterprise org ${org.name} — custom seat billing`);
      continue;
    }

    const includedSeats = plan.seats_included;
    const seatPrice = plan.seat_price;

    // ------------------------------
    // 2. Count currently used seats
    // ------------------------------
    const { count: usedSeats } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id);

    if (usedSeats === null) continue;

    // ------------------------------
    // 3. Determine overages
    // ------------------------------
    const extraSeats = Math.max(0, usedSeats - includedSeats);
    const extraCost = extraSeats * seatPrice;

    if (extraSeats === 0) {
      console.log(`✔ ${org.name}: No seat overages.`);
      continue;
    }

    console.log(
      `💺 ${org.name}: ${extraSeats} extra seat(s) → $${extraCost.toFixed(2)}`
    );

    // ------------------------------
    // 4. Insert billing event
    // ------------------------------
    await supabase.from("billing_events").insert({
      org_id: org.id,
      type: "extra_seat",
      amount: extraCost,
      details: {
        included: includedSeats,
        used: usedSeats,
        extraSeats,
        seatPrice,
      },
    });

    // ------------------------------
    // 5. Add to pending seat total
    // ------------------------------
    await supabase
      .from("organizations")
      .update({
        pending_seat_amount: (org.pending_seat_amount ?? 0) + extraCost,
      })
      .eq("id", org.id);
  }

  console.log("✅ Seat Billing Sync Complete");
}
