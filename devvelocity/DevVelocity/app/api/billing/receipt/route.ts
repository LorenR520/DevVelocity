// app/api/billing/receipt/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { invoiceId, provider } = await req.json();

    if (!invoiceId || !provider) {
      return NextResponse.json(
        { error: "Missing invoiceId or provider" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // ⭐ Init Supabase Admin
    // --------------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // ========================================================
    // ⭐ STRIPE RECEIPT
    // ========================================================
    if (provider === "stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      const invoice = await stripe.invoices.retrieve(invoiceId);

      return NextResponse.json({
        provider: "stripe",
        invoiceId: invoice.id,
        customer: invoice.customer_email,
        amount_paid: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        hosted_invoice_url: invoice.hosted_invoice_url,
        pdf: invoice.invoice_pdf,
        status: invoice.status,
        items: invoice.lines.data.map((l) => ({
          description: l.description,
          quantity: l.quantity ?? 1,
          amount: l.amount / 100,
        })),
      });
    }

    // ========================================================
    // ⭐ LEMON SQUEEZY RECEIPT
    // ========================================================
    if (provider === "lemon") {
      const res = await fetch(
        `https://api.lemonsqueezy.com/v1/invoices/${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const json = await res.json();
      const inv = json.data?.attributes;

      if (!inv) {
        return NextResponse.json(
          { error: "Lemon invoice not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        provider: "lemon",
        invoiceId,
        customer: inv.customer_email,
        amount_paid: inv.total / 100,
        currency: inv.currency.toUpperCase(),
        pdf: inv.urls?.invoice_url,
        status: inv.status,
      });
    }

    // ========================================================
    // ⭐ INTERNAL RECEIPTS (Usage + Seat Overages)
    // ========================================================
    if (provider === "internal") {
      const { data, error } = await supabase
        .from("billing_events")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Internal invoice not found" },
          { status: 404 }
       
