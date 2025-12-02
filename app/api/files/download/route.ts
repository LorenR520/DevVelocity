import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DOWNLOAD FILE API
 *
 * Rules:
 *  - Developer tier cannot download (upgrade prompt)
 *  - Must verify org ownership
 *  - Returns the file content as a downloadable attachment
 *  - Safe for Cloudflare Pages runtime
 */

export async function POST(req: Request) {
  try {
    const { fileId, plan } = await req.json();

    if (!fileId || !plan) {
      return NextResponse.json(
        { error: "Missing fileId or plan" },
        { status: 400 }
      );
    }

    // 🔒 Developer plan not allowed to download files
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Your plan does not include downloading saved builds.",
          upgrade: true,
          upgradeMessage: "Upgrade to Startup to unlock downloading your generated files."
        },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Load file from database
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

    const fileContent = file.content;
    const filename = file.filename ?? "devvelocity-build.txt";

    // -----------------------------
    // Serve the file for download
    // -----------------------------
    return new Response(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Download error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal download error" },
      { status: 500 }
    );
  }
}
