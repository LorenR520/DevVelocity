"use client";

import { useState } from "react";

interface DiffBlock {
  type: "added" | "removed" | "unchanged";
  value: string;
  count: number;
}

export default function DiffViewer({
  oldContent,
  newContent,
}: {
  oldContent: string;
  newContent: string;
}) {
  const [diff, setDiff] = useState<DiffBlock[] | null>(null);
  const [loading, setLoading] = useState(false);

  const getDiff = async () => {
    setLoading(true);

    const res = await fetch("/api/files/diff", {
      method: "POST",
      body: JSON.stringify({ oldContent, newContent }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();
    if (json.blocks) {
      setDiff(json.blocks);
    }

    setLoading(false);
  };

  return (
    <div className="mt-10 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Version Differences</h2>

      <p className="text-gray-400 text-sm mb-4">
        Compare current file against a previous version.
      </p>

      {!diff && (
        <button
          onClick={getDiff}
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          {loading ? "Generating Diff…" : "Show Differences"}
        </button>
      )}

      {diff && (
        <div className="mt-6 max-h-[600px] overflow-y-auto border border-neutral-800 rounded-lg bg-black/40 p-4 text-sm leading-relaxed font-mono whitespace-pre-wrap">
          {diff.map((block, i) => {
            const color =
              block.type === "added"
                ? "text-green-400"
                : block.type === "removed"
                ? "text-red-400"
                : "text-gray-300";

            const prefix =
              block.type === "added"
                ? "+ "
                : block.type === "removed"
                ? "- "
                : "  ";

            return (
              <div key={i} className={color}>
                {prefix + block.value}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
