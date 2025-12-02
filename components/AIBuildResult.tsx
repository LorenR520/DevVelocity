"use client";

import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function AIBuildResult({ result }: { result: any }) {
  const [copied, setCopied] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const content = JSON.stringify(result, null, 2);

  // -------------------------------------------
  // 📋 Copy to clipboard
  // -------------------------------------------
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // -------------------------------------------
  // 🔄 Send file to Upgrade API
  // -------------------------------------------
  const handleUpgrade = async () => {
    setUpgradeOpen(true);

    const res = await fetch("/api/ai-builder/upgrade-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldContent: content }),
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
        ⚠️ This file may become outdated when DevVelocity updates templates.
        <button
          onClick={handleUpgrade}
          className="ml-4 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium"
        >
          Update via AI
        </button>
      </div>

      <div className="relative">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs z-10"
        >
          {copied ? "Copied!" : "Copy"}
        </button>

        {/* AI Output */}
        <SyntaxHighlighter
          language="json"
          style={tomorrow}
          wrapLines={true}
          wrapLongLines={true}
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

      {/* Upgrade Spinner */}
      {upgradeOpen && (
        <div className="mt-6 text-blue-400 text-sm animate-pulse">
          Upgrading your file with DevVelocity AI…
        </div>
      )}
    </div>
  );
}
