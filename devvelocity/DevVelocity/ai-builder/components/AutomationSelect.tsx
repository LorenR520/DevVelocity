"use client";

import { useState, useEffect } from "react";

interface AutomationSelectProps {
  selected: string;
  onChange: (value: string) => void;
  plan: "developer" | "startup" | "team" | "enterprise";
}

const automationOptions = [
  {
    id: "basic",
    label: "Basic Automation",
    desc: "Simple build & deployment helpers",
  },
  {
    id: "ci_cd",
    label: "CI/CD Pipelines",
    desc: "Automated tests, deploys & versioning",
  },
  {
    id: "serverless",
    label: "Serverless Automation",
    desc: "Lambda / Functions / CloudRun / OCI functions",
  },
  {
    id: "full_enterprise",
    label: "Full Enterprise Automation",
    desc: "Blueprints, scaling logic, failover automation",
  },
];

const planCaps = {
  developer: "basic",
  startup: "advanced",
  team: "enterprise",
  enterprise: "private",
};

function isAllowed(plan: string, option: string) {
  if (plan === "enterprise") return true;
  if (plan === "team" && option !== "full_enterprise") return true;
  if (plan === "startup" && option === "basic") return true;
  if (plan === "developer" && option === "basic") return true;
  return false;
}

export default function AutomationSelect({
  selected,
  onChange,
  plan,
}: AutomationSelectProps) {
  const [limitWarning, setLimitWarning] = useState("");

  useEffect(() => {
    if (!isAllowed(plan, selected)) {
      setLimitWarning(
        `Your current plan (${plan}) does not allow “${selected}”. Upgrade recommended.`
      );
    } else {
      setLimitWarning("");
    }
  }, [selected, plan]);

  function handleSelect(option: string) {
    if (!isAllowed(plan, option)) {
      setLimitWarning(
        `Upgrade required: “${option}” is above your plan level (${plan}).`
      );
      onChange("basic"); // fallback
      return;
    }

    onChange(option);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Automation Level</h2>

      <p className="text-gray-400 text-sm">
        Your plan:{" "}
        <strong className="text-white capitalize">{plan}</strong> — automation
        features are limited accordingly.
      </p>

      {limitWarning && (
        <div className="p-3 rounded-md bg-yellow-900/40 border border-yellow-700 text-yellow-200 text-sm">
          {limitWarning}
        </div>
      )}

      <div className="grid gap-4">
        {automationOptions.map((opt) => {
          const disabled = !isAllowed(plan, opt.id);

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`p-4 rounded-xl border text-left transition ${
                selected === opt.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : disabled
                  ? "bg-neutral-900/40 border-neutral-800/50 text-gray-500"
                  : "bg-neutral-900 border-neutral-700 text-gray-300 hover:border-neutral-500"
              }`}
              disabled={disabled}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-sm text-gray-400">{opt.desc}</div>

              {disabled && (
                <div className="text-xs text-yellow-400 mt-2">
                  Upgrade required
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
