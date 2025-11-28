import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
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
    // 🧩 2. Plan Gating (Developer cannot access)
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
    // 📂 3. Fetch file metadata
    // ------------------------------------------------
    const { data: files, error } = await supabase
      .from("user_files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to fetch file listings" },
        { status: 500 }
      );
    }

    // ------------------------------------------------
    // ⏳ 4. Add “outdated warning” logic
    // ------------------------------------------------
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

    const results = files.map((file) => {
      const age = Date.now() - new Date(file.created_at).getTime();

      return {
        ...file,
        should_update: age > THIRTY_DAYS,
        update_message:
          age > THIRTY_DAYS
            ? "This file may be outdated. Run it through the AI Builder to get an updated version."
            : null,
      };
    });

    return NextResponse.json({ files: results });
  } catch (err: any) {
    console.error("List files error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
