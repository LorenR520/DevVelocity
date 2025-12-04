"use client";

import { useState, useEffect } from "react";

interface ProviderSelectProps {
  selected: string[];
  onChange: (value: string[]) => void;
  plan: "developer" | "startup" | "team" | "enterprise";
}

// Full provider catalog
const ALL_PROVIDERS = [
  { id: "aws", label: "AWS" },
  { id: "azure", label: "Azure" },
  { id: "gcp", label: "Google Cloud" },
  { id: "oci", label: "Oracle Cloud" },
  { id: "do", label: "DigitalOcean" },
  { id: "cloudflare", label: "Cloudflare" },
  { id: "linode", label: "Linode" },
  { id: "heroku", label: "Heroku" },
  { id: "fly", label: "Fly.io" },
  { id: "render", label: "Render" },
];

// Tier caps
const planCaps = {
  developer: { max: 1, upgrade: "startup" },
  startup: { max: 3, upgrade: "team" },
  team: { max: 7, upgrade: "enterprise" },
  enterprise: { max: Infinity }, // unlimited
};

export default function ProvidersSelect({
  selected,
  onChange,
  plan,
}: ProviderSelectProps) {
  const caps = planCaps[plan];
  const [warning, setWarning] = useState("");

  function toggleProvider(provider: string) {
    let updated = [...selected];

    if (updated.includes(provider)) {
      updated = updated.filter((p) => p !== provider);
    } else {
      updated.push(provider);
    }

    // enforce tier caps
    if (updated.length > caps.max) {
      const trimmed = updated.slice(0, caps.max);
      setWarning(
        `Your plan (“${plan}”) allows ${caps.max} cloud provider${
          caps.max === 1 ? "" : "s"
        }. Upgrade to “${caps.upgrade}” to unlock more.`
      );
      onChange(trimmed);
      return;
    }

    setWarning("");
    onChange(updated);
  }

  useEffect(() => {
    if (selected.length > caps.max) {
      onChange(selected.slice(0, caps.max));
    }
  }, [plan]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Cloud Providers</h2>

      <p className="text-gray-400 text-sm">
        Your plan:{" "}
        <strong className="capitalize text-white">{plan}</strong> — Max allowed:{" "}
        <span className="text-blue-300 font-semibold">
          {caps.max === Infinity ? "Unlimited" : caps.max}
        </span>
      </p>

      {warning && (
        <div className="p-3 rounded-md bg-yellow-900/40 border border-yellow-700 text-yellow-200 text-sm">
          {warning}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {ALL_PROVIDERS.map(({ id, label }) => {
          const active = selected.includes(id);
          const disabled = selected.length >= caps.max && !active;

          return (
            <button
              key={id}
              onClick={() => toggleProvider(id)}
              disabled={disabled}
              className={`p-4 rounded-xl border text-left transition ${
                active
                  ? "bg-blue-600 border-blue-500 text-white"
                  : disabled
                  ? "bg-neutral-900/40 border-neutral-800/50 text-gray-500"
                  : "bg-neutral-900 border-neutral-700 text-gray-300 hover:border-neutral-500"
              }`}
            >
              <div className="font-medium">{label}</div>
              {disabled && !active && (
                <div className="text-xs text-yellow-400 mt-1">
                  Upgrade required to select more providers
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
