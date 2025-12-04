import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createClient();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing file ID" }, { status: 400 });
    }

    // ---------------------------
    // 1. Ensure user is logged in
    // ---------------------------
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ---------------------------
    // 2. Fetch file securely
    // ---------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ file });
  } catch (err: any) {
    console.error("GET /api/files/get ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
