import DiffViewer from "@/components/DiffViewer";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";

/**
 * FILE COMPARE PAGE
 * ----------------------------------------
 * Allows user to:
 *  - load file metadata
 *  - choose 2 versions
 *  - view differences
 * 
 * TIER RULES:
 *  Developer → blocked (must upgrade)
 */

export default async function CompareFilePage({
  params,
}: {
  params: { id: string };
}) {
  const fileId = params.id;

  const cookieStore = cookies();
  const plan = cookieStore.get("user_plan")?.value ?? "developer";

  // Developer tier → redirect to upgrade
  if (plan === "developer") {
    return (
      <div className="p-10 text-white">
        <h1 className="text-3xl font-bold mb-4">Upgrade Required</h1>
        <p className="text-gray-300 mb-6">
          Comparing saved file versions is available only for Startup, Team, and Enterprise plans.
        </p>

        <Link
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          href="/upgrade?from=compare"
        >
          Upgrade My Plan
        </Link>
      </div>
    );
  }

  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // -----------------------------
  // Load file metadata
  // -----------------------------
  const { data: file, error: fileErr } = await supabase
    .from("files")
    .select("id, filename, content")
    .eq("id", fileId)
    .single();

  if (fileErr || !file) {
    return (
      <div className="p-10 text-red-400">
        Failed to load file.
      </div>
    );
  }

  // -----------------------------
  // Load version history
  // -----------------------------
  const { data: versions, error: verErr } = await supabase
    .from("file_version_history")
    .select("id, created_at, new_content")
    .eq("file_id", fileId)
    .order("created_at", { ascending: false });

  if (verErr) {
    return (
      <div className="p-10 text-red-400">
        Failed to load version history.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">Compare Versions — {file.filename}</h1>

      {/* Back button */}
      <Link
        href="/dashboard/files"
        className="text-blue-400 hover:text-blue-300 underline mb-6 inline-block"
      >
        ← Back to Files
      </Link>

      {/* Version selector */}
      <form className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="block mb-2 text-gray-300 font-medium">
              Select Old Version
            </label>
            <select
              name="old"
              className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg"
            >
              <option value={file.content}>Current File</option>
              {versions?.map((v) => (
                <option key={v.id} value={v.new_content}>
                  {new Date(v.created_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-gray-300 font-medium">
              Select New Version
            </label>
            <select
              name="new"
              className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg"
            >
              <option value={file.content}>Current File</option>
              {versions?.map((v) => (
                <option key={v.id} value={v.new_content}>
                  {new Date(v.created_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

        </div>

        <button
          formAction={async (formData) => {
            "use server";
          }}
          className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          disabled
        >
          Use the Diff Viewer Below (Auto-Rendered)
        </button>
      </form>

      {/* Auto-Diff below */}
      <div className="mt-10">
        <DiffViewer
          oldContent={file.content}
          newContent={versions?.[0]?.new_content ?? file.content}
        />
      </div>
    </div>
  );
}
