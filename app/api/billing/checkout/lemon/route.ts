// app/api/billing/checkout/lemon/route.ts

import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

export async function POST(req: Request) {
  try {
    const { plan, orgId } = await req.json();

    if (!plan || !orgId) {
      return NextResponse.json(
        { error: "Missing plan or orgId" },
        { status: 400 }
      );
    }

    // Validate plan exists in pricing.json
    const planMeta = pricing.plans.find((p) => p.id === plan);
    if (!planMeta) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Map plan → Lemon variant ID
    const lemonVariantKey = {
      developer: "LEMON_VARIANT_DEVELOPER",
      startup: "LEMON_VARIANT_STARTUP",
      team: "LEMON_VARIANT_TEAM",
      enterprise: "LEMON_VARIANT_ENTERPRISE",
    }[plan];

    if (!lemonVariantKey) {
      return NextResponse.json(
        { error: "Invalid plan for Lemon checkout" },
        { status: 400 }
      );
    }

    const variantId = process.env[lemonVariantKey];

    if (!variantId) {
      return NextResponse.json(
        { error: "Missing Lemon variant ENV variable" },
        { status: 500 }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate organization exists
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Prepare Lemon checkout request
    const body = JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              orgId,
              plan,
            },
          },
          product_options: {
            enabled_variants: [variantId],
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: process.env.LEMON_STORE_ID },
          },
        },
      },
    });

    const checkoutUrl = `https://api.lemonsqueezy.com/v1/checkouts`;

    const res = await fetch(checkoutUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/json",
      },
      body,
    });

    const json = await res.json();

    if (!json.data?.attributes?.url) {
      console.error("Lemon checkout error:", json);
      return NextResponse.json(
        { error: "Failed to create Lemon checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: json.data.attributes.url,
    });
  } catch (err: any) {
    console.error("Lemon checkout error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
