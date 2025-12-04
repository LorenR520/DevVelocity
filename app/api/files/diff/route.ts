// app/api/files/diff/route.ts

import { NextResponse } from "next/server";
import { diffLines, createTwoFilesPatch } from "diff";
import { createClient } from "@supabase/supabase-js";

/**
 * DEVVELOCITY DIFF API
 * ----------------------------------------------------
 * Compares file versions safely with:
 *
 * ✔ Org validation
 * ✔ File validation
 * ✔ Version validation
 * ✔ Tier enforcement (Developer = blocked)
 * ✔ Supports:
 *      - Current file vs version
 *      - Version vs version
 *      - Supplied text vs current version
 *      - Supplied text vs version
 *
 * Returns:
 * ✔ Structured diff blocks (added/removed/unchanged)
 * ✔ Unified Git-style patch (for future exports)
 */

export async function POST(req: Request) {
  try {
    const {
      fileId,
      baseVersionId,
      compareVersionId,
      orgId,
      plan,
      oldContent, // optional
      newContent, // optional
    } = await req.json();

    // ------------------------------------------------------
    // Required inputs
    // ------------------------------------------------------
    if (!orgId || !fileId) {
      return NextResponse.json(
        { error: "orgId and fileId are required" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------
    // Tier Enforcement
    // ------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to use version comparison.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------
    // Supabase (service role)
    // ------------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------
    // 1. Validate file belongs to org
    // ------------------------------------------------------
    const { data: file } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (!file) {
      return NextResponse.json(
        { error: "File not found or does not belong to org" },
        { status: 404 }
      );
    }

    // ------------------------------------------------------
    // 2. Determine oldContent / newContent source
    // ------------------------------------------------------
    let finalOldContent = "";
    let finalNewContent = "";
    let oldLabel = "";
    let newLabel = "";

    // =============================================
    // CASE A: Client supplied both (AI preview)
    // =============================================
    if (oldContent !== undefined && newContent !== undefined) {
      finalOldContent = oldContent;
      finalNewContent = newContent;

      oldLabel = "Original Input";
      newLabel = "Updated Input";
    }

    // =============================================
    // CASE B: Compare current file vs version
    // =============================================
    else if (baseVersionId && !compareVersionId) {
      const { data: version } = await supabase
        .from("file_version_history")
        .select("*")
        .eq("id", baseVersionId)
        .eq("file_id", fileId)
        .eq("org_id", orgId)
        .single();

      if (!version)
        return NextResponse.json(
          { error: "Version not found for this file/org" },
          { status: 404 }
        );

      finalOldContent =
        version.new_content ?? version.previous_content ?? "";
      finalNewContent = file.content;

      oldLabel = `Version from ${new Date(
        version.created_at
      ).toLocaleString()}`;
      newLabel = "Current Version";
    }

    // =============================================
    // CASE C: Version ↔ Version
    // =============================================
    else if (baseVersionId && compareVersionId) {
      const { data: versionA } = await supabase
        .from("file_version_history")
        .select("*")
        .eq("id", baseVersionId)
        .eq("file_id", fileId)
        .eq("org_id", orgId)
        .single();

      const { data: versionB } = await supabase
        .from("file_version_history")
        .select("*")
        .eq("id", compareVersionId)
        .eq("file_id", fileId)
        .eq("org_id", orgId)
        .single();

      if (!versionA || !versionB)
        return NextResponse.json(
          { error: "One or both versions are invalid." },
          { status: 404 }
        );

      finalOldContent =
        versionA.new_content ?? versionA.previous_content ?? "";
      finalNewContent =
        versionB.new_content ?? versionB.previous_content ?? "";

      oldLabel = `Version from ${new Date(
        versionA.created_at
      ).toLocaleString()}`;
      newLabel = `Version from ${new Date(
        versionB.created_at
      ).toLocaleString()}`;
    }

    // =============================================
    // CASE D: Invalid request
    // =============================================
    else {
      return NextResponse.json(
        {
          error:
            "Provide oldContent/newContent, or baseVersionId, or version pair.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------
    // 3. Generate diff + Git-style patch
    // ------------------------------------------------------
    const diff = diffLines(finalOldContent, finalNewContent);

    const patch = createTwoFilesPatch(
      oldLabel,
      newLabel,
      finalOldContent,
      finalNewContent
    );

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
      oldLabel,
      newLabel,
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
