// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { plan, orgId } = await req.json();

    if (!plan || !orgId) {
      return NextResponse.json(
        { error: "Missing plan or orgId" },
        { status: 400 }
      );
    }

    // -----------------------------------
    //  Initialize Stripe + Supabase Admin
    // -----------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------
    //          Get User
    // -----------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -----------------------------------
    //      Plan → Stripe Price Mapping
    // -----------------------------------
    const priceMap: Record<string, string | undefined> = {
      developer: process.env.STRIPE_PRICE_DEVELOPER,
      startup: process.env.STRIPE_PRICE_STARTUP,
      team: process.env.STRIPE_PRICE_TEAM,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    };

    const stripePrice = priceMap[plan];

    if (!stripePrice) {
      return NextResponse.json(
        { error: `Missing Stripe price for plan '${plan}'` },
        { status: 400 }
      );
    }

    // -----------------------------------
    //      Create Stripe Checkout
    // -----------------------------------
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [{ price: stripePrice, quantity: 1 }],

      // Needed for automatic linking
      metadata: {
        userId: user.id,
        orgId,
        plan,
        provider: "stripe",
      },

      subscription_data: {
        metadata: {
          userId: user.id,
          orgId,
          plan,
        },
      },

      success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?cancelled=1`,
      automatic_tax: { enabled: true },

      customer_creation: "always",
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
