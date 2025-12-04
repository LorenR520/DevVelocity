"use client";

import { useState } from "react";

interface Props {
  result: any;
}

export default function ResultViewer({ result }: Props) {
  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "architecture", label: "Architecture" },
    { id: "cloud_init", label: "Cloud Init" },
    { id: "docker_compose", label: "Docker Compose" },
    { id: "pipelines", label: "Pipelines" },
    { id: "maintenance_plan", label: "Maintenance" },
    { id: "sso_recommendations", label: "SSO" },
    { id: "security_model", label: "Security" },
    { id: "budget_projection", label: "Budget" },
    { id: "upgrade_paths", label: "Upgrade Paths" },
    { id: "next_steps", label: "Next Steps" },
  ];

  const [active, setActive] = useState("summary");

  const renderContent = () => {
    const content = result?.[active];

    if (!content) {
      return (
        <div className="text-gray-400 text-sm italic p-4">
          No data returned for this section.
        </div>
      );
    }

    if (typeof content === "object") {
      return (
        <pre className="whitespace-pre-wrap text-sm bg-black/30 p-4 rounded-lg overflow-auto">
{JSON.stringify(content, null, 2)}
        </pre>
      );
    }

    return (
      <pre className="whitespace-pre-wrap text-sm bg-black/30 p-4 rounded-lg overflow-auto">
{content}
      </pre>
    );
  };

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold text-white mb-6">
        AI-Generated Architecture Plan
      </h2>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-3 border-b border-neutral-800 pb-3 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition
              ${
                active === t.id
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white">
        {renderContent()}
      </div>
    </div>
  );
}
