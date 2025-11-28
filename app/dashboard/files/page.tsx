"use client";

import { useEffect, useState } from "react";

export default function FilePortalPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Load all files on mount
  // ---------------------------
  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await fetch("/api/files/list");
        const data = await res.json();
        setFiles(data.files || []);
      } catch (err) {
        console.error("File list error:", err);
      }
      setLoading(false);
    }

    loadFiles();
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">My Saved Builds</h1>

      <div className="mb-8">
        <a
          href="/dashboard/files/new"
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          + New File
        </a>
      </div>

      {loading && (
        <p className="text-gray-400">Loading your saved builds…</p>
      )}

      {!loading && files.length === 0 && (
        <p className="text-gray-400">You don’t have any saved templates yet.</p>
      )}

      <div className="space-y-4 mt-6">
        {files.map((file) => (
          <a
            key={file.id}
            href={`/dashboard/files/${file.id}`}
            className="block bg-neutral-900 border border-neutral-800 p-5 rounded-xl hover:bg-neutral-800 transition"
          >
            <p className="text-lg font-semibold">{file.name}</p>

            <p className="text-gray-400 text-sm mt-1">
              Type: {file.type}
            </p>

            <p className="text-gray-500 text-xs mt-1">
              Saved on {new Date(file.created_at).toLocaleString()}
            </p>
          </a>
        ))}
      </div>
    </main>
  );
}
