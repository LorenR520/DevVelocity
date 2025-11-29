"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@supabase/ssr";

export default function FileVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.id;

  const [versions, setVersions] = useState<any[]>([]);
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ------------------------------------------------
  // Load file + version history
  // ------------------------------------------------
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch file record
        const { data: fileData, error: fileError } = await supabase
          .from("files")
          .select("*")
          .eq("id", fileId)
          .single();

        if (fileError) throw fileError;
        setFile(fileData);

        // Fetch full version history
        const { data: versionData, error: versionError } = await supabase
          .from("file_version_history")
          .select("*")
          .eq("file_id", fileId)
          .order("created_at", { ascending: false });

        if (versionError) throw versionError;
        setVersions(versionData || []);
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    fetchData();
  }, [fileId]);

  // ------------------------------------------------
  // Restore to a version (via Supabase Edge Function)
  // ------------------------------------------------
  async function restoreVersion(version: any) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/restore-file-version`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          file_id: fileId,
          version_id: version.id,
        }),
      }
    );

    const json = await res.json();
    if (json.error) {
      alert("Error restoring version: " + json.error);
    } else {
      router.refresh();
      alert("Version restored successfully!");
    }
  }

  // ------------------------------------------------
  // Download version JSON
  // ------------------------------------------------
  function downloadVersion(version: any) {
    const blob = new Blob([JSON.stringify(version.json_content, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.filename}-version-${version.id}.json`;
    a.click();
  }

  if (loading)
    return <p className="text-center text-gray-400 mt-20">Loading...</p>;

  if (error)
    return (
      <p className="text-center text-red-400 mt-20">
        Error: {error}
      </p>
    );

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Versions: {file?.filename}
      </h1>

      <p className="text-gray-400 mb-10">
        Below are all saved versions for this architecture. You can review,
        download, or restore any version.
      </p>

      {versions.length === 0 && (
        <p className="text-gray-400">No versions found.</p>
      )}

      <div className="space-y-6">
        {versions.map((v) => (
          <div
            key={v.id}
            className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  Version {v.id.slice(0, 6)}
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(v.created_at).toLocaleString()}
                </p>

                {/* Outdated Warning */}
                {v.is_outdated && (
                  <p className="mt-2 text-yellow-400 text-sm">
                    ⚠️ This version may be outdated — update recommended.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                {/* Download */}
                <button
                  onClick={() => downloadVersion(v)}
                  className="py-1 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                >
                  Download
                </button>

                {/* Restore */}
                <button
                  onClick={() => restoreVersion(v)}
                  className="py-1 px-3 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                >
                  Restore
                </button>
              </div>
            </div>

            {/* JSON Preview */}
            <pre className="mt-4 bg-black/40 p-4 rounded-lg text-xs whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(v.json_content, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
