import { NextResponse } from "next/server";
import { createClient as createRouteClient } from "@/utils/supabase/route";
import { restoreFileVersion } from "@/lib/files/restore";
import { getPlan } from "@/ai-builder/plan-logic";

/**
 * RESTORE FILE VERSION API
 * POST /api/files/restore-version
 *
 * Body:
 * {
 *   "versionId": "uuid-of-version"
 * }
 *
 * Security:
 * - Must be logged in
 * - Must belong to the same org as the file
 * - Developer tier blocked from version restore feature
 */

export async function POST(req: Request) {
  try {
    const supabase = createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const body = await req.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json({ error: "versionId is required" }, { status: 400 });
    }

    // 🧩 Fetch the user's plan
    const planId = session.user?.app_metadata?.plan ?? "developer";
    const plan = getPlan(planId);

    // 🧩 Block Developer plan
    if (!plan || plan.id === "developer") {
      return NextResponse.json({
        error: "File version restore is not available on the Developer plan. Upgrade required.",
      }, { status: 403 });
    }

    // 🧩 Add org_id to request context
    const augmentedUser = {
      ...user,
      org_id: session.user?.app_metadata?.org_id,
    };

    // 🧠 Execute restore process
    const result = await restoreFileVersion(versionId, augmentedUser);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to restore file version" },
      { status: 500 }
    );
  }
}
