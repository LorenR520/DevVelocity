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

    // --------------------------
    // 1) Get authenticated user
    // --------------------------
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ invoices: [] });
    }

    const userId = user.id;

    // --------------------------
    // 2) Gather Stripe invoices
    // --------------------------
    let stripeInvoices: any[] = [];
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      if (user.app_metadata?.stripe_customer_id) {
        const invList = await stripe.invoices.list({
          customer: user.app_metadata.stripe_customer_id,
          limit: 50,
        });

        stripeInvoices = invList.data.map((inv) => ({
          provider: "stripe",
          id: inv.id,
          date: inv.status_transitions.finalized_at
            ? new Date(inv.status_transitions.finalized_at * 1000)
            : new Date(inv.created * 1000),
          amount: inv.total / 100,
          currency: inv.currency.toUpperCase(),
          pdf: inv.invoice_pdf,
        }));
      }
    } catch (e) {
      console.warn("Stripe invoice error:", e);
    }

    // --------------------------
    // 3) Gather Lemon invoices
    // --------------------------
    let lemonInvoices: any[] = [];
    try {
      const lemonCustomerId = user.app_metadata?.lemon_customer_id;

      if (lemonCustomerId) {
        const res = await fetch(
          `https://api.lemonsqueezy.com/v1/invoices?filter[customer_id]=${lemonCustomerId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
              Accept: "application/vnd.api+json",
            },
          }
        );

        const json = await res.json();
        const data = json.data || [];

        lemonInvoices = data.map((i: any) => ({
          provider: "lemon",
          id: i.id,
          date: new Date(i.attributes.created_at),
          amount: i.attributes.total / 100,
          currency: i.attributes.currency.toUpperCase(),
          pdf: i.attributes.urls.invoice_url,
        }));
      }
    } catch (e) {
      console.warn("Lemon Squeezy invoice error:", e);
    }

    // --------------------------
    // 4) Internal usage & seat billing
    // --------------------------
    const { data: internal, error: internalErr } = await supabase
      .from("billing_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const internalInvoices =
      internal?.map((e) => ({
        provider: "internal",
        id: e.id,
        date: new Date(e.created_at),
        amount: e.amount,
        currency: "USD",
        type: e.type,
        details: e.details,
      })) ?? [];

    // --------------------------
    // 5) Combine all
    // --------------------------
    const invoices = [
      ...stripeInvoices,
      ...lemonInvoices,
      ...internalInvoices,
    ].sort((a, b) => b.date - a.date);

    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error("Invoices route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
