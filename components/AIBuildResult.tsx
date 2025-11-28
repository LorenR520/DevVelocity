"use client";

import { useState } from "react";

interface Props {
  result: any;
}

export default function AIBuildResult({ result }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const section = (label: string, content: any, id: string) => {
    if (!content) return null;

    return (
      <div className="mb-10 bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">{label}</h3>

          <button
            onClick={() => copy(typeof content === "string" ? content : JSON.stringify(content, null, 2), id)}
            className="text-xs bg-neutral-800 px-3 py-1 rounded hover:bg-neutral-700 border border-neutral-700"
          >
            {copied === id ? "Copied!" : "Copy"}
          </button>
        </div>

        <pre className="whitespace-pre-wrap text-sm bg-black/40 p-4 rounded-lg overflow-x-auto">
{typeof content === "string" ? content : JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="mt-14 text-white">
      {/* Title */}
      <h2 className="text-3xl font-bold mb-8">Your AI-Generated Architecture</h2>

      {/* Summary Block */}
      {section("🏗 Summary", result.summary, "summary")}

      {/* Architecture Description */}
      {section("🧩 Architecture", result.architecture, "architecture")}

      {/* Cloud Init */}
      {section("🔧 Cloud Init (VM Provisioning)", result.cloud_init, "cloud_init")}

      {/* Docker Compose */}
      {section("🐳 Docker Compose", result.docker_compose, "docker_compose")}

      {/* Pipelines */}
      {result.pipelines &&
        section(
          "🚀 CI/CD Pipelines",
          {
            provider: result.pipelines.provider,
            automation: result.pipelines.automation,
          },
          "pipelines"
        )}

      {/* Maintenance Plan */}
      {section("🛠 Maintenance Plan", result.maintenance_plan, "maintenance")}

      {/* SSO */}
      {section("🔐 SSO Recommendations", result.sso_recommendations, "sso")}

      {/* Security */}
      {section("🛡 Security Model", result.security_model, "security")}

      {/* Budget Projection */}
      {section("💸 Budget Projection", result.budget_projection, "budget")}

      {/* Upgrade Paths */}
      {section("⬆️ Upgrade Suggestions", result.upgrade_paths, "upgrades")}

      {/* Next Steps */}
      {section("📌 Next Steps", result.next_steps, "steps")}

      {/* Save to Template Library — enabled in Phase 2 */}
      <div className="mt-10 text-right">
        <button
          className="
            bg-blue-600 hover:bg-blue-700 
            px-6 py-2 rounded-lg 
            font-medium
            transition
            border border-blue-500
          "
          onClick={() => alert("Template saving will be enabled in Phase 2.")}
        >
          Save to My Template Library
        </button>
      </div>
    </div>
  );
}
