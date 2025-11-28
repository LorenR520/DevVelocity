// server/billing/seats-bill.ts

import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

/**
 * Bill seat overages for ALL orgs
 * Called every 15 minutes by Cloudflare Cron
 */
export async function billSeatOverages(env: any) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("🔄 Running seat overage billing...");

  // Load all orgs
  const { data: orgs, error } = await supabase.from("organizations").select("*");

  if (error || !orgs) {
    console.error("Failed to load org list:", error);
    return;
  }

  for (const org of orgs) {
    const plan = pricing.plans.find((p) => p.id === org.plan_id);

    if (!plan) {
      console.log(`Skipping org ${org.id} — No matching plan`);
      continue;
    }

    // Seat logic
    const includedSeats =
      plan.seats_included === "custom" ? org.custom_seats ?? 0 : plan.seats_included;

    const seatPrice =
      plan.seat_price === "custom" ? org.custom_seat_price ?? 0 : plan.seat_price;

    const activeSeats = org.seat_count ?? 0;

    const additionalSeats = Math.max(0, activeSeats - includedSeats);

    if (additionalSeats === 0) continue; // no overage ⇒ skip

    const amount = additionalSeats * seatPrice;

    console.log(
      `💺 Org ${org.id} — ${additionalSeats} extra seats x $${seatPrice} = $${amount}`
    );

    // Write billing event
    const { error: billErr } = await supabase.from("billing_events").insert({
      org_id: org.id,
      type: "seat_overage",
      amount,
      details: {
        included_seats: includedSeats,
        active_seats: activeSeats,
        additional_seats: additionalSeats,
        seat_price: seatPrice,
      },
    });

    if (billErr) {
      console.error("Failed to insert billing event:", billErr);
      continue;
    }

    // Add to pending total
    await supabase
      .from("organizations")
      .update({
        pending_overage_amount:
          (org.pending_overage_amount ?? 0) + amount,
      })
      .eq("id", org.id);
  }

  console.log("✅ Seat overage billing complete");
}
