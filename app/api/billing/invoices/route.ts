// app/api/billing/invoices/route.ts

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org");

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing org parameter" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ============================================================
    // ⭐ STRIPE INVOICES
    // ============================================================
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    let stripeInvoices: any[] = [];

    const org = await supabase
      .from("organizations")
      .select("stripe_customer_id, lemon_customer_id")
      .eq("id", orgId)
      .single();

    if (org.data?.stripe_customer_id) {
      const stripeList = await stripe.invoices.list({
        customer: org.data.stripe_customer_id,
        limit: 50,
      });

      stripeInvoices = stripeList.data.map((inv) => ({
        id: inv.id,
        provider: "stripe",
        amount: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        date: inv.status_transitions.paid_at
          ? inv.status_transitions.paid_at * 1000
          : Date.now(),
        pdf: inv.invoice_pdf,
        status: inv.status,
        hosted_invoice_url: inv.hosted_invoice_url,
      }));
    }

    // ============================================================
    // ⭐ LEMON SQUEEZY INVOICES
    // ============================================================
    let lemonInvoices: any[] = [];

    if (org.data?.lemon_customer_id) {
      const res = await fetch(
        `https://api.lemonsqueezy.com/v1/invoices?filter[customer_id]=${org.data.lemon_customer_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const json = await res.json();

      lemonInvoices =
        json.data?.map((inv: any) => ({
          id: inv.id,
          provider: "lemon",
          amount: inv.attributes.total / 100,
          currency: inv.attributes.currency.toUpperCase(),
          date: new Date(inv.attributes.created_at).getTime(),
          pdf: inv.attributes.urls?.invoice_url,
          status: inv.attributes.status,
        })) ?? [];
    }

    // ============================================================
    // ⭐ INTERNAL BILLING EVENTS (seat overage + usage overage)
    // ============================================================
    const { data: internal, error: internalErr } = await supabase
      .from("billing_events")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const internalInvoices =
      internal?.map((e) => ({
        id: e.id,
        provider: "internal",
        amount: e.amount,
        currency: "USD",
        date: new Date(e.created_at).getTime(),
        pdf: null,
        status: "paid",
        type: e.type,
        details: e.details,
      })) ?? [];

    // ============================================================
    // ⭐ MERGE ALL PROVIDERS INTO ONE RESPONSE
    // ============================================================
    const invoices = [
      ...stripeInvoices,
      ...lemonInvoices,
      ...internalInvoices,
    ].sort((a, b) => b.date - a.date);

    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error("Invoices route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
