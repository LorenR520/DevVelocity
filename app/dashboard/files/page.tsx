"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ----------------------------------------
// File Portal Page — With Paste Analyzer (Option C)
// ----------------------------------------
export default function FilePortalPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [plan, setPlan] = useState<string>("developer");
  const [pasteInput, setPasteInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // ----------------------------------------
  // Load user plan + files on mount
  // ----------------------------------------
  useEffect(() => {
    loadPortal();
  }, []);

  async function loadPortal() {
    try {
      setLoading(true);

      const userRes = await fetch("/api/user/me");
      const userJson = await userRes.json();

      setPlan(userJson?.plan ?? "developer");

      if (userJson?.plan === "developer") {
        setFiles([]);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/files/list");
      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setFiles(json.files || []);
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  // ----------------------------------------
  // Download a saved file
  // ----------------------------------------
  async function downloadFile(fileId: string) {
    const res = await fetch("/api/files/download", {
      method: "POST",
      body: JSON.stringify({ file_id: fileId }),
    });

    if (!res.ok) {
      alert("Download failed.");
      return;
    }

    const outdated = res.headers.get("X-DevVelocity-File-Outdated");

    if (outdated === "true") {
      alert(
        "⚠️ This file was generated over 30 days ago.\n\nWe recommend pasting it into the analyzer to refresh and update the build."
      );
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "devvelocity-build.txt";
    a.click();
  }

  // ----------------------------------------
  // Delete a saved file
  // ----------------------------------------
  async function deleteFile(fileId: string) {
    if (!confirm("Delete this file?")) return;

    const res = await fetch("/api/files/delete", {
      method: "POST",
      body: JSON.stringify({ file_id: fileId }),
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      return;
    }

    loadPortal();
  }

  // ----------------------------------------
  // Paste → Analyze → Auto-Upgrade
  // ----------------------------------------
  async function analyzeBuild() {
    if (!pasteInput.trim()) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    const res = await fetch("/api/ai-builder/from-file", {
      method: "POST",
      body: JSON.stringify({
        file_content: pasteInput,
        plan,
      }),
    });

    const json = await res.json();
    setAnalysisResult(json);
    setAnalyzing(false);

    window.scrollTo({ top: 99999, behavior: "smooth" });
  }

  if (plan === "developer") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-white">
        <h1 className="text-3xl font-bold mb-6">File Portal (Locked)</h1>
        <p className="text-gray-400 mb-8">
          Saving infrastructure builds is available on:
        </p>

        <ul className="list-disc ml-6 space-y-2 text-gray-300">
          <li>Startup</li>
          <li>Team</li>
          <li>Enterprise</li>
        </ul>

        <Link
          href="/pricing"
          className="inline-block mt-10 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          Upgrade Plan
        </Link>
      </main>
    );
  }

  // ----------------------------------------
  // MAIN PORTAL UI
  // ----------------------------------------
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-10">Your Saved Builds</h1>

      {/* FILE LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : files.length === 0 ? (
        <p className="text-gray-400">No saved files yet.</p>
      ) : (
        <div className="space-y-6 mb-12">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{file.name}</p>
                <p className="text-gray-400 text-sm">
                  Saved: {new Date(file.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => downloadFile(file.id)}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Download
                </button>

                <button
                  onClick={() => deleteFile(file.id)}
                  className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------- */}
      {/* PASTE + AUTO-UPGRADE ANALYZER */}
      {/* ----------------------------- */}

      <div className="mt-16 p-8 bg-neutral-900 border border-neutral-800 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">
          Paste a Build to Update or Fix It
        </h2>

        <p className="text-gray-400 mb-6">
          If you downloaded a file or have an older DevVelocity build, paste it
          below and the AI will:
        </p>

        <ul className="text-gray-300 list-disc ml-6 mb-6 space-y-2">
          <li>Detect outdated configs</li>
          <li>Recommend upgrades based on your plan</li>
          <li>Auto-refresh scripts (cloud-init, docker, pipelines)</li>
          <li>Fix version mismatches + provider changes</li>
          <li>Enhance automation if your tier allows it</li>
        </ul>

        <textarea
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          placeholder="Paste your exported build.txt here..."
          className="w-full min-h-[180px] p-4 bg-black/40 border border-neutral-700 rounded-lg text-sm text-white"
        />

        <button
          onClick={analyzeBuild}
          disabled={analyzing}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          {analyzing ? "Analyzing..." : "Update This Build"}
        </button>

        {/* AI RESULT */}
        {analysisResult && (
          <pre className="mt-10 whitespace-pre-wrap text-sm p-4 bg-black/40 border border-neutral-700 rounded-lg">
{JSON.stringify(analysisResult, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
