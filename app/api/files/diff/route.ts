// app/api/files/diff/route.ts

import { NextResponse } from "next/server";
import { createTwoFilesPatch, diffLines } from "diff";

/**
 * DIFF VISUALIZER API
 * --------------------------------------------
 * Compares:
 *  - current file content
 *  - previous file version OR user-supplied text
 *
 * Returns:
 *  - added lines
 *  - removed lines
 *  - unchanged blocks
 *  - full unified diff patch
 *
 * Used in: File Portal → “Compare Versions”
 */

export async function POST(req: Request) {
  try {
    const { oldContent, newContent, filename } = await req.json();

    if (!oldContent || !newContent) {
      return NextResponse.json(
        { error: "oldContent and newContent are required" },
        { status: 400 }
      );
    }

    // --------------------------------------------
    // 1. Compute line-by-line diff
    // --------------------------------------------
    const diff = diffLines(oldContent, newContent);

    // --------------------------------------------
    // 2. Create unified diff patch (Git-style)
    // --------------------------------------------
    const patch = createTwoFilesPatch(
      filename ?? "previous",
      filename ?? "updated",
      oldContent,
      newContent
    );

    // --------------------------------------------
    // 3. Transform to frontend-friendly structure
    // --------------------------------------------
    const blocks = diff.map((part) => ({
      type: part.added
        ? "added"
        : part.removed
        ? "removed"
        : "unchanged",
      value: part.value,
      count: part.count,
    }));

    return NextResponse.json({
      success: true,
      patch,
      blocks,
    });
  } catch (err: any) {
    console.error("Diff route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
