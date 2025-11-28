// app/api/billing/invoices/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

export async function GET(req: Request) {
  try {
    // ------------------------------
    // ⭐ Fetch user/org context
    // ------------------------------
    const url = new URL(req.url);
    const orgId = url.searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get org metadata
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const results: any[] = [];

    // ------------------------------
    // ⭐ STRIPE INVOICES
    // ------------------------------
    if (org.billing_provider === "stripe" && org.stripe_customer_id) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const stripeInvoices = await stripe.invoices.list({
        customer: org.stripe_customer_id,
        limit: 50,
      });

      stripeInvoices.data.forEach((inv) =>
        results.push({
          id: inv.id,
          provider: "stripe",
          amount: inv.amount_paid / 100,
          currency: inv.currency.toUpperCase(),
          status: inv.status,
          date: inv.created * 1000,
          pdf: inv.invoice_pdf,
          hosted_url: inv.hosted_invoice_url,
          items: inv.lines.data.map((l) => ({
            description: l.description,
            amount: l.amount / 100,
            quantity: l.quantity,
          })),
        })
      );
    }

    // ------------------------------
    // ⭐ LEMON SQUEEZY INVOICES
    // ------------------------------
    if (
      org.billing_provider === "lemon" &&
      org.lemon_order_id
    ) {
      const res = await fetch(
        `https://api.lemonsqueezy.com/v1/orders/${org.lemon_order_id}/invoices`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const json = await res.json();
      const invoices = json.data || [];

      invoices.forEach((inv: any) => {
        const a = inv.attributes;

        results.push({
          id: inv.id,
          provider: "lemon",
          amount: a.total / 100,
          currency: a.currency.toUpperCase(),
          date: new Date(a.created_at).getTime(),
          status: a.status,
          pdf: a.urls?.invoice_url,
          hosted_url: a.urls?.receipt_url,
        });
      });
    }

    // ------------------------------
    // ⭐ INTERNAL BILLING EVENTS
    // (usage overages + seat overages)
    // ------------------------------
    const { data: internal, error: intErr } = await supabase
      .from("billing_events")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (!intErr && internal) {
      internal.forEach((ev) =>
        results.push({
          id: ev.id,
          provider: "internal",
          amount: ev.amount,
          currency: "USD",
          status: "processed",
          date: new Date(ev.created_at).getTime(),
          type: ev.type,
          details: ev.details,
        })
      );
    }

    // Sort newest → oldest
    results.sort((a, b) => b.date - a.date);

    return NextResponse.json({ invoices: results });
  } catch (err: any) {
    console.error("Invoice route error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
