// app/api/billing/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendReceipt } from "@/server/email/send-receipt";

export const runtime = "edge"; // Cloudflare Pages compatible

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing Stripe signature", { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Stripe webhook signature error:", err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Supabase Admin
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------------------------------
    // 🔥 1. Subscription Created / Updated
    // ----------------------------------------------------
    if (event.type === "customer.subscription.updated") {
      const sub: any = event.data.object;

      const customerId = sub.customer as string;

      // Load Stripe customer → used to fetch metadata.userId/orgId
      const customer = await stripe.customers.retrieve(customerId);

      const userId = (customer as any).metadata?.userId;
      const orgId = (customer as any).metadata?.orgId;

      if (userId) {
        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "stripe",
            plan: sub.items.data[0].price.id,
            status: sub.status,
          },
        });
      }

      if (orgId) {
        await supabase
          .from("organizations")
          .update({
            plan_id: (customer as any).metadata?.plan,
            billing_status: sub.status,
            stripe_subscription_id: sub.id,
          })
          .eq("id", orgId);
      }

      console.log("Stripe subscription updated.");
    }

    // ----------------------------------------------------
    // 🔥 2. Invoice Paid — SEND RECEIPT
    // ----------------------------------------------------
    if (event.type === "invoice.payment_succeeded") {
      const invoice: any = event.data.object;

      await supabase.from("invoices").insert({
        id: invoice.id,
        provider: "stripe",
        org_id: invoice.customer, // later mapped to org in UI
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        date: new Date().toISOString(),
        pdf: invoice.invoice_pdf,
      });

      // Customer email
      const to = invoice.customer_email;

      if (to) {
        await sendReceipt({
          to,
          amount: invoice.amount_paid / 100,
          plan: invoice.lines.data[0]?.description ?? "Subscription",
          seats: invoice.lines.data[0]?.quantity ?? 1,
        });
      }

      console.log("Stripe invoice receipt sent.");
    }

    // ----------------------------------------------------
    // 🔥 3. Subscription Cancelled
    // ----------------------------------------------------
    if (event.type === "customer.subscription.deleted") {
      const sub: any = event.data.object;
      const customer = await stripe.customers.retrieve(sub.customer);

      const orgId = (customer as any).metadata?.orgId;
      const userId = (customer as any).metadata?.userId;

      if (userId) {
        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "stripe",
            status: "canceled",
          },
        });
      }

      if (orgId) {
        await supabase
          .from("organizations")
          .update({
            billing_status: "canceled",
          })
          .eq("id", orgId);
      }

      console.log("Stripe subscription canceled.");
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("⚠ Stripe webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
