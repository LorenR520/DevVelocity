"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/ssr";
import { getPlan } from "@/ai-builder/plan-logic";

export default function UpdateFilePage() {
  const router = useRouter();

  const [oldFile, setOldFile] = useState<string>("");
  const [plan, setPlan] = useState("developer");
  const [orgId, setOrgId] = useState<string>("");
  const [upgraded, setUpgraded] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------
  // Submit → API call → AI Upgrader
  // -----------------------------------------------------
  async function upgradeFile() {
    setLoading(true);
    setError(null);
    setUpgraded(null);

    try {
      const res = await fetch("/api/ai-builder/upgrade-file", {
        method: "POST",
        body: JSON.stringify({
          oldFile: safeParse(oldFile),
          plan,
          org_id: orgId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setUpgraded(json.upgraded);
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  // -----------------------------------------------------
  // Save upgraded JSON → files + version history
  // -----------------------------------------------------
  async function saveFile() {
    if (!upgraded) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Save new version
    const { data, error } = await supabase
      .from("files")
      .insert({
        org_id: orgId,
        filename: upgraded.summary || "Upgraded Architecture File",
        json_content: upgraded,
      })
      .select()
      .single();

    if (error) {
      setError("Error saving file: " + error.message);
      return;
    }

    router.push("/dashboard/files");
  }

  // -----------------------------------------------------
  // Safely parse JSON
  // -----------------------------------------------------
  function safeParse(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Update Architecture File</h1>

      <p className="text-gray-300 mb-6">
        Paste your old architecture file below. DevVelocity AI will analyze it,
        detect outdated patterns, apply the newest best practices, and recommend
        upgrades based on your plan tier.
      </p>

      {/* Plan Selector */}
      <label className="block mb-3 font-medium">Your Plan Tier</label>
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg mb-6"
      >
        <option value="developer">Developer</option>
        <option value="startup">Startup</option>
        <option value="team">Team</option>
        <option value="enterprise">Enterprise</option>
      </select>

      {/* Org ID */}
      <label className="block mb-3 font-medium">Organization ID</label>
      <input
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        placeholder="your org_id"
        className="w-full bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg mb-6"
      />

      {/* Old File Textarea */}
      <label className="block mb-3 font-medium">Paste Old File JSON</label>
      <textarea
        value={oldFile}
        onChange={(e) => setOldFile(e.target.value)}
        rows={14}
        placeholder="Paste JSON here..."
        className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-lg font-mono text-sm"
      />

      {/* Upgrade Button */}
      <button
        onClick={upgradeFile}
        disabled={loading}
        className="mt-6 py-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        {loading ? "Upgrading..." : "Upgrade Architecture"}
      </button>

      {/* Error */}
      {error && <p className="mt-4 text-red-400">{error}</p>}

      {/* AI Result */}
      {upgraded && (
        <div className="mt-12 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Upgraded File</h2>

          <pre className="bg-black/40 p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(upgraded, null, 2)}
          </pre>

          <button
            onClick={saveFile}
            className="mt-6 py-2 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            Save Updated File
          </button>
        </div>
      )}
    </main>
  );
}
