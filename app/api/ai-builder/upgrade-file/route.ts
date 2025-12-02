import { NextResponse } from "next/server";
import { upgradeExistingFile } from "@/server/ai/builder-engine";

export const runtime = "edge";

/**
 * DevVelocity — File Upgrade API
 * --------------------------------------------------
 * Accepts a pasted architecture file (JSON or plain text)
 * And upgrades it using GPT-5.1-Pro:
 *   - regenerates cloud-init
 *   - updates docker-compose
 *   - fixes outdated pipelines
 *   - applies new tier limits
 *   - suggests upgrades
 *   - auto-fixes syntax issues
 *   - modernizes infra best practices
 */

export async function POST(req: Request) {
  try {
    const { plan, fileContent } = await req.json();

    if (!fileContent) {
      return NextResponse.json(
        { error: "Missing fileContent" },
        { status: 400 }
      );
    }

    // Run AI engine
    const upgraded = await upgradeExistingFile({
      plan: plan ?? "developer",
      fileContent,
    });

    if (upgraded?.error) {
      return NextResponse.json(
        { error: upgraded.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { upgraded },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Upgrade File Route Error:", err);

    return NextResponse.json(
      {
        error:
          err?.message ??
          "AI file upgrade failed. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
