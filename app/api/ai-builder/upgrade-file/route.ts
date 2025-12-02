import { NextResponse } from "next/server";
import { runUpgradeEngine } from "@/server/ai/upgrade-engine";

export const runtime = "edge";

/**
 * AI Builder — Upgrade an Existing Build File
 * POST /api/ai-builder/upgrade-file
 *
 * Body:
 * {
 *   "plan": "startup",
 *   "fileContent": "{... json ...}",
 *   "metadata": {
 *      "file_id": "...",
 *      "org_id": "...",
 *      "user_id": "..."
 *   }
 * }
 */
export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { plan, fileContent, metadata } = body;

    if (!plan) {
      return NextResponse.json(
        { error: "Missing required field: plan" },
        { status: 400 }
      );
    }

    if (!fileContent) {
      return NextResponse.json(
        { error: "Missing required field: fileContent" },
        { status: 400 }
      );
    }

    if (!metadata || !metadata.file_id) {
      return NextResponse.json(
        { error: "Missing metadata.file_id" },
        { status: 400 }
      );
    }

    // 🔥 Run GPT-5.1-Pro Upgrade Engine
    let upgraded;
    try {
      upgraded = await runUpgradeEngine({
        plan,
        fileContent,
        metadata,
      });
    } catch (err: any) {
      console.error("Upgrade Engine Error:", err);
      return NextResponse.json(
        { error: "File upgrade engine failed." },
        { status: 500 }
      );
    }

    if (!upgraded) {
      return NextResponse.json(
        { error: "No upgrade result returned." },
        { status: 500 }
      );
    }

    // 🎯 Respond with upgraded file
    return NextResponse.json(
      {
        upgradedFile: upgraded.file,
        changes: upgraded.changes,
        upgradeHints: upgraded.upgradeHints || [],
        versionRecorded: upgraded.versionRecorded ?? false,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unhandled Upgrade API Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
