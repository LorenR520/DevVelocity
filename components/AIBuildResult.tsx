"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

// Sections that the AI builder returns
const SECTIONS = [
  "summary",
  "architecture",
  "cloud_init",
  "docker_compose",
  "pipelines",
  "maintenance_plan",
  "sso_recommendations",
  "security_model",
  "budget_projection",
  "upgrade_paths",
  "next_steps",
];

export default function AIBuildResult({ result }: { result: any }) {
  const [copied, setCopied] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fullContent = JSON.stringify(result, null, 2);

  // ------------------------------------------------------
  // 📋 Copy full JSON
  // ------------------------------------------------------
  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // ------------------------------------------------------
  // 🔄 Upgrade file using AI
  // ------------------------------------------------------
  const handleUpgrade = async () => {
    setUpgradeOpen(true);

    const res = await fetch("/api/ai-builder/upgrade-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldContent: fullContent }),
    });

    const json = await res.json();

    if (json.upgraded) {
      window.localStorage.setItem("devvelocity-upgraded-file", json.upgraded);
      alert("Your file has been upgraded and saved!");
    }

    setUpgradeOpen(false);
  };

  return (
    <div className="mt-12 p-6 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
      <h2 className="text-3xl font-bold mb-6">AI-Generated Infrastructure Plan</h2>

      {/* Outdated Warning */}
      <div className="p-4 mb-6 rounded-lg bg-yellow-900/40 border border-yellow-700 text-yellow-300">
        ⚠️ This generated plan may become outdated when DevVelocity AI templates evolve.
        <button
          onClick={handleUpgrade}
          className="ml-4 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium"
        >
          Update via AI
        </button>
      </div>

      {/* Copy entire JSON */}
      <button
        onClick={handleCopy}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
      >
        {copied ? "Copied!" : "Copy Full JSON"}
      </button>

      {/* Upgrade Spinner */}
      {upgradeOpen && (
        <div className="text-blue-400 text-sm mb-6 animate-pulse">
          Upgrading your file with DevVelocity AI…
        </div>
      )}

      {/* EXPANDABLE OUTPUT SECTIONS */}
      <div className="space-y-4">
        {SECTIONS.map((key) => {
          if (!result[key]) return null;

          const value =
            typeof result[key] === "object"
              ? JSON.stringify(result[key], null, 2)
              : String(result[key]);

          return (
            <div
              key={key}
              className="border border-neutral-800 rounded-xl bg-neutral-950"
            >
              {/* Header */}
              <button
                onClick={() => toggle(key)}
                className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-neutral-900"
              >
                <span className="capitalize font-semibold">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-blue-400 text-xs">
                  {expanded[key] ? "Hide" : "Show"}
                </span>
              </button>

              {/* Body */}
              {expanded[key] && (
                <div className="p-4">
                  <SyntaxHighlighter
                    language="json"
                    style={oneDark}
                    wrapLines
                    wrapLongLines
                    customStyle={{
                      background: "transparent",
                      fontSize: "13px",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    {value}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
