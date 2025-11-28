// components/ResultViewer.tsx
"use client";

import { useState } from "react";

export default function ResultViewer({ result }: { result: any }) {
  const [tab, setTab] = useState("summary");

  if (!result) return null;

  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "architecture", label: "Architecture" },
    { id: "cloud_init", label: "Cloud Init" },
    { id: "docker_compose", label: "Docker" },
    { id: "pipelines", label: "Pipelines" },
    { id: "maintenance_plan", label: "Maintenance" },
    { id: "sso_recommendations", label: "SSO" },
    { id: "security_model", label: "Security" },
    { id: "budget_projection", label: "Budget" },
    { id: "upgrade_paths", label: "Upgrade" },
    { id: "next_steps", label: "Next Steps" },
  ];

  const get = (key: string) => result?.[key] ?? "No data.";

  return (
    <div className="mt-12">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg border text-sm
              ${
                tab === t.id
                  ? "bg-blue-700 border-blue-500"
                  : "bg-neutral-900 border-neutral-700 hover:bg-neutral-800"
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl text-white">
        <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
{typeof get(tab) === "object"
  ? JSON.stringify(get(tab), null, 2)
  : get(tab)}
        </pre>
      </div>
    </div>
  );
}
