// app/api/billing/get-invoices/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Returns invoices for the authenticated user's organization.
 *
 * Works with:
 *  - Stripe (live or test mode)
 *  - Lemon Squeezy
 *  - Manual invoices stored in Supabase
 *
 * Tier rules:
 *  - Developer → no invoices (free plan)
 */

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    // Developer plan = no invoices
    if (plan === "developer") {
      return NextResponse.json({
        invoices: [],
        message: "Developer plan has no billing charges.",
      });
    }

    // ---------------------------
    // Supabase Admin Client
    // ---------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------
    // Auth: Get user
    // ---------------------------
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const orgId = user.user_metadata?.org_id;
    if (!orgId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 }
      );
    }

    // ---------------------------
    // Fetch invoices stored in Supabase
    // ---------------------------
    const { data: invoices, error: invErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (invErr) {
      return NextResponse.json(
        { error: "Failed to load invoices" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invoices: invoices ?? [],
    });
  } catch (err: any) {
    console.error("Invoice API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
