// app/dashboard/files/[id]/restore/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function RestoreFilePage({
  params,
}: {
  params: { id: string };
}) {
  const fileId = params.id;
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan") || "developer";

  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------
  // ❌ Developer plan cannot restore versions
  // ---------------------------------------------
  if (plan === "developer") {
    return (
      <div className="text-center p-20 text-red-400 text-lg">
        🚫 File Restore requires an upgraded plan.
      </div>
    );
  }

  // ---------------------------------------------
  // Load file + all version history
  // ---------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/files/version-list", {
          method: "POST",
          body: JSON.stringify({ fileId }),
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (json.error) {
          setError(json.error);
        } else {
          setFile(json.file);
          setVersions(json.versions ?? []);
        }
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    load();
  }, [fileId]);

  // ---------------------------------------------
  // Restore File API call
  // ---------------------------------------------
  async function handleRestore() {
    if (!selectedVersion) {
      setError("Select a version to restore.");
      return;
    }

    setRestoring(true);
    setRestoreMessage(null);

    try {
      const res = await fetch("/api/files/restore-version", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          versionId: selectedVersion,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setRestoreMessage("Version restored successfully!");
      }
    } catch (err: any) {
      setError(err.message);
    }

    setRestoring(false);
  }

  // ---------------------------------------------
  // UI Rendering
  // ---------------------------------------------
  if (loading) {
    return (
      <div className="text-center p-20 text-blue-400 animate-pulse text-lg">
        Loading version history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-20 text-red-400 text-lg">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-12 text-white">
      <h1 className="text-3xl font-bold mb-8">Restore Version</h1>

      {/* File metadata */}
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-10">
        <h2 className="text-xl font-semibold">{file?.filename}</h2>
        <p className="text-gray-400 text-sm">
          Select a version below to restore as the latest version.
        </p>
      </div>

      {/* Version List */}
      <div className="space-y-4">
        {versions.length === 0 && (
          <p className="text-gray-400">This file has no previous versions.</p>
        )}

        {versions.map((v) => (
          <label
            key={v.id}
            className="block p-4 rounded-lg bg-neutral-900 border hover:border-blue-600 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Version {v.id}</p>
                <p className="text-sm text-gray-400">
                  {new Date(v.created_at).toLocaleString()}
                </p>
              </div>

              <input
                type="radio"
                name="restore-version"
                value={v.id}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
                className="accent-blue-600"
              />
            </div>

            {v.change_summary && (
              <p className="mt-2 text-xs text-gray-500">
                {v.change_summary}
              </p>
            )}
          </label>
        ))}
      </div>

      {/* Restore Button */}
      <button
        onClick={handleRestore}
        disabled={restoring || !selectedVersion}
        className="mt-10 py-3 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-40"
      >
        {restoring ? "Restoring..." : "Restore Selected Version"}
      </button>

      {/* Success Message */}
      {restoreMessage && (
        <p className="mt-6 text-green-400 text-sm">{restoreMessage}</p>
      )}
    </main>
  );
}
