"use client";

import { useState } from "react";

const SECTIONS = [
  { key: "summary", label: "Summary" },
  { key: "architecture", label: "Architecture" },
  { key: "cloud_init", label: "Cloud Init" },
  { key: "docker_compose", label: "Docker Compose" },
  { key: "pipelines", label: "Pipelines" },
  { key: "maintenance_plan", label: "Maintenance" },
  { key: "sso_recommendations", label: "SSO" },
  { key: "security_model", label: "Security" },
  { key: "budget_projection", label: "Budget" },
  { key: "upgrade_paths", label: "Upgrade" },
  { key: "next_steps", label: "Next Steps" }
];

export default function AIBuildResult({ result }: { result: any }) {
  const [tab, setTab] = useState("summary");

  if (!result) return null;

  return (
    <div className="mt-12 p-6 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
      <h2 className="text-3xl font-bold mb-6">AI Build Results</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`px-4 py-1 rounded-md text-sm ${
              tab === s.key
                ? "bg-blue-700 text-white"
                : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
            }`}
            onClick={() => setTab(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content Window */}
      <div className="bg-black/40 p-4 rounded-lg border border-neutral-800 overflow-x-auto">
        <pre className="whitespace-pre-wrap text-sm">
          {typeof result[tab] === "object"
            ? JSON.stringify(result[tab], null, 2)
            : result[tab]}
        </pre>
      </div>
    </div>
  );
}
