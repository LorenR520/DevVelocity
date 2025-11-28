// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { plan, seats } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Fetch user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ============================
    // ⭐ Stripe client
    // ============================
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // ============================
    // ⭐ Plan price ID mapping
    // ============================
    const PRICE_IDS = {
      developer: process.env.STRIPE_PRICE_DEVELOPER!,
      startup: process.env.STRIPE_PRICE_STARTUP!,
      team: process.env.STRIPE_PRICE_TEAM!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!, // custom contracts supported
    };

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // ===================================================================
    // ⭐ If enterprise → redirect to sales form instead of billing flow
    // ===================================================================
    if (plan === "enterprise") {
      return NextResponse.json({
        url: `${process.env.APP_URL}/contact-sales`,
      });
    }

    // ===================================================================
    // ⭐ Create Stripe customer if not exists
    // ===================================================================
    let customerId = user.app_metadata?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID in Supabase
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          stripe_customer_id: customerId,
        },
      });
    }

    // ===================================================================
    // ⭐ Seat quantity handling (Developer/Startup/Team)
    // ===================================================================
    const qty = seats ? Number(seats) : 1;

    // ===================================================================
    // ⭐ Create Checkout Session
    // ===================================================================
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: qty,
        },
      ],
      metadata: {
        userId: user.id,
        plan: plan,
        seats: qty,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
          seats: qty,
        },
      },
      success_url: `${process.env.APP_URL}/dashboard/billing?status=success`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?status=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
