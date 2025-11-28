import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { filename, content } = await req.json();

    if (!filename || !content) {
      return NextResponse.json(
        { error: "Filename and content required" },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // 🔐 1. Auth: Get logged-in user
    // ------------------------------------------------
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

    // ------------------------------------------------
    // 📦 2. Enforce Plan Gating
    // ------------------------------------------------
    const plan = user.app_metadata?.plan ?? "developer";
    const allowedPlans = ["startup", "team", "enterprise"];

    if (!allowedPlans.includes(plan)) {
      return NextResponse.json(
        {
          error:
            "File Portal is available only for Startup, Team, and Enterprise plans.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------
    // 📥 3. Save File to Supabase Storage
    // ------------------------------------------------
    const path = `${user.id}/${Date.now()}-${filename}`;

    const upload = await supabase.storage
      .from("user-files")
      .upload(path, content, {
        upsert: false,
      });

    if (upload.error) {
      console.error(upload.error);
      return NextResponse.json(
        { error: "File upload failed" },
        { status: 500 }
      );
    }

    // ------------------------------------------------
    // 🗄️ 4. Save File Metadata to DB
    // ------------------------------------------------
    const { error: dbErr } = await supabase.from("user_files").insert({
      user_id: user.id,
      filename,
      storage_path: path,
      created_at: new Date().toISOString(),
    });

    if (dbErr) {
      console.error(dbErr);
      return NextResponse.json(
        { error: "Database insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        filename,
        path,
      },
    });
  } catch (err: any) {
    console.error("File save error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
