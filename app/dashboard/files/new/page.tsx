"use client";

import { useEffect, useState } from "react";

export default function NewFilePage() {
  const [plan, setPlan] = useState("developer");
  const [orgId, setOrgId] = useState<string | null>(null);

  const [filename, setFilename] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("{\n  \n}");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------
  // Load plan + org from browser cookies
  // -------------------------------------------------
  useEffect(() => {
    const planCookie = document.cookie
      .split("; ")
      .find((x) => x.startsWith("user_plan="));
    const planValue = planCookie ? planCookie.split("=")[1] : "developer";
    setPlan(planValue);

    const orgCookie = document.cookie
      .split("; ")
      .find((x) => x.startsWith("org_id="));
    setOrgId(orgCookie ? orgCookie.split("=")[1] : null);
  }, []);

  // -------------------------------------------------
  // Restrict Developer tier
  // -------------------------------------------------
  if (plan === "developer") {
    return (
      <main className="p-10 text-white">
        <h1 className="text-3xl font-bold mb-4">Create New File</h1>

        <div className="p-6 bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded-xl">
          🚫 File Portal is not available on the Developer plan.
          <br />
          <a
            href="/upgrade?from=file-portal"
            className="underline mt-2 inline-block text-yellow-200"
          >
            Upgrade to unlock file creation, editing, and version history.
          </a>
        </div>
      </main>
    );
  }

  // -------------------------------------------------
  // Create file
  // -------------------------------------------------
  const submit = async () => {
    setError(null);

    if (!filename.trim()) {
      setError("Filename is required.");
      return;
    }

    if (!orgId) {
      setError("Missing organization ID.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          filename,
          description,
          content,
        }),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        alert("File created successfully!");
        window.location.href = "/dashboard/files";
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  // -------------------------------------------------
  // UI: Form
  // -------------------------------------------------
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Create New File</h1>

      {/* Filename */}
      <div className="mb-6">
        <label className="block mb-2 text-gray-300 font-medium">
          Filename
        </label>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="example.json"
          className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg w-full"
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block mb-2 text-gray-300 font-medium">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this file contains"
          className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg w-full"
        />
      </div>

      {/* JSON Content Editor */}
      <div className="mb-8">
        <label className="block mb-2 text-gray-300 font-medium">
          Initial Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-80 bg-black/40 border border-neutral-800 p-4 rounded-lg font-mono text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {/* Submit */}
      <button
        disabled={loading}
        onClick={submit}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        {loading ? "Creating…" : "Create File"}
      </button>
    </main>
  );
}
