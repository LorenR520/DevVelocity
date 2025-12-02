"use client";

import { useState } from "react";

/**
 * DiffViewer Component
 * -----------------------------------------
 * Accepts a diff array:
 * [
 *   { text: "...", added: true },
 *   { text: "...", removed: true },
 *   { text: "...", added: false, removed: false }
 * ]
 *
 * Displays:
 *   - Green background for additions
 *   - Red background for deletions
 *   - Neutral for unchanged
 */

export default function DiffViewer({
  diff,
}: {
  diff: { text: string; added?: boolean; removed?: boolean }[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mt-10 bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">File Differences</h2>

        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <div className="rounded-lg overflow-hidden text-sm font-mono bg-black/40 border border-neutral-800 max-h-[600px] overflow-y-auto">
          {diff.map((part, index) => {
            const bgColor = part.added
              ? "bg-green-800/40 border-l-4 border-green-500"
              : part.removed
              ? "bg-red-800/40 border-l-4 border-red-500"
              : "bg-neutral-900/30 border-l-4 border-neutral-700";

            const prefix = part.added ? "+" : part.removed ? "-" : " ";

            return (
              <div
                key={index}
                className={`${bgColor} px-4 py-1 whitespace-pre-wrap`}
              >
                <span className="opacity-80 mr-2">{prefix}</span>
                {part.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
