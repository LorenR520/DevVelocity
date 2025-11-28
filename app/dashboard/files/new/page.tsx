"use client";

import { useEffect, useState } from "react";

export default function NewFilePage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cloud-init");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------
  // 🔐 PLAN CHECK — Developer gets upgrade modal
  // ----------------------------------------------------
  useEffect(() => {
    async function loadPlan() {
      const res = await fetch("/api/user/plan");
      const json = await res.json();
      setPlan(json.plan);

      if (json.plan === "developer") {
        setShowUpgradeModal(true);
      }
    }
    loadPlan();
  }, []);

  // Developer tier → Block entire page
  if (plan === "developer") {
    return (
      <>
        <UpgradeModal />
        <main className="max-w-3xl mx-auto px-6 py-16 text-white">
          <h1 className="text-3xl font-bold mb-4">Save File</h1>
          <p className="text-gray-400">
            File saving is only available on the Startup plan and above.
          </p>
        </main>
      </>
    );
  }

  // ----------------------------------------------------
  // Upgrade modal component
  // ----------------------------------------------------
  function UpgradeModal() {
    if (!showUpgradeModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 max-w-md text-white">
          <h2 className="text-2xl font-bold mb-4">Upgrade Required</h2>

          <p className="text-gray-300 mb-6">
            The File Portal is only available on{" "}
            <span className="font-semibold text-blue-400">Startup, Team,</span>{" "}
            and{" "}
            <span className="font-semibold text-blue-400">Enterprise plans</span>.
          </p>

          <a
            href="/dashboard/billing/upgrade"
            className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Upgrade Plan
          </a>

          <button
            onClick={() => setShowUpgradeModal(false)}
            className="mt-4 text-gray-400 hover:text-gray-200 text-sm"
          >
            Continue without access
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 🧾 Save file handler
  // ----------------------------------------------------
  async function saveFile() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/files/save", {
      method: "POST",
      body: JSON.stringify({ name, category, content }),
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();

    if (json.error) {
      setError(json.error);
      setSaving(false);
      return;
    }

    // Redirect back to list
    window.location.href = "/dashboard/files";
  }

  // ----------------------------------------------------
  // Render main page UI
  // ----------------------------------------------------
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Save File</h1>

      {/* Upgrade modal if needed */}
      <UpgradeModal />

      <div className="space-y-6 bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        {/* Name */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            File Name
          </label>
          <input
            type="text"
            className="bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-lg w-full text-white"
            placeholder="ex: my-cloud-init.yaml"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Category
          </label>
          <select
            className="bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-lg w-full text-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="cloud-init">Cloud Init</option>
            <option value="docker">Docker</option>
            <option value="pipeline">Pipeline</option>
            <option value="automation">Automation</option>
            <option value="config">Configuration</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            File Content
          </label>
          <textarea
            className="bg-neutral-950 border border-neutral-800 px-4 py-3 rounded-lg w-full h-64 text-white font-mono"
            placeholder="Paste your cloud-init, docker-compose, or pipeline code here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-sm">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          disabled={saving}
          onClick={saveFile}
          className="py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          {saving ? "Saving..." : "Save File"}
        </button>
      </div>
    </main>
  );
}
