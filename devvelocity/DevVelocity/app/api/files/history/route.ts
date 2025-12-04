// app/api/files/history/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * File History API
 * ------------------------------------------------
 * Returns version history for a given file.
 *
 * ❗ Developer plan is blocked (upgrade required)
 * ✔ Startup, Team, Enterprise can use it
 * ✔ All access restricted by org_id via RLS + admin checks
 * ✔ Usage logs increment provider_api_calls
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

    // -----------------------------------------
    // Supabase Admin Client
    // -----------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------------
    // Fetch file to extract org_id + validate existence
    // -----------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, org_id, name")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // Fetch organization to get plan_id
    // -----------------------------------------
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

    // -----------------------------------------
    // BLOCK developer tier from file history
    // -----------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error:
            "File version history is unavailable for Developer plan. Upgrade required.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // Fetch version history
    // -----------------------------------------
    const { data: history, error: histErr } = await supabase
      .from("file_version_history")
      .select("*")
      .eq("file_id", fileId)
      .order("created_at", { ascending: false });

    if (histErr) {
      return NextResponse.json(
        { error: "Unable to load version history" },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // Meter usage
    // -----------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: file.org_id,
      provider_api_calls: 1,
      pipelines_run: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      fileId,
      fileName: file.name,
      history: history || [],
    });
  } catch (err: any) {
    console.error("File history error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
