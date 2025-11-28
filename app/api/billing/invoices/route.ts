import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get logged in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -------------------------------------------
    // 1) Load org
    // -------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const invoices: any[] = [];

    // -------------------------------------------
    // 2) STRIPE INVOICES
    // -------------------------------------------
    if (org.billing_provider === "stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      const customerId = org.stripe_customer_id;

      if (customerId) {
        const stripeInvoices = await stripe.invoices.list({
          customer: customerId,
          expand: ["data.charge"],
          limit: 20,
        });

        for (const inv of stripeInvoices.data) {
          invoices.push({
            id: inv.id,
            provider: "stripe",
            date: inv.created * 1000,
            amount: inv.amount_paid / 100,
            currency: inv.currency.toUpperCase(),
            pdf: inv.invoice_pdf,
            hosted_url: inv.hosted_invoice_url,
            status: inv.status,
          });
        }
      }
    }

    // -------------------------------------------
    // 3) LEMON SQUEEZY INVOICES
    // -------------------------------------------
    if (org.billing_provider === "lemon") {
      const res = await fetch("https://api.lemonsqueezy.com/v1/invoices", {
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      });

      const json = await res.json();
      const lemonInvoices = json.data || [];

      for (const i of lemonInvoices) {
        invoices.push({
          id: i.id,
          provider: "lemon",
          amount: i.attributes.total / 100,
          currency: i.attributes.currency.toUpperCase(),
          date: new Date(i.attributes.created_at).getTime(),
          pdf: i.attributes.urls?.invoice_url,
          status: i.attributes.status,
        });
      }
    }

    // -------------------------------------------
    // 4) INTERNAL BILLING EVENTS
    //     (usage overages + seat overages)
    // -------------------------------------------
    const { data: internalEvents } = await supabase
      .from("billing_events")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(30);

    for (const evt of internalEvents || []) {
      invoices.push({
        id: evt.id,
        provider: "internal",
        amount: evt.amount,
        currency: "USD",
        date: new Date(evt.created_at).getTime(),
        status: "paid",
        type: evt.type,
        details: evt.details,
      });
    }

    // -------------------------------------------
    // 5) Sort newest → oldest
    // -------------------------------------------
    invoices.sort((a, b) => b.date - a.date);

    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error("Invoices route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
