"use client";

import { useState, useEffect } from "react";

interface SecuritySelectProps {
  selected: string;
  onChange: (value: string) => void;
  plan: "developer" | "startup" | "team" | "enterprise";
}

const securityOptions = [
  {
    id: "none",
    label: "No Additional Security",
    desc: "Standard baseline config. No SSO or advanced features.",
  },
  {
    id: "basic",
    label: "Basic Security",
    desc: "API keys, env encryption, least-privilege permissions.",
  },
  {
    id: "advanced",
    label: "Advanced Security",
    desc: "SSO, RBAC, audit logs, identity hardening.",
  },
  {
    id: "enterprise",
    label: "Enterprise Zero-Trust",
    desc: "SSO + SCIM, policy engines, geo-enforcement, full telemetry.",
  },
];

const planCaps = {
  developer: { security: "none", sso: false, upgrade: "startup" },
  startup: { security: "basic", sso: true, upgrade: "team" },
  team: { security: "advanced", sso: true, upgrade: "enterprise" },
  enterprise: { security: "enterprise", sso: true },
};

export default function SecuritySelect({
  selected,
  onChange,
  plan,
}: SecuritySelectProps) {
  const caps = planCaps[plan];
  const [warning, setWarning] = useState("");

  useEffect(() => {
    if (!isAllowed(selected, caps)) {
      setWarning(
        `Your plan (${plan}) does not support "${selected}" security. Upgrade to ${caps.upgrade} to unlock this feature.`
      );
    } else {
      setWarning("");
    }
  }, [selected, plan]);

  function isAllowed(option: string, caps: any) {
    const levels = ["none", "basic", "advanced", "enterprise"];
    const maxAllowed = caps.security;

    return levels.indexOf(option) <= levels.indexOf(maxAllowed);
  }

  function handleSelect(option: string) {
    if (!isAllowed(option, caps)) {
      setWarning(
        `Upgrade required: "${option}" is above your tier. Highest allowed: ${caps.security}.`
      );
      onChange(caps.security); // fallback
      return;
    }
    onChange(option);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Security Level</h2>

      <p className="text-gray-400 text-sm">
        Your plan:{" "}
        <strong className="capitalize text-white">{plan}</strong> — Max allowed:{" "}
        <strong className="capitalize text-blue-300">{caps.security}</strong>.
      </p>

      {warning && (
        <div className="p-3 rounded-md bg-yellow-900/40 border border-yellow-700 text-yellow-200 text-sm">
          {warning}
        </div>
      )}

      <div className="grid gap-4">
        {securityOptions.map((opt) => {
          const allowed = isAllowed(opt.id, caps);
          const disabled = !allowed;

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
                  Upgrade required (max: {caps.security})
                </div>
              )}

              {/* SSO Tag — only visible if applicable */}
              {opt.id !== "none" && caps.sso && allowed && (
                <div className="text-xs mt-2 text-blue-300">
                  ✓ SSO supported at this security level
                </div>
              )}
              {opt.id !== "none" && !caps.sso && (
                <div className="text-xs mt-2 text-gray-400">
                  SSO not available on {plan} tier
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
