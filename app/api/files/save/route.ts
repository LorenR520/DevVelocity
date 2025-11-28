import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { name, type, content } = await req.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required." },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Auth: validate user session
    // ----------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // ----------------------------------------
    // Load the user's organization + plan
    // ----------------------------------------
    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan_id")
      .eq("owner_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found." },
        { status: 404 }
      );
    }

    // ----------------------------------------
    // 🚫 PLAN LIMIT: Developer tier cannot use File Portal
    // ----------------------------------------
    if (org.plan_id === "developer") {
      return NextResponse.json(
        {
          error:
            "File Portal is not available on the Developer plan. Upgrade to Startup or higher to unlock file saving.",
        },
        { status: 403 }
      );
    }

    // ----------------------------------------
    // Insert file
    // ----------------------------------------
    const { data, error } = await supabase
      .from("saved_files")
      .insert({
        org_id: org.id,
        user_id: user.id,
        name,
        type,
        content,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ file: data });
  } catch (err: any) {
    console.error("File Save Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Error saving file." },
      { status: 500 }
    );
  }
}
