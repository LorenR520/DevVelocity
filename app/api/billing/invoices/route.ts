// app/api/billing/invoices/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // STRIPE invoices
  const invoiceRes = await stripe.invoices.list({
    limit: 20,
    expand: ["data.customer"],
  });

  const stripeInvoices = invoiceRes.data.map((inv) => ({
    id: inv.id,
    amount: inv.amount_paid / 100,
    currency: inv.currency.toUpperCase(),
    date: inv.created * 1000,
    provider: "stripe",
    status: inv.status,
    pdf: inv.invoice_pdf
  }));

  // LEMON invoices
  const lemonRes = await fetch("https://api.lemonsqueezy.com/v1/invoices", {
    headers: {
      Authorization: `Bearer ${process.env.LEMON_API_KEY!}`,
      Accept: "application/vnd.api+json",
    },
  });

  const lemonJson = await lemonRes.json();

  const lemonInvoices = (lemonJson.data || []).map((i: any) => ({
    id: i.id,
    amount: i.attributes.total / 100,
    currency: "USD",
    date: new Date(i.attributes.created_at).getTime(),
    provider: "lemon",
    status: i.attributes.status,
    pdf: i.attributes.urls?.invoice_url || null
  }));

  return NextResponse.json({
    invoices: [...stripeInvoices, ...lemonInvoices].sort(
      (a, b) => b.date - a.date
    ),
  });
}
