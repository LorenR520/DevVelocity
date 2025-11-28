// app/api/billing/invoices/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // -----------------------------
    // ⭐ FETCH STRIPE INVOICES
    // -----------------------------
    const stripeInvoices = await stripe.invoices.list({
      limit: 50,
      expand: ["data.customer"],
    });

    const stripeFormatted = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      provider: "stripe",
      amount: inv.amount_paid / 100,
      currency: inv.currency.toUpperCase(),
      pdf: inv.invoice_pdf,
      date: inv.created * 1000,
    }));

    // -----------------------------
    // ⭐ FETCH LEMON INVOICES
    // -----------------------------
    const lemonRes = await fetch(
      "https://api.lemonsqueezy.com/v1/invoices",
      {
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    const lemonJson = await lemonRes.json();
    const lemonInvoices = (lemonJson.data || []).map((inv: any) => ({
      id: inv.id,
      provider: "lemon",
      amount: inv.attributes.total / 100,
      currency: inv.attributes.currency?.toUpperCase(),
      pdf: inv.attributes.urls?.invoice_url,
      date: new Date(inv.attributes.created_at).getTime(),
    }));

    // -----------------------------
    // ⭐ FETCH INTERNAL INVOICES
    // (Usage + seat overage)
    // -----------------------------
    const { data: internal, error } = await supabase
      .from("billing_events")
      .select("*")
      .order("created_at", { ascending: false });

    const internalFormatted =
      internal?.map((inv) => ({
        id: inv.id,
        provider: "internal",
        amount: inv.amount,
        currency: "USD",
        pdf: null,
        date: new Date(inv.created_at).getTime(),
      })) ?? [];

    return NextResponse.json({
      invoices: [
        ...stripeFormatted,
        ...lemonInvoices,
        ...internalFormatted,
      ],
    });
  } catch (err: any) {
    console.error("Invoices API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
