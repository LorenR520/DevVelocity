"use client";

import { useState } from "react";

export default function FileOutdatedBanner({
  fileContent,
  plan,
  onRegenerated,
}: {
  fileContent: string;
  plan: string;
  onRegenerated?: (result: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    setLoading(true);
    setUpdated(null);
    setError(null);

    try {
      const res = await fetch("/api/ai-builder/upgrade-file", {
        method: "POST",
        body: JSON.stringify({
          fileContent,
          plan,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setLoading(false);
        return;
      }

      setUpdated(json.output);

      if (onRegenerated) {
        onRegenerated(json.output);
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="bg-yellow-600/10 border border-yellow-600 rounded-lg p-4 mb-6 text-yellow-300">
      <p className="font-semibold mb-2">
        ⚠️ This file may be outdated.
      </p>
      <p className="text-sm mb-4 text-yellow-200">
        DevVelocity improves constantly. You can regenerate this file using the latest templates,
        security best practices, and plan-based capabilities.
      </p>

      <button
        onClick={regenerate}
        disabled={loading}
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 font-semibold rounded-md text-black"
      >
        {loading ? "Updating…" : "Regenerate with AI"}
      </button>

      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}

      {updated && (
        <div className="mt-6 p-4 bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto text-white">
          <h3 className="text-xl font-bold mb-3">Updated Build</h3>
          <pre className="whitespace-pre-wrap text-sm">
{JSON.stringify(updated, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
