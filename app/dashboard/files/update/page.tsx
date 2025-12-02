"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function UpdateFilePage() {
  const params = useSearchParams();
  const fileId = params.get("id");

  const [plan, setPlan] = useState("developer");
  const [orgId, setOrgId] = useState<string | null>(null);

  const [file, setFile] = useState<any>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------
  // Load plan + org ID
  // ------------------------------------------------
  useEffect(() => {
    const planCookie = document.cookie
      .split("; ")
      .find((x) => x.startsWith("user_plan="));
    const planValue = planCookie ? planCookie.split("=")[1] : "developer";
    setPlan(planValue);

    const orgCookie = document.cookie
      .split("; ")
      .find((x) => x.startsWith("org_id="));
    const orgValue = orgCookie ? orgCookie.split("=")[1] : null;
    setOrgId(orgValue);
  }, []);

  // ------------------------------------------------
  // Load file
  // ------------------------------------------------
  useEffect(() => {
    async function load() {
      if (!fileId || !orgId) return;

      try {
        const res = await fetch("/api/files/get", {
          method: "POST",
          body: JSON.stringify({ fileId, orgId }),
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setFile(json.file);
          setContent(json.file?.content ?? "");
        }
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    if (orgId) load();
  }, [fileId, orgId]);

  // ------------------------------------------------
  // Developer tier restriction
  // ------------------------------------------------
  if (plan === "developer") {
    return (
      <main className="p-10 text-white">
        <h1 className="text-3xl font-bold mb-4">Update File</h1>

        <div className="p-6 mt-4 bg-yellow-900/40 border border-yellow-700 rounded-xl text-yellow-300">
          🚫 File Portal is unavailable on the Developer plan.
          <br />
          <a
            href="/upgrade?from=file-portal"
            className="underline mt-2 inline-block"
          >
            Upgrade now to unlock file editing + version history.
          </a>
        </div>
      </main>
    );
  }

  // ------------------------------------------------
  // Save Edited File
  // ------------------------------------------------
  const saveFile = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/files/update", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          orgId,
          newContent: content,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        alert("File saved successfully!");
      }
    } catch (err: any) {
      setError(err.message);
    }

    setSaving(false);
  };

  // ------------------------------------------------
  // Run AI Upgrade
  // ------------------------------------------------
  const runUpgrade = async () => {
    setUpgrading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai-builder/upgrade-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          existingConfig: content,
        }),
      });

      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setContent(JSON.stringify(json.output.updated_config, null, 2));
        alert("AI Upgrade Complete! New version applied.");
      }
    } catch (err: any) {
      setError(err.message);
    }

    setUpgrading(false);
  };

  // ------------------------------------------------
  // UI: Loading
  // ------------------------------------------------
  if (loading) {
    return (
      <main className="p-10 text-gray-400 animate-pulse">Loading file…</main>
    );
  }

  // ------------------------------------------------
  // UI: Error
  // ------------------------------------------------
  if (error) {
    return (
      <main className="p-10 text-red-400">
        Error loading file: {error}
      </main>
    );
  }

  // ------------------------------------------------
  // UI: No file found
  // ------------------------------------------------
  if (!file) {
    return (
      <main className="p-10 text-gray-400">File not found.</main>
    );
  }

  // ------------------------------------------------
  // MAIN UI
  // ------------------------------------------------
  return (
    <main className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Update File: {file.filename}
      </h1>

      {/* Outdated Warning */}
      <div className="p-4 mb-6 bg-yellow-900/40 border border-yellow-700 rounded-lg text-yellow-300">
        ⚠️ This file may be outdated compared to the latest DevVelocity templates.
        <button
          onClick={runUpgrade}
          disabled={upgrading}
          className="ml-4 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
        >
          {upgrading ? "Upgrading…" : "Run AI Upgrade"}
        </button>
      </div>

      {/* JSON Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-96 bg-black/40 p-4 rounded-lg border border-neutral-800 text-sm font-mono text-white"
      />

      {/* Preview */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Preview</h2>
        <SyntaxHighlighter
          language="json"
          style={tomorrow}
          wrapLongLines
          customStyle={{
            background: "rgba(0,0,0,0.4)",
            padding: "16px",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>

      {/* Save Button */}
      <button
        onClick={saveFile}
        disabled={saving}
        className="mt-8 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
      >
        {saving ? "Saving…" : "Save File"}
      </button>
    </main>
  );
}
