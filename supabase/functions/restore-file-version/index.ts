// supabase/functions/restore-file-version/index.ts
// -------------------------------------------------
// Restores an older file version by creating a NEW version
// and updating files.latest_version.
// This supports:
//  • version rollback
//  • version branching
//  • upgrade tracking
//  • usage billing per restore
// -------------------------------------------------

import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";

serve({
  async POST(request: Request) {
    try {
      const { file_id, version } = await request.json();

      if (!file_id || !version) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), {
          status: 400,
        });
      }

      // --------------------------------------------
      // Validate auth
      // --------------------------------------------
      const authHeader = request.headers.get("Authorization")!;
      const jwt = authHeader.replace("Bearer ", "");

      const supabase = createSupabaseClient(jwt);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      const orgId = user.user_metadata?.org_id;
      if (!orgId) {
        return new Response(JSON.stringify({ error: "Missing org context" }), {
          status: 400,
        });
      }

      // --------------------------------------------
      // Load original file to confirm ownership
      // --------------------------------------------
      const { data: file, error: fileErr } = await supabase
        .from("files")
        .select("*")
        .eq("id", file_id)
        .eq("org_id", orgId)
        .single();

      if (fileErr || !file) {
        return new Response(JSON.stringify({ error: "File not found" }), {
          status: 404,
        });
      }

      // --------------------------------------------
      // Load the version to restore
      // --------------------------------------------
      const { data: oldVersion, error: vErr } = await supabase
        .from("file_version_history")
        .select("*")
        .eq("file_id", file_id)
        .eq("version", version)
        .eq("org_id", orgId)
        .single();

      if (vErr || !oldVersion) {
        return new Response(JSON.stringify({ error: "Version not found" }), {
          status: 404,
        });
      }

      // --------------------------------------------
      // Create new version number
      // --------------------------------------------
      const newVersionNumber = file.latest_version + 1;

      // --------------------------------------------
      // Insert the new version
      // --------------------------------------------
      const { error: insertErr } = await supabase
        .from("file_version_history")
        .insert({
          file_id,
          org_id: orgId,
          version: newVersionNumber,
          content: oldVersion.content,
        });

      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 400,
        });
      }

      // --------------------------------------------
      // Update latest version on main file row
      // --------------------------------------------
      const { error: updateErr } = await supabase
        .from("files")
        .update({
          latest_version: newVersionNumber,
        })
        .eq("id", file_id)
        .eq("org_id", orgId);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 400,
        });
      }

      // --------------------------------------------
      // Log user activity for billing
      // --------------------------------------------
      await supabase.from("activity_logs").insert({
        org_id: orgId,
        user_id: user.id,
        action: "file_version_restore",
        details: `Restored version ${version} → ${newVersionNumber} for file ${file_id}`,
      });

      // --------------------------------------------
      // Return new version metadata
      // --------------------------------------------
      return new Response(
        JSON.stringify({
          success: true,
          message: "Version restored successfully.",
          restored_to: newVersionNumber,
        }),
        { status: 200 }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
      });
    }
  },
});

// -------------------------------------------------
// Helper: Create Supabase client for Edge Functions
// -------------------------------------------------
import {
  createClient as createSupabaseClientCore,
} from "https://esm.sh/@supabase/supabase-js@2";

function createSupabaseClient(jwt: string) {
  return createSupabaseClientCore(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    }
  );
}
