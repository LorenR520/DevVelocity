// app/api/billing/invoices/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // ----------------------------
    // ⭐ Init Supabase Admin
    // ----------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // ----------------------------
    // ⭐ Get user
    // ----------------------------
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      return NextResponse.json({ invoices: [] });
    }

    // ----------------------------
    // ⭐ Find user's organization
    // ----------------------------
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json({ invoices: [] });
    }

    // Aggregate invoices:
    const unified: any[] = [];

    // ======================================================================
    // ⭐ STRIPE INVOICES
    // ======================================================================
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      const customers = await stripe.customers.list({
        email: user.email!,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;

        const stripeInvoices = await stripe.invoices.list({
          customer: customerId,
          limit: 20,
        });

        for (const inv of stripeInvoices.data) {
          unified.push({
            id: inv.id,
            provider: "stripe",
            amount: inv.amount_paid / 100,
            currency: inv.currency.toUpperCase(),
            date: inv.created * 1000,
            pdf: inv.invoice_pdf,
            hosted_url: inv.hosted_invoice_url,
          });
        }
      }
    } catch (err) {
      console.error("Stripe invoice error:", err);
    }

    // ======================================================================
    // ⭐ LEMON SQUEEZY INVOICES
    // ======================================================================
    try {
      const res = await fetch(
        "https://api.lemonsqueezy.com/v1/invoices?filter[email]=" +
          encodeURIComponent(user.email ?? ""),
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const json = await res.json();
      const lemonInvoices = json.data || [];

      for (const inv of lemonInvoices) {
        const attr = inv.attributes;

        unified.push({
          id: inv.id,
          provider: "lemon",
          amount: attr.total / 100,
          currency: attr.currency.toUpperCase(),
          date: new Date(attr.created_at).getTime(),
          pdf: attr.urls?.invoice_url,
          hosted_url: attr.urls?.invoice_url,
        });
      }
    } catch (err) {
      console.error("Lemon invoice error:", err);
    }

    // ======================================================================
    // ⭐ INTERNAL INVOICES (Usage + Seat Overages)
    // ======================================================================
    try {
      const { data: internal, error } = await supabase
        .from("billing_events")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });

      if (internal && !error) {
        for (const ev of internal) {
          unified.push({
            id: ev.id,
            provider: "internal",
            amount: ev.amount,
            currency: "USD",
            date: new Date(ev.created_at).getTime(),
            pdf: null,
            hosted_url: null,
            type: ev.type,
            details: ev.details,
          });
        }
      }
    } catch (err) {
      console.error("Internal invoice error:", err);
    }

    // Sort newest → oldest
    unified.sort((a, b) => b.date - a.date);

    return NextResponse.json({ invoices: unified });
  } catch (err: any) {
    console.error("Invoice loading failed:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
