"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function FileVersionsPage() {
  const params = useParams();
  const fileId = params.id as string;

  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, []);

  async function loadVersions() {
    try {
      const res = await fetch(`/api/files/version-history?id=${fileId}`);
      const json = await res.json();

      if (json.error) setError(json.error);
      else setVersions(json.versions);

      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function restoreVersion(versionId: string) {
    setRestoring(versionId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/files/restore-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setSuccess("Version restored successfully.");
      }
    } catch (err: any) {
      setError(err.message);
    }

    setRestoring(null);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-6">File Version History</h1>

      <Link
        href={`/dashboard/files/${fileId}`}
        className="text-blue-400 underline mb-6 inline-block"
      >
        ← Back to File
      </Link>

      {error && <p className="text-red-400 mb-6">{error}</p>}
      {success && <p className="text-green-400 mb-6">{success}</p>}

      {loading ? (
        <p className="text-gray-400">Loading versions...</p>
      ) : versions.length === 0 ? (
        <p className="text-gray-400">No version history yet.</p>
      ) : (
        <div className="space-y-6">
          {versions.map((v) => (
            <div
              key={v.id}
              className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">Version {v.version_number}</p>
                  <p className="text-gray-400 text-sm">
                    Saved: {new Date(v.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => restoreVersion(v.id)}
                  disabled={restoring === v.id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                >
                  {restoring === v.id ? "Restoring..." : "Restore"}
                </button>
              </div>

              {/* Auto-warning for outdated builds */}
              <p className="text-yellow-400 text-xs mt-3 italic">
                This version may be outdated — consider upgrading via AI Builder.
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
