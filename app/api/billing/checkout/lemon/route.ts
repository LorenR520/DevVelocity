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

    // Enterprise forces contact
    if (planId === "enterprise") {
      return NextResponse.json({
        url: "https://devvelocity.app/contact-enterprise",
      });
    }

    // ----------------------------------
    // ⭐ Supabase: load user + org
    // ----------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Auth context
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

    // ----------------------------------
    // ⭐ Lemon Squeezy API
    // ----------------------------------
    const variantId = process.env[`LEMON_VARIANT_${planId.toUpperCase()}`];

    if (!variantId) {
      return NextResponse.json(
        { error: `Missing Lemon Squeezy variant for ${planId}` },
        { status: 500 }
      );
    }

    const checkoutBody = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email!,
            custom: {
              user_id: user.id,
              org_id: org.id,
              plan_id: planId,
              seats: seats ?? plan.seats_included ?? 1,
            },
          },
          product_options: {
            redirect_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
            cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
          },
        },
        relationships: {
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutBody),
    });

    const json = await res.json();

    if (!json?.data?.attributes?.url) {
      console.error("Lemon checkout error:", json);
      return NextResponse.json(
        { error: "Unable to create checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: json.data.attributes.url });
  } catch (err: any) {
    console.error("Lemon checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
