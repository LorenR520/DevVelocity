import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing `plan`" },
        { status: 400 }
      );
    }

    // ---------------------------------
    // ⭐ Initialize Supabase (server-side)
    // ---------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // ---------------------------------
    // ⭐ Initialize Stripe
    // ---------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // ---------------------------------
    // ⭐ Map plan → price ID
    // ---------------------------------
    const priceMap: Record<string, string> = {
      developer: process.env.STRIPE_PRICE_DEVELOPER!,
      startup: process.env.STRIPE_PRICE_STARTUP!,
      team: process.env.STRIPE_PRICE_TEAM!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
    };

    const priceId = priceMap[plan];

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // ---------------------------------
    // ⭐ Create Stripe Customer if needed
    // ---------------------------------
    let customerId = user.app_metadata?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
          plan,
        },
      });

      customerId = customer.id;

      // Save Stripe customer ID into Supabase auth metadata
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...user.app_metadata,
          stripe_customer_id: customerId,
        },
      });
    }

    // ---------------------------------
    // ⭐ Create Stripe Checkout Session
    // ---------------------------------
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      // -----------------------------
      // ⭐ IMPORTANT: Metadata for webhooks
      // -----------------------------
      metadata: {
        userId: user.id,
        plan,
      },

      success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?cancelled=1`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (err: any) {
    console.error("Stripe Checkout ERROR:", err);
    return NextResponse.json(
      {
        error: err.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
