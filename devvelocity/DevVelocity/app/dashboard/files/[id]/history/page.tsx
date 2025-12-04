"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { hasFeature } from "@/ai-builder/plan-logic";
import Link from "next/link";

export default function FileHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.id;

  const [history, setHistory] = useState<any[]>([]);
  const [fileMeta, setFileMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("developer"); // will update later via auth

  const allowAdvanced = hasFeature(plan, "file_portal");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/files/history?id=${fileId}`);
      const data = await res.json();

      setHistory(data.history || []);
      setFileMeta(data.file || null);
      setLoading(false);
    }
    load();
  }, [fileId]);

  async function restore(versionId: string) {
    if (!allowAdvanced) {
      router.push("/dashboard/billing/upgrade");
      return;
    }

    const res = await fetch("/api/files/restore", {
      method: "POST",
      body: JSON.stringify({
        version_id: versionId,
        file_id: fileId,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();
    if (json.error) {
      alert("Error: " + json.error);
    } else {
      alert("Version restored successfully!");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-20">Loading version history...</div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 text-white">

      {/* Back Link */}
      <Link
        href="/dashboard/files"
        className="text-blue-400 underline text-sm mb-6 inline-block"
      >
        ← Back to Files
      </Link>

      <h1 className="text-3xl font-bold mb-6">Version History</h1>

      {/* File Metadata */}
      {fileMeta && (
        <div className="mb-10 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <h2 className="text-xl font-semibold">{fileMeta.filename}</h2>
          <p className="text-gray-400 text-sm mt-1">
            Created: {new Date(fileMeta.created_at).toLocaleString()}
          </p>
          <p className="text-gray-400 text-sm">
            Last Updated: {new Date(fileMeta.updated_at).toLocaleString()}
          </p>
        </div>
      )}

      {/* Version List */}
      <div className="space-y-6">
        {history.length === 0 && (
          <p className="text-gray-500">No version history available.</p>
        )}

        {history.map((v) => (
          <div
            key={v.id}
            className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  Version {v.version_number}
                </h3>
                <p className="text-gray-400 text-sm">
                  Saved: {new Date(v.created_at).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => restore(v.id)}
                className={`px-4 py-2 rounded-lg ${
                  allowAdvanced
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-neutral-700 cursor-pointer"
                }`}
              >
                Restore
              </button>
            </div>

            {/* Simple DIFF Preview */}
            <pre className="mt-4 whitespace-pre-wrap text-xs bg-black/40 p-4 rounded-lg overflow-x-auto">
              {v.diff_preview || v.content.substring(0, 500) + "…"}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
