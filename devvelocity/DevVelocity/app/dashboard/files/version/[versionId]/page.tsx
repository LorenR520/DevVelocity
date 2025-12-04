import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function FileVersionPage({
  params,
}: {
  params: { versionId: string };
}) {
  const versionId = params.versionId;
  const cookieStore = cookies();
  const plan = cookieStore.get("user_plan")?.value ?? "developer";

  // Developer tier blocked
  if (plan === "developer") {
    return (
      <div className="p-10 text-white">
        <h1 className="text-2xl font-bold">Upgrade Required</h1>

        <p className="text-gray-400 mt-4 mb-6">
          Viewing saved file versions is only available for Startup, Team, and
          Enterprise plans.
        </p>

        <Link
          href="/upgrade?from=file-version"
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // --------------------------------------------------------------
  // Load version entry
  // --------------------------------------------------------------
  const { data: version, error: versionErr } = await supabase
    .from("file_version_history")
    .select(
      `
      id,
      file_id,
      org_id,
      new_content,
      previous_content,
      change_summary,
      created_at
    `
    )
    .eq("id", versionId)
    .single();

  if (versionErr || !version) {
    return (
      <div className="p-10 text-red-400">
        Failed to load version history record.
      </div>
    );
  }

  // --------------------------------------------------------------
  // Load parent file metadata
  // --------------------------------------------------------------
  const { data: parentFile, error: fileErr } = await supabase
    .from("files")
    .select("id, filename, updated_at")
    .eq("id", version.file_id)
    .single();

  const displayJson = JSON.stringify(
    JSON.parse(version.new_content),
    null,
    2
  );

  return (
    <div className="max-w-5xl mx-auto p-10 text-white">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-2">
        Version Details – {parentFile?.filename}
      </h1>

      <p className="text-gray-400 mb-6">
        Saved on{" "}
        {new Date(version.created_at).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>

      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/dashboard/files`}
          className="text-blue-400 hover:text-blue-300 underline"
        >
          ← Back to Files
        </Link>

        <Link
          href={`/dashboard/files/compare/${version.file_id}`}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
        >
          Compare Versions
        </Link>

        <form
          action={`/api/files/restore-version`}
          method="POST"
          className="inline-block"
        >
          <input type="hidden" name="versionId" value={versionId} />
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            type="submit"
          >
            Restore This Version
          </button>
        </form>
      </div>

      {/* Display JSON */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <SyntaxHighlighter
          language="json"
          style={tomorrow}
          wrapLines={true}
          wrapLongLines={true}
          customStyle={{
            background: "rgba(0,0,0,0.4)",
            padding: "16px",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          {displayJson}
        </SyntaxHighlighter>
      </div>

      {/* Change Summary */}
      {version.change_summary && (
        <div className="mt-8 p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <h2 className="text-xl font-semibold mb-3">Change Summary</h2>
          <p className="text-gray-300 whitespace-pre-wrap">
            {version.change_summary}
          </p>
        </div>
      )}
    </div>
  );
}
