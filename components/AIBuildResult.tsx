"use client";

import { useState } from "react";

export default function AIBuildResult({ result }: { result: any }) {
  const sections = [
    { key: "summary", label: "Summary" },
    { key: "architecture", label: "Architecture" },
    { key: "cloud_init", label: "Cloud-Init Script" },
    { key: "docker_compose", label: "Docker Compose" },
    { key: "pipelines", label: "Pipelines" },
    { key: "maintenance_plan", label: "Maintenance Plan" },
    { key: "sso_recommendations", label: "SSO Recommendations" },
    { key: "security_model", label: "Security Model" },
    { key: "budget_projection", label: "Budget Projection" },
    { key: "upgrade_paths", label: "Upgrade Paths" },
    { key: "next_steps", label: "Next Steps" },
  ];

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold mb-6 text-white">
        Your AI-Generated Build
      </h2>

      <div className="space-y-6">
        {sections.map((section) => {
          if (!result[section.key]) return null;
          return (
            <ResultSection
              key={section.key}
              title={section.label}
              content={result[section.key]}
            />
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------
   Collapsible, styled result sections with copy buttons
-------------------------------------------------------- */
function ResultSection({
  title,
  content,
}: {
  title: string;
  content: any;
}) {
  const [open, setOpen] = useState(false);

  const formatted =
    typeof content === "object"
      ? JSON.stringify(content, null, 2)
      : content;

  function copy() {
    navigator.clipboard.writeText(formatted);
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h3 className="text-xl font-semibold text-white">{title}</h3>

        <button className="text-gray-400 hover:text-white transition">
          {open ? "▲" : "▼"}
        </button>
      </div>

      {/* Body */}
      {open && (
        <div className="mt-4 relative">
          <pre className="bg-black/40 text-green-300 p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
            {formatted}
          </pre>

          <button
            onClick={copy}
            className="absolute top-3 right-3 bg-neutral-800 hover:bg-neutral-700 text-xs px-3 py-1 rounded"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
