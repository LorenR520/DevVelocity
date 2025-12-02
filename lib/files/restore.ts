import { createClient as createServiceClient } from "@/utils/supabase/service";
import { addActivity } from "@/server/billing/track-activity";

/**
 * Restore a specific file version.
 * 
 * Steps:
 * 1. Validate this version belongs to the user's org
 * 2. Fetch version content
 * 3. Write content to the main `files` table
 * 4. Create a NEW version entry (version history remains accurate)
 * 5. Track billable activity ("file_restore")
 */

export async function restoreFileVersion(versionId: string, user: any) {
  const supabase = createServiceClient();

  // 1. Fetch version entry
  const { data: version, error: versionErr } = await supabase
    .from("file_version_history")
    .select("*")
    .eq("id", versionId)
    .single();

  if (versionErr || !version) {
    return { error: "Version not found." };
  }

  // 2. Confirm org access
  if (version.org_id !== user.org_id) {
    return { error: "Unauthorized. Version does not belong to your organization." };
  }

  // 3. Fetch original file (to update metadata)
  const { data: file, error: fileErr } = await supabase
    .from("files")
    .select("*")
    .eq("id", version.file_id)
    .single();

  if (fileErr || !file) {
    return { error: "Base file not found." };
  }

  // 4. Write restored content to main `files` table
  const { error: updateErr } = await supabase
    .from("files")
    .update({
      content: version.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", file.id);

  if (updateErr) {
    return { error: "Failed to update file content." };
  }

  // 5. Create a NEW version snapshot (reflecting the restore event)
  const { error: logVersionErr } = await supabase
    .from("file_version_history")
    .insert({
      file_id: file.id,
      org_id: user.org_id,
      version_number: file.latest_version + 1,
      content: version.content,
    });

  if (logVersionErr) {
    return { error: "Failed to create new version snapshot." };
  }

  // 6. Update file's version counter
  await supabase
    .from("files")
    .update({
      latest_version: file.latest_version + 1,
    })
    .eq("id", file.id);

  // 7. Track billable activity
  await addActivity({
    org_id: user.org_id,
    event: "file_restore",
    count: 1,
  });

  return { success: true };
}
