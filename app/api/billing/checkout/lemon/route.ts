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
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Enterprise routes to contact page instead of Lemon checkout
    if (planId === "enterprise") {
      return NextResponse.json({
        url: "https://devvelocity.app/contact-enterprise",
      });
    }

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

    // Load org
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

    // Find correct Lemon variant
    const lemonVariant =
      process.env[`LEMON_VARIANT_${planId.toUpperCase()}`];

    if (!lemonVariant) {
      return NextResponse.json(
        { error: `Missing LemonSqueezy variant for ${planId}` },
        { status: 500 }
      );
    }

    // Build metadata
    const metadata = {
      plan_id: plan.id,
      org_id: org.id,
      user_id: user.id,
      seats: seats ?? plan.seats_included ?? 1,
    };

    // Create checkout session
    const res = await fetch(
      "https://api.lemonsqueezy.com/v1/checkouts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: user.email,
              },
              custom_data: metadata,
            },
            relationships: {
              variant: {
                data: {
                  type: "variants",
                  id: lemonVariant,
                },
              },
            },
          },
        }),
      }
    );

    const json = await res.json();

    const url = json?.data?.attributes?.url;

    if (!url) {
      return NextResponse.json(
        { error: "Lemon checkout failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Lemon checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
