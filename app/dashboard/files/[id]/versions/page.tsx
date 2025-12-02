"use client";

import { useEffect, useState } from "react";

interface VersionEntry {
  id: string;
  created_at: string;
  previous_content: string;
  new_content: string;
  change_summary: string;
  last_modified_by?: string;
}

export default function FileVersionHistoryPage({
  params,
}: {
  params: { id: string };
}) {
  const fileId = params.id;

  const [plan, setPlan] = useState("developer");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------
  // Load cookies for plan + org
  // ----------------------------------------------------
  useEffect(() => {
    const p = document.cookie
      .split("; ")
      .find((x) => x.startsWith("user_plan="));
    setPlan(p ? p.split("=")[1] : "developer");

    const org = document.cookie
      .split("; ")
      .find((x) => x.startsWith("org_id="));
    setOrgId(org ? org.split("=")[1] : null);
  }, []);

  // ----------------------------------------------------
  // Fetch version history
  // ----------------------------------------------------
  useEffect(() => {
    async function load() {
      if (!fileId || !orgId) return;

      const res = await fetch("/api/files/version-list", {
        method: "POST",
        body: JSON.stringify({ fileId, orgId, plan }),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setVersions(json.versions ?? []);
      }

      setLoading(false);
    }

    load();
  }, [fileId, orgId, plan]);

  // ----------------------------------------------------
  // Restrict Developer tier
  // ----------------------------------------------------
  if (plan === "developer") {
    return (
      <main className="p-10 text-white">
        <h1 className="text-3xl font-bold mb-4">Version History</h1>

        <div className="p-6 bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded-xl">
          🚫 Version history is not included in the Developer plan.
          <br />
          <a
            href="/upgrade?from=file-portal"
            className="underline mt-2 inline-block text-yellow-200"
          >
            Upgrade your plan to unlock file history, diffs, and restore.
          </a>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // Restore version
  // ----------------------------------------------------
  async function restoreVersion(versionId: string) {
    const confirmRestore = confirm(
      "Are you sure you want to restore this version? This will overwrite the current file."
    );
    if (!confirmRestore) return;

    const res = await fetch("/api/files/restore", {
      method: "POST",
      body: JSON.stringify({
        fileId,
        versionId,
        orgId,
        plan,
      }),
    });

    const json = await res.json();

    if (json.error) {
      alert("Restore failed: " + json.error);
    } else {
      alert("Version restored successfully!");
      window.location.reload();
    }
  }

  // ----------------------------------------------------
  // UI Rendering
  // ----------------------------------------------------
  return (
    <main className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-8">Version History</h1>

      {loading && <div className="text-gray-400">Loading…</div>}
      {error && <div className="text-red-400">{error}</div>}

      <div className="flex flex-col gap-6">
        {versions.length === 0 && !loading && (
          <div className="text-gray-500">No previous versions exist.</div>
        )}

        {versions.map((v) => (
          <div
            key={v.id}
            className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Version from {new Date(v.created_at).toLocaleString()}
                </h2>
                <p className="text-gray-400 text-sm">
                  Edited by{" "}
                  {v.last_modified_by ? v.last_modified_by : "Unknown"}
                </p>
              </div>

              <button
                onClick={() => restoreVersion(v.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Restore
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-gray-300">Changes</h3>
              <pre className="bg-black/40 p-4 rounded-lg text-sm border border-neutral-800 whitespace-pre-wrap">
                {v.change_summary || "No change summary provided."}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-gray-300">Previous</h3>
                <pre className="bg-black/40 p-4 rounded-lg text-xs border border-neutral-800 overflow-auto max-h-64">
                  {v.previous_content}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-gray-300">New</h3>
                <pre className="bg-black/40 p-4 rounded-lg text-xs border border-neutral-800 overflow-auto max-h-64">
                  {v.new_content}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
