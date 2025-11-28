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

    // -----------------------------------------------------
    // 1. LOAD INTERNAL BILLING EVENTS (seat + usage)
    // -----------------------------------------------------
    const { data: internal, error: internalErr } = await supabase
      .from("billing_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (internalErr) {
      console.error("Internal invoice error:", internalErr);
    }

    // Normalize internal invoices
    const formattedInternal =
      internal?.map((evt) => ({
        id: evt.id,
        provider: "internal",
        date: evt.created_at,
        amount: evt.amount,
        currency: "USD",
        pdf: null,
        type: evt.type,
        raw: evt,
      })) ?? [];

    // -----------------------------------------------------
    // 2. LOAD STRIPE INVOICES
    // -----------------------------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const stripeInvoices = await stripe.invoices.list({
      limit: 50,
    });

    const formattedStripe = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      provider: "stripe",
      date: new Date(inv.created).toISOString(),
      amount: inv.amount_paid / 100,
      currency: inv.currency.toUpperCase(),
      pdf: inv.invoice_pdf,
      status: inv.status,
    }));

    // -----------------------------------------------------
    // 3. LOAD LEMON SQUEEZY INVOICES
    // -----------------------------------------------------
    const lemonRes = await fetch("https://api.lemonsqueezy.com/v1/invoices", {
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        Accept: "application/vnd.api+json",
      },
    });

    let lemonData = [];

    if (lemonRes.ok) {
      const lemonJson = await lemonRes.json();
      lemonData = lemonJson.data?.map((inv: any) => ({
        id: inv.id,
        provider: "lemon",
        date: inv.attributes.created_at,
        amount: inv.attributes.total / 100,
        currency: inv.attributes.currency.toUpperCase(),
        pdf: inv.attributes.urls.invoice_url,
        status: inv.attributes.status,
      })) ?? [];
    } else {
      console.warn("Could not load Lemon invoices");
    }

    // -----------------------------------------------------
    // 4. MERGE ALL PROVIDERS
    // -----------------------------------------------------
    const allInvoices = [
      ...formattedStripe,
      ...lemonData,
      ...formattedInternal,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ invoices: allInvoices });
  } catch (err: any) {
    console.error("Invoice API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
