import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SEARCH TEMPLATES
 * ---------------------------------------------------------
 * POST /api/templates/search
 *
 * Inputs:
 *  {
 *    query: string,
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Developer Limit:
 *  - Max 20 search results
 * Startup/Team/Enterprise:
 *  - Unlimited results
 */

export async function POST(req: Request) {
  try {
    const { query, orgId, plan } = await req.json();

    if (!orgId || !query) {
      return NextResponse.json(
        { error: "Missing query or orgId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Base search (case-insensitive LIKE)
    // ---------------------------------------------------------
    let limit = null;

    // Developer tier = max 20 results
    if (plan === "developer") {
      limit = 20;
    }

    const builder = supabase
      .from("templates")
      .select("id, name, content, org_id")
      .eq("org_id", orgId)
      .ilike("name", `%${query}%`);

    if (limit) builder.limit(limit);

    const { data, error } = await builder;

    if (error) {
      console.error("Template search error:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: data ?? [],
      limited: plan === "developer",
    });
  } catch (err: any) {
    console.error("Search route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
