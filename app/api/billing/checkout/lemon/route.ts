// app/api/billing/checkout/lemon/route.ts

import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { planId, seats } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const plan = pricing.plans.find((p) => p.id === planId);

    if (!plan) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
    }

    // Enterprise = request a quote
    if (planId === "enterprise") {
      return NextResponse.json({
        url: "https://devvelocity.app/contact-enterprise",
      });
    }

    // -------- Supabase User + Org Lookup -------- //
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const lemonVariant = process.env[`LEMON_VARIANT_${planId.toUpperCase()}`];

    if (!lemonVariant) {
      return NextResponse.json(
        { error: `Missing Lemon Squeezy variant for ${planId}` },
        { status: 500 }
      );
    }

    const quantitySeats = seats ?? plan.seats_included ?? 1;

    // -------- Build Lemon Checkout -------- //
    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                plan_id: planId,
                org_id: org.id,
                user_id: user.id,
                seats: quantitySeats,
              },
            },
            product_options: {
              variant_id: lemonVariant,
            },
            checkout_options: {
              embed: false,
              enable_upsell: false,
            },
            success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
            cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
          },
        },
      }),
    });

    const json = await res.json();

    const url = json?.data?.attributes?.url;

    if (!url) {
      console.error("Lemon Squeezy response:", json);
      return NextResponse.json(
        { error: "Failed to create Lemon Squeezy checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Lemon checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
