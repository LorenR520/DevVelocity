"use client";

import { useState } from "react";

export interface DiffEntry {
  type: "added" | "removed" | "unchanged";
  value: string;
}

export default function DiffViewer({ diff }: { diff: DiffEntry[] }) {
  const [showUnchanged, setShowUnchanged] = useState(false);

  const getLineClass = (type: string) => {
    switch (type) {
      case "added":
        return "bg-green-900/40 text-green-300 border-l-4 border-green-500";
      case "removed":
        return "bg-red-900/40 text-red-300 border-l-4 border-red-500";
      default:
        return "bg-neutral-800/40 text-neutral-400 border-l-4 border-neutral-700";
    }
  };

  const copyDiff = async () => {
    const formatted = diff
      .map((d) => {
        if (d.type === "added") return "+ " + d.value;
        if (d.type === "removed") return "- " + d.value;
        return "  " + d.value;
      })
      .join("");

    await navigator.clipboard.writeText(formatted);
    alert("Diff copied to clipboard!");
  };

  return (
    <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">File Version Diff</h2>

        <button
          onClick={copyDiff}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Copy Diff
        </button>
      </div>

      <div className="space-y-1 text-sm font-mono leading-relaxed">
        {diff.map((entry, idx) => {
          if (entry.type === "unchanged" && !showUnchanged) return null;

          return (
            <pre
              key={idx}
              className={`whitespace-pre-wrap px-3 py-1 rounded ${getLineClass(
                entry.type
              )}`}
            >
              {entry.type === "added"
                ? "+ "
                : entry.type === "removed"
                ? "- "
                : "  "}
              {entry.value}
            </pre>
          );
        })}
      </div>

      {/* Toggle unchanged lines */}
      <button
        onClick={() => setShowUnchanged(!showUnchanged)}
        className="mt-4 text-blue-400 text-sm hover:underline"
      >
        {showUnchanged ? "Hide unchanged lines" : "Show unchanged lines"}
      </button>
    </div>
  );
}
