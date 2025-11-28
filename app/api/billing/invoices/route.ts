// app/api/billing/invoices/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  try {
    const invoices: any[] = [];

    // -------------------------------
    // 1️⃣   STRIPE INVOICES
    // -------------------------------
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const stripeInvoices = await stripe.invoices.list({
        limit: 100,
      });

      for (const inv of stripeInvoices.data) {
        invoices.push({
          id: inv.id,
          provider: "stripe",
          date: inv.created * 1000,
          amount: (inv.amount_paid ?? inv.amount_due) / 100,
          currency: inv.currency?.toUpperCase() ?? "USD",
          pdf: inv.invoice_pdf ?? null,
        });
      }
    } catch (err) {
      console.error("Stripe invoice error:", err);
    }

    // -------------------------------
    // 2️⃣   LEMON SQUEEZY INVOICES
    // -------------------------------
    try {
      const res = await fetch("https://api.lemonsqueezy.com/v1/orders", {
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      });

      const json = await res.json();
      const orders = json.data || [];

      for (const o of orders) {
        invoices.push({
          id: o.id,
          provider: "lemonsqueezy",
          date: new Date(o.attributes.created_at).getTime(),
          amount: parseFloat(o.attributes.total) / 100,
          currency: o.attributes.currency ?? "USD",
          pdf: o.attributes.urls?.invoice ?? null,
        });
      }
    } catch (err) {
      console.error("Lemon invoice error:", err);
    }

    // -------------------------------
    // Sort latest → oldest
    // -------------------------------
    invoices.sort((a, b) => b.date - a.date);

    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error("INVOICE API ERROR:", err);
    return NextResponse.json(
      { error: "Server error", message: err?.message },
      { status: 500 }
    );
  }
}
