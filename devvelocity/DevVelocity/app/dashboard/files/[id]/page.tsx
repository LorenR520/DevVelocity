"use client";

import { useEffect, useState } from "react";
import FileOutdatedBanner from "@/components/FileOutdatedBanner";

export default function FileViewPage({ params }: { params: { id: string } }) {
  const fileId = params.id;

  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For dynamic updated content from AI regeneration
  const [regeneratedContent, setRegeneratedContent] = useState<any>(null);

  // -------------------------------
  // Load the file data from API
  // -------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/files/${fileId}`);

        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setFile(json.file);
        }
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    load();
  }, [fileId]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16 text-white">
        <p className="text-gray-300">Loading file...</p>
      </main>
    );
  }

  if (error || !file) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16 text-red-400">
        <p>Error: {error ?? "File not found"}</p>
      </main>
    );
  }

  const contentToDisplay = regeneratedContent ?? file.content;

  // Show regenerate banner only for Startup / Team / Enterprise
  const shouldShowBanner =
    file.plan !== "developer" &&
    ["startup", "team", "enterprise"].includes(file.plan);

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 text-white">
      {/* ---------------- HEADER ---------------- */}
      <h1 className="text-3xl font-bold mb-4 break-all">
        {file.filename}
      </h1>

      <div className="text-gray-400 text-sm mb-8">
        Saved on {new Date(file.created_at).toLocaleString()}
        <br />
        Plan at time of save: <span className="text-blue-400">{file.plan}</span>
      </div>

      {/* ---------------- ACTIONS ---------------- */}
      <div className="flex items-center gap-4 mb-10">
        <a
          href={`/api/files/download?id=${fileId}`}
          className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md hover:bg-neutral-700"
        >
          ⬇ Download File
        </a>

        <a
          href="/dashboard/files"
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800"
        >
          ← Back
        </a>
      </div>

      {/* ---------------- OUTDATED BANNER ---------------- */}
      {shouldShowBanner && (
        <FileOutdatedBanner
          fileContent={file.content}
          plan={file.plan}
          onRegenerated={(updated: any) => setRegeneratedContent(updated)}
        />
      )}

      {/* ---------------- FILE CONTENT ---------------- */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
        <pre>{contentToDisplay}</pre>
      </div>
    </main>
  );
}
