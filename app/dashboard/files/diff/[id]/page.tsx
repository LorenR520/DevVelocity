"use client";

import { useEffect, useState } from "react";
import DiffViewer from "@/components/DiffViewer";
import { useSearchParams } from "next/navigation";

export default function DiffPage({ params }: { params: { id: string } }) {
  const fileId = params.id;
  const searchParams = useSearchParams();

  const [plan, setPlan] = useState<string>("developer");
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [versionA, setVersionA] = useState<number | null>(null);
  const [versionB, setVersionB] = useState<number | null>(null);
  const [diff, setDiff] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------
  // Load plan from cookie
  // ------------------------------------------------------------
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((r) => r.startsWith("user_plan="));
    if (cookie) {
      setPlan(cookie.split("=")[1]);
    }
  }, []);

  // ------------------------------------------------------------
  // Load versions for this file
  // ------------------------------------------------------------
  useEffect(() => {
    async function loadVersions() {
      try {
        const orgId = localStorage.getItem("devvelocity_org");

        const res = await fetch("/api/files/version-list", {
          method: "POST",
          body: JSON.stringify({ fileId, orgId, plan }),
        });

        const json = await res.json();

        if (json.error) {
          setError(json.error);
          setLoading(false);
          return;
        }

        setVersions(json.versions || []);

        // Default behavior: compare last two
        if (json.versions.length >= 2) {
          setVersionA(json.versions.length - 2);
          setVersionB(json.versions.length - 1);
        } else if (json.versions.length === 1) {
          setVersionA(0);
          setVersionB(0);
        }

        setLoading(false);
      } catch (err: any) {
        setError("Failed to load version history.");
        setLoading(false);
      }
    }

    loadVersions();
  }, [fileId, plan]);

  // ------------------------------------------------------------
  // Compare selected versions
  // ------------------------------------------------------------
  const runComparison = async () => {
    setError(null);
    setDiff(null);

    try {
      const orgId = localStorage.getItem("devvelocity_org");

      const res = await fetch("/api/files/diff", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          versionA,
          versionB,
          plan,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Unable to generate diff.");
        return;
      }

      setDiff(json.diff);
    } catch (err: any) {
      setError("Diff generation failed.");
    }
  };

  // ------------------------------------------------------------
  // Loading screen
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="text-gray-300 text-lg animate-pulse">
        Loading versions…
      </div>
    );
  }

  // ------------------------------------------------------------
  // Developer tier block
  // ------------------------------------------------------------
  if (plan === "developer") {
    return (
      <div className="p-6 bg-neutral-900 border border-neutral-800 text-red-400 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Upgrade Required</h2>
        <p className="text-gray-300">
          Diff Viewer is available for Startup, Team, and Enterprise plans.
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Main UI
  // ------------------------------------------------------------
  return (
    <div className="text-white max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">File Version Diff</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-300 rounded">
          {error}
        </div>
      )}

      {/* --------------------------------------------------------
          Version Selection Controls
      -------------------------------------------------------- */}
      <div className="flex gap-6 mb-6">

        {/* Version A */}
        <div className="flex flex-col">
          <span className="mb-1 text-sm text-gray-400">Version A</span>
          <select
            value={versionA ?? ""}
            onChange={(e) => setVersionA(Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-700 p-2 rounded"
          >
            {versions.map((v, i) => (
              <option key={v.id} value={i}>
                {i + 1} — {new Date(v.created_at).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Version B */}
        <div className="flex flex-col">
          <span className="mb-1 text-sm text-gray-400">Version B</span>
          <select
            value={versionB ?? ""}
            onChange={(e) => setVersionB(Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-700 p-2 rounded"
          >
            {versions.map((v, i) => (
              <option key={v.id} value={i}>
                {i + 1} — {new Date(v.created_at).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Compare Button */}
        <div className="flex items-end">
          <button
            onClick={runComparison}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
          >
            Compare
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------
          Diff Output
      -------------------------------------------------------- */}
      {diff && (
        <div className="mt-8">
          <DiffViewer diff={diff} />
        </div>
      )}
    </div>
  );
}
