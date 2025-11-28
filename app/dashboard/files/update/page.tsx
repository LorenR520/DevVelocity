"use client";

import { useState } from "react";
import AIBuildResult from "@/components/AIBuildResult";

export default function UpdateSavedFilePage() {
  const [plan, setPlan] = useState("developer");
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai-builder/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pastedFile: pasted,
          plan,
        }),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setResult(json.output);
        window.scrollTo({ top: 99999, behavior: "smooth" });
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-6">Update Existing AI Build</h1>

      <p className="text-gray-400 mb-8">
        Paste your old DevVelocity AI output below. We’ll automatically detect
        missing sections, modernize your architecture, enforce plan limits, apply
        upgrades, and generate a fully updated build.
      </p>

      {/* ---- Plan Selector ---- */}
      <div className="mb-8">
        <label className="block text-gray-300 mb-2 font-medium">
          Your Current Plan
        </label>

        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg text-white"
        >
          <option value="developer">Developer</option>
          <option value="startup">Startup</option>
          <option value="team">Team</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <p className="text-sm text-gray-500 mt-2">
          Tier limits affect modernization, automation, and provider options.
        </p>
      </div>

      {/* ---- Paste Box ---- */}
      <div className="mb-8">
        <label className="block text-gray-300 mb-2 font-medium">
          Paste Old Build JSON
        </label>

        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          className="w-full h-72 bg-neutral-900 border border-neutral-800 rounded-lg p-4 font-mono text-sm text-gray-200"
          placeholder="Paste your previous AI build JSON here..."
        />
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="py-3 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        {loading ? "Updating Build…" : "Update Build"}
      </button>

      {/* ---- Error ---- */}
      {error && (
        <p className="mt-6 text-red-400 text-sm">{error}</p>
      )}

      {/* ---- Updated Output ---- */}
      {result && (
        <div className="mt-10">
          <AIBuildResult result={result} />
        </div>
      )}
    </main>
  );
}
