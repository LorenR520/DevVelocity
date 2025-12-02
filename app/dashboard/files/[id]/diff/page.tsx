// app/dashboard/files/[id]/diff/page.tsx

"use client";

import { useEffect, useState } from "react";
import DiffViewer from "@/components/DiffViewer";
import { useSearchParams } from "next/navigation";

export default function FileDiffPage({
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
  const [leftVersion, setLeftVersion] = useState<number | null>(null);
  const [rightVersion, setRightVersion] = useState<number | null>(null);
  const [diff, setDiff] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------
  // BLOCK DEVELOPER PLAN
  // -------------------------------
  if (plan === "developer") {
    return (
      <div className="text-center p-20 text-red-400 text-lg">
        🚫 File Portal Diff Tools require an upgraded plan.
      </div>
    );
  }

  // ---------------------------------------------------------
  // Load file + version history
  // ---------------------------------------------------------
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
          setVersions(json.versions || []);

          if (json.versions.length >= 2) {
            setLeftVersion(json.versions[json.versions.length - 2].id);
            setRightVersion(json.versions[json.versions.length - 1].id);
          }
        }
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    load();
  }, [fileId]);

  // ---------------------------------------------------------
  // When both versions selected → compute diff
  // ---------------------------------------------------------
  useEffect(() => {
    async function generateDiff() {
      if (!leftVersion || !rightVersion) return;

      const res = await fetch("/api/files/diff", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          leftVersion,
          rightVersion,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setDiff(json.diff || []);
      }
    }

    generateDiff();
  }, [leftVersion, rightVersion, fileId]);

  // ---------------------------------------------------------
  // UI Rendering
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="text-center p-20 text-blue-400 animate-pulse text-lg">
        Loading file versions…
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
    <main className="max-w-5xl mx-auto py-12 text-white">
      <h1 className="text-3xl font-bold mb-8">Compare Versions</h1>

      {/* File metadata */}
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <h2 className="text-xl font-semibold">{file?.filename}</h2>
        <p className="text-gray-400 text-sm">
          {versions.length} versions • Last updated{" "}
          {new Date(file?.updated_at).toLocaleString()}
        </p>
      </div>

      {/* Dropdown selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* LEFT VERSION */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Old Version
          </label>

          <select
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2"
            value={leftVersion || ""}
            onChange={(e) => setLeftVersion(Number(e.target.value))}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.id} — {new Date(v.created_at).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* RIGHT VERSION */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            New Version
          </label>

          <select
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2"
            value={rightVersion || ""}
            onChange={(e) => setRightVersion(Number(e.target.value))}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.id} — {new Date(v.created_at).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Diff Viewer */}
      {diff.length > 0 ? (
        <DiffViewer diff={diff} />
      ) : (
        <div className="text-gray-400 text-sm text-center py-10">
          Select two versions to compare.
        </div>
      )}
    </main>
  );
}
