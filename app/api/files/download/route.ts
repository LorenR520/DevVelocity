// app/api/files/download/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * File Download API
 * -------------------------------
 * Returns a file the user saved in the portal.
 *
 * Rules:
 *  - Developer tier cannot download/sync files (upgrade required)
 *  - Must belong to same org_id
 *  - Returns as downloadable JSON file
 */

export async function POST(req: Request) {
  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId" },
        { status: 400 }
      );
    }

    // ---------------------------
    // Supabase Admin
    // ---------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------
    // Get file with org_id + content
    // ---------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // ---------------------------
    // Fetch org to read plan
    // ---------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id")
      .eq("id", file.org_id)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = org.plan_id ?? "developer";

    // ---------------------------
    // Restrict Developer tier
    // ---------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error:
            "File downloads are not available on the Developer plan. Upgrade required.",
        },
        { status: 403 }
      );
    }

    // ---------------------------
    // Prepare content for download
    // ---------------------------
    const jsonString = JSON.stringify(file.content, null, 2);

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${file.name || "devvelocity_build"}.json"`
    );

    // ---------------------------
    // Meter usage: 1 API call
    // ---------------------------
    await supabase.from("usage_logs").insert({
      org_id: file.org_id,
      provider_api_calls: 1,
      pipelines_run: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return new Response(jsonString, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("Download route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
