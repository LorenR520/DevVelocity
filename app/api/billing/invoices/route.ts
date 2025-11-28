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

    // -------------------------------------
    // 🎟️ STRIPE INVOICES
    // -------------------------------------
    let stripeInvoices: any[] = [];

    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      const list = await stripe.invoices.list({ limit: 100 });

      stripeInvoices = list.data.map((inv) => ({
        id: inv.id,
        provider: "stripe",
        amount: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        date: inv.status_transitions.finalized_at
          ? new Date(inv.status_transitions.finalized_at * 1000)
          : new Date(inv.created * 1000),
        pdf: inv.invoice_pdf,
      }));
    }

    // -------------------------------------
    // 🍋 LEMON SQUEEZY INVOICES
    // -------------------------------------
    let lemonInvoices: any[] = [];

    if (process.env.LEMON_API_KEY) {
      const res = await fetch("https://api.lemonsqueezy.com/v1/invoices", {
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      });

      const json = await res.json();
      const data = json.data ?? [];

      lemonInvoices = data.map((inv: any) => ({
        id: inv.id,
        provider: "lemon",
        amount: inv.attributes.total / 100,
        currency: inv.attributes.currency.toUpperCase(),
        date: new Date(inv.attributes.created_at),
        pdf: inv.attributes.urls?.invoice_url,
      }));
    }

    // -------------------------------------
    // 🧮 INTERNAL (usage + seats)
    // -------------------------------------
    const { data: internal, error: intErr } = await supabase
      .from("billing_events")
      .select("*")
      .order("created_at", { ascending: false });

    const internalInvoices =
      internal?.map((e) => ({
        id: e.id,
        provider: "internal",
        amount: e.amount,
        currency: "USD",
        date: new Date(e.created_at),
        pdf: null,
      })) ?? [];

    // -------------------------------------
    // 🧾 MERGE ALL INVOICES
    // -------------------------------------
    const all = [
      ...stripeInvoices,
      ...lemonInvoices,
      ...internalInvoices,
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ invoices: all });
  } catch (err: any) {
    console.error("INVOICE API ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
