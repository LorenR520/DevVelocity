import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // -------------------------------------------------
    // 🔐 1. Get currently logged-in user (via JWT cookie)
    // -------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // -------------------------------------------------
    // 📦 2. Read their app_metadata → plan
    // -------------------------------------------------
    const plan = user.app_metadata?.plan ?? "developer";

    // -------------------------------------------------
    // Use stored plan from auth metadata
    // -------------------------------------------------
    return NextResponse.json({
      user_id: user.id,
      plan,
    });
  } catch (err: any) {
    console.error("User plan lookup error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
