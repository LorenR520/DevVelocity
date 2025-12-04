"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Lazy-load diff viewer for faster dashboard performance
const DiffViewer = dynamic(() => import("react-diff-viewer-continued"), {
  ssr: false,
});

export default function FileDiffViewer({
  oldContent,
  newContent,
  oldLabel = "Old Version",
  newLabel = "New Version",
  plan,
}: {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
  plan: string;
}) {
  const [splitView, setSplitView] = useState(true);

  const isLocked = plan === "developer";

  return (
    <div className="mt-10 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl text-white">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Version Comparison</h2>

        <button
          onClick={() => setSplitView(!splitView)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
        >
          {splitView ? "Unified View" : "Split View"}
        </button>
      </div>

      {/* Tier Restriction Notice */}
      {isLocked && (
        <div className="mb-4 p-4 bg-red-900/40 border border-red-600 rounded-xl text-red-300">
          <p className="font-semibold">
            ⚠️ File Comparison is limited on the Developer tier.
          </p>
          <p className="text-sm mt-1">
            Upgrade to access full diffing, version analysis, and AI
            recommendations.
          </p>
          <a
            href="/dashboard/billing"
            className="underline text-red-200 mt-2 inline-block"
          >
            Upgrade Plan →
          </a>
        </div>
      )}

      {/* Diff Viewer */}
      <div className={`${isLocked ? "pointer-events-none opacity-40" : ""}`}>
        <DiffViewer
          oldValue={oldContent}
          newValue={newContent}
          splitView={splitView}
          leftTitle={oldLabel}
          rightTitle={newLabel}
          useDarkTheme={true}
          showDiffOnly={false}
          styles={{
            variables: {
              light: {
                diffViewerBackground: "#111",
                diffViewerColor: "#fff",
              },
              dark: {
                diffViewerBackground: "#111",
                diffViewerColor: "#fff",
              },
            },
          }}
        />
      </div>

      {/* Recommended: AI Builder Rebuild */}
      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
        <p className="font-semibold">🔄 Recommendation</p>
        <p className="text-sm text-blue-200 mt-1">
          If this comparison reveals drift or outdated configuration,
          run your file through AI Builder to modernize it, patch new cloud standards,
          and remove technical debt.
        </p>

        <a
          href="/dashboard/ai-builder"
          className="inline-block mt-3 text-blue-300 underline"
        >
          Open AI Builder →
        </a>
      </div>
    </div>
  );
}
