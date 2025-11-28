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

    // -----------------------------------------
    // 🔐 Auth – get current user
    // -----------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -----------------------------------------
    // 🔒 Plan Gating (Developer excluded)
    // -----------------------------------------
    const plan = user.app_metadata?.plan ?? "developer";
    const allowed = ["startup", "team", "enterprise"];

    if (!allowed.includes(plan)) {
      return NextResponse.json(
        {
          error:
            "Downloads are available only on Startup, Team, and Enterprise tiers.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // 📂 Verify the file belongs to this user
    // -----------------------------------------
    const { data: fileMeta, error: metaErr } = await supabase
      .from("user_files")
      .select("*")
      .eq("id", file_id)
      .eq("user_id", user.id)
      .single();

    if (metaErr || !fileMeta) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 🗄 Fetch file from Supabase Storage
    // -----------------------------------------
    const { data: fileBlob, error: fileErr } = await supabase.storage
      .from("user-files")
      .download(fileMeta.storage_key);

    if (fileErr || !fileBlob) {
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // ⏳ Optional: Outdated warning in header
    // -----------------------------------------
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
    const age = Date.now() - new Date(fileMeta.created_at).getTime();

    return new NextResponse(fileBlob, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${fileMeta.name}"`,
        "X-DevVelocity-File-Outdated":
          age > THIRTY_DAYS ? "true" : "false",
      },
    });
  } catch (err: any) {
    console.error("Download file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
