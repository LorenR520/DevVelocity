"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FileRestoreBanner({
  fileName,
  restoredVersion,
  plan,
}: {
  fileName: string;
  restoredVersion: any;
  plan: string;
}) {
  const router = useRouter();

  // Auto-hide after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.refresh();
    }, 7000);

    return () => clearTimeout(timer);
  }, [router]);

  // Upgrade suggestion
  const tierLocked = plan === "developer";

  return (
    <div className="mt-6 border border-green-600 bg-green-900/30 p-6 rounded-xl text-green-200">
      {/* Success Title */}
      <h2 className="text-xl font-bold mb-2">
        ✅ File Restored Successfully
      </h2>

      {/* File restored */}
      <p className="mb-2">
        <span className="font-semibold">{fileName}</span> has been restored
        to version <span className="font-semibold">#{restoredVersion.version_number}</span>.
      </p>

      {/* Version Details */}
      <div className="mt-4 p-4 bg-black/30 rounded-lg border border-green-700">
        <p className="text-sm">
          <strong>Version ID:</strong> {restoredVersion.id}
        </p>
        <p className="text-sm">
          <strong>Created:</strong>{" "}
          {new Date(restoredVersion.created_at).toLocaleString()}
        </p>
        <p className="text-sm">
          <strong>Notes:</strong>{" "}
          {restoredVersion.version_notes || "None"}
        </p>
      </div>

      {/* Developer Plan Restriction */}
      {tierLocked && (
        <div className="mt-4 p-3 bg-red-900/40 border border-red-600 rounded-lg text-red-300">
          <p className="font-semibold">
            ⚠️ This feature is not fully available on the Developer plan.
          </p>
          <p className="text-sm mt-1">
            Access full version history, restore, file comparison, and
            AI-based file upgrades by upgrading your subscription.
          </p>

          <a
            href="/dashboard/billing"
            className="inline-block mt-3 text-red-200 underline"
          >
            Upgrade Plan →
          </a>
        </div>
      )}

      {/* AI Rebuild Suggestion */}
      <div className="mt-4 p-5 bg-blue-900/30 border border-blue-600 rounded-lg text-blue-200">
        <p className="font-semibold mb-1">
          🔄 Recommended: Run this restored file through AI Builder
        </p>
        <p className="text-sm">
          Technologies evolve fast—AI Builder can update this configuration to
          the latest standards and optimize for your cloud provider.
        </p>

        <a
          href="/dashboard/ai-builder"
          className="inline-block mt-3 text-blue-200 underline"
        >
          Open AI Builder →
        </a>
      </div>
    </div>
  );
}
