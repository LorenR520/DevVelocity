// app/api/billing/invoices/route.ts
//
// Returns ALL invoices across:
// ⭐ Stripe
// ⭐ Lemon Squeezy
// ⭐ Internal Billing Events (usage + seats)
// 
// Output format matches:
// /dashboard/billing/invoices UI
//

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // ---------------------------------------------
    // ⭐ Get authenticated user from JWT header
    // ---------------------------------------------
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const { data: user, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !user?.user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = user.user.id;

    // ---------------------------------------------
    // ⭐ STRIPE INVOICES
    // ---------------------------------------------
    let stripeInvoices: any[] = [];

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      const customerId = user.user.app_metadata?.billing_customer_id;

      if (customerId) {
        const invoices = await stripe.invoices.list({
          customer: customerId,
          limit: 20,
        });

        stripeInvoices = invoices.data.map((inv) => ({
          id: inv.id,
          provider: "stripe",
          date: inv.created * 1000,
          amount: inv.amount_paid / 100,
          currency: inv.currency.toUpperCase(),
          pdf: inv.invoice_pdf,
        }));
      }
    } catch (err) {
      console.error("Stripe invoice fetch error:", err);
    }

    // ---------------------------------------------
    // ⭐ LEMON SQUEEZY INVOICES
    // ---------------------------------------------
    let lemonInvoices: any[] = [];

    try {
      const lemonCustomerId = user.user.app_metadata?.lemon_customer_id;

      if (lemonCustomerId) {
        const res = await fetch(
          `https://api.lemonsqueezy.com/v1/customers/${lemonCustomerId}/invoices`,
          {
            headers: {
              Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
              Accept: "application/vnd.api+json",
            },
          }
        );

        const json = await res.json();
        const invoices = json.data ?? [];

        lemonInvoices = invoices.map((inv: any) => ({
          id: inv.id,
          provider: "lemon",
          date: new Date(inv.attributes.created_at).getTime(),
          amount: inv.attributes.total / 100,
          currency: inv.attributes.currency.toUpperCase(),
          pdf: inv.attributes.urls?.invoice_url ?? null,
        }));
      }
    } catch (err) {
      console.error("Lemon invoice fetch error:", err);
    }

    // ---------------------------------------------
    // ⭐ INTERNAL BILLING EVENTS
    // ---------------------------------------------
    let internalEvents: any[] = [];

    try {
      const { data, error } = await supabase
        .from("billing_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        internalEvents = data.map((e) => ({
          id: e.id,
          provider: "internal",
          date: new Date(e.created_at).getTime(),
          amount: e.amount,
          currency: "USD",
          pdf: null,
          type: e.type,
          details: e.details,
        }));
      }
    } catch (err) {
      console.error("Internal billing events error:", err);
    }

    // ---------------------------------------------
    // ⭐ MERGE EVERYTHING INTO ONE LIST
    // ---------------------------------------------
    const all = [
      ...stripeInvoices,
      ...lemonInvoices,
      ...internalEvents,
    ].sort((a, b) => b.date - a.date);

    return NextResponse.json({
      invoices: all,
    });
  } catch (err: any) {
    console.error("Invoice route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
