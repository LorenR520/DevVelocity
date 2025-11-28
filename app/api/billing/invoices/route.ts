import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // -----------------------------------------------------
    // ⭐ Fetch organization from auth session
    // -----------------------------------------------------
    // (Later you will replace with actual org_id from session)
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .single();

    if (!org) {
      return NextResponse.json(
        { invoices: [], error: "No organization found" },
        { status: 400 }
      );
    }

    const invoices: any[] = [];

    // -----------------------------------------------------
    // ⭐ STRIPE INVOICES
    // -----------------------------------------------------
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      if (org.stripe_customer_id) {
        const stripeInvoices = await stripe.invoices.list({
          customer: org.stripe_customer_id,
          limit: 50,
        });

        for (const inv of stripeInvoices.data) {
          invoices.push({
            provider: "stripe",
            id: inv.id,
            amount: inv.amount_paid / 100,
            currency: inv.currency.toUpperCase(),
            date: inv.status_transitions?.paid_at
              ? new Date(inv.status_transitions.paid_at * 1000)
              : new Date(inv.created * 1000),
            pdf: inv.invoice_pdf,
            hosted: inv.hosted_invoice_url,
          });
        }
      }
    }

    // -----------------------------------------------------
    // ⭐ LEMON SQUEEZY INVOICES
    // -----------------------------------------------------
    if (process.env.LEMON_API_KEY) {
      const res = await fetch("https://api.lemonsqueezy.com/v1/invoices", {
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      });

      const json = await res.json();
      const lemonInvoices = json.data || [];

      for (const inv of lemonInvoices) {
        if (
          inv.attributes.customer_email?.toLowerCase() ===
          org.owner_email?.toLowerCase()
        ) {
          invoices.push({
            provider: "lemon",
            id: inv.id,
            amount: inv.attributes.total / 100,
            currency: inv.attributes.currency.toUpperCase(),
            date: new Date(inv.attributes.created_at),
            pdf: inv.attributes.urls?.invoice_url,
            hosted: inv.attributes.urls?.invoice_url,
          });
        }
      }
    }

    // -----------------------------------------------------
    // ⭐ INTERNAL BILLING EVENTS (seat & usage overages)
    // -----------------------------------------------------
    const { data: internal, error: internalErr } = await supabase
      .from("billing_events")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false });

    if (internal && !internalErr) {
      for (const ev of internal) {
        invoices.push({
          provider: "internal",
          id: ev.id,
          amount: ev.amount,
          currency: "USD",
          date: new Date(ev.created_at),
          pdf: null,
          hosted: null,
          type: ev.type,
        });
      }
    }

    // -----------------------------------------------------
    // ⭐ Sort by newest first
    // -----------------------------------------------------
    invoices.sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error("Invoice route error:", err);
    return NextResponse.json(
      { invoices: [], error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
