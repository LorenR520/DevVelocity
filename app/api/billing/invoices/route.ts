// app/api/billing/invoices/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    let allInvoices: any[] = [];

    // ===================================
    // ⭐ 1 — STRIPE INVOICES
    // ===================================
    try {
      const stripeList = await stripe.invoices.list({
        limit: 100,
      });

      const formatted = stripeList.data.map((inv) => ({
        id: inv.id,
        provider: "stripe",
        amount: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        status: inv.status,
        date: new Date(inv.created * 1000).toISOString(),
        pdf: inv.invoice_pdf,
        hosted_invoice_url: inv.hosted_invoice_url,
      }));

      allInvoices.push(...formatted);
    } catch (err) {
      console.warn("Stripe invoice fetch failed (likely no API keys yet).");
    }

    // ===================================
    // ⭐ 2 — LEMON SQUEEZY INVOICES
    // ===================================
    try {
      const res = await fetch("https://api.lemonsqueezy.com/v1/invoices", {
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      });

      const json = await res.json();
      const data = json.data || [];

      const formatted = data.map((i: any) => ({
        id: i.id,
        provider: "lemon",
        amount: i.attributes.total / 100,
        currency: i.attributes.currency.toUpperCase(),
        status: i.attributes.status,
        date: i.attributes.created_at,
        pdf: i.attributes.urls?.invoice_url,
      }));

      allInvoices.push(...formatted);
    } catch (err) {
      console.warn("Lemon invoice fetch failed (likely no API keys yet).");
    }

    // ===================================
    // ⭐ 3 — INTERNAL BILLING EVENTS
    //    (seat overages + usage charges)
    // ===================================
    const { data: internal, error: internalErr } = await supabase
      .from("billing_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!internalErr && internal) {
      const formatted = internal.map((e: any) => ({
        id: e.id,
        provider: "internal",
        amount: e.amount,
        currency: "USD",
        status: "completed",
        date: e.created_at,
        pdf: null,
        details: e.details,
      }));

      allInvoices.push(...formatted);
    }

    // ===================================
    // ⭐ Sort all invoices by date DESC
    // ===================================
    allInvoices.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      invoices: allInvoices,
    });
  } catch (err: any) {
    console.error("Invoice route error:", err.message);
    return NextResponse.json(
      { error: "Failed to load invoices" },
      { status: 500 }
    );
  }
}
