"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface AIBuildResultProps {
  result: any;
}

/**
 * Renders collapsible sections with clean formatting
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-900 overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex justify-between items-center bg-neutral-800 hover:bg-neutral-700 transition text-white font-semibold"
      >
        {title}
        <span>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-4 py-4 text-gray-300 text-sm">{children}</div>
      )}
    </div>
  );
}

/**
 * Renders AI Builder output with deep formatting
 */
export default function AIBuildResult({ result }: AIBuildResultProps) {
  if (!result) return null;

  const pretty = (v: any) => JSON.stringify(v, null, 2);

  const field = (name: string) =>
    result[name] ? (
      <Section title={name.replace(/_/g, " ").toUpperCase()}>
        {typeof result[name] === "string" ? (
          <SyntaxHighlighter language="bash" style={oneDark}>
            {result[name]}
          </SyntaxHighlighter>
        ) : (
          <SyntaxHighlighter language="json" style={oneDark}>
            {pretty(result[name])}
          </SyntaxHighlighter>
        )}
      </Section>
    ) : null;

  return (
    <div id="ai-build-result" className="mt-16">
      <h2 className="text-3xl font-bold mb-6 text-white">
        Your AI-Generated Architecture
      </h2>

      {/* RAW JSON fallback for debugging */}
      {result.error && (
        <Section title="⚠ RAW OUTPUT (ERROR)">
          <p className="text-red-400 mb-2">{result.error}</p>
          <SyntaxHighlighter language="json" style={oneDark}>
            {pretty(result.raw)}
          </SyntaxHighlighter>
        </Section>
      )}

      {/* Summary */}
      {field("summary")}

      {/* Architecture */}
      {field("architecture")}

      {/* Cloud-init */}
      {field("cloud_init")}

      {/* Docker Compose */}
      {field("docker_compose")}

      {/* Pipelines */}
      {result.pipelines && (
        <Section title="PIPELINES">
          <SyntaxHighlighter language="json" style={oneDark}>
            {pretty(result.pipelines)}
          </SyntaxHighlighter>
        </Section>
      )}

      {/* Maintenance */}
      {field("maintenance_plan")}

      {/* Security */}
      {field("security_model")}

      {/* SSO */}
      {field("sso_recommendations")}

      {/* Budget */}
      {field("budget_projection")}

      {/* Upgrade */}
      {field("upgrade_paths")}

      {/* Next steps */}
      {field("next_steps")}

      <div className="text-center mt-10 text-gray-400 text-sm">
        Powered by <span className="text-blue-400">DevVelocity AI Builder</span>
      </div>
    </div>
  );
}
