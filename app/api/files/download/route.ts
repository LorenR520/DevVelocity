import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { file_id } = await req.json();

    if (!file_id) {
      return NextResponse.json(
        { error: "Missing file_id" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------
    // 1. AUTH — validate user session
    // -------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing auth" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (!user || userErr) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const orgId = user.app_metadata?.org_id;
    if (!orgId) {
      return NextResponse.json(
        { error: "No org assigned" },
        { status: 403 }
      );
    }

    // -------------------------------
    // 2. Load file (RLS-secured)
    // -------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", file_id)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied." },
        { status: 404 }
      );
    }

    // -------------------------------
    // 3. Prepare the file for download
    // -------------------------------
    const content = file.content || "";
    const filename = file.filename || `devvelocity-file-${file_id}.txt`;

    // Build raw file download response
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Download error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
