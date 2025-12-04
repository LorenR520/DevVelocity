"use client";

import { useState, useEffect } from "react";

interface MaintenanceSelectProps {
  selected: string;
  onChange: (value: string) => void;
  plan: "developer" | "startup" | "team" | "enterprise";
  budget: number;
}

const maintenanceOptions = [
  {
    id: "low",
    label: "Low Maintenance",
    desc: "Self-managed. No automatic failover. Occasional downtime acceptable.",
    uptime: "95%",
  },
  {
    id: "standard",
    label: "Standard Maintenance",
    desc: "Weekly patches, auto-restarts, structured updates. Good for small teams.",
    uptime: "97%-99%",
  },
  {
    id: "high",
    label: "High Uptime",
    desc: "Blue/green deploys, health checks, proactive monitoring.",
    uptime: "99.5%",
  },
  {
    id: "mission_critical",
    label: "Mission-Critical / 24⁄7",
    desc: "Zero-downtime strategy. Multi-region. SRE-level oversight.",
    uptime: "99.99%",
  },
];

const planCaps = {
  developer: { max: "standard", upgrade: "startup" },
  startup: { max: "high", upgrade: "team" },
  team: { max: "mission_critical", upgrade: "enterprise" },
  enterprise: { max: "mission_critical" },
};

export default function MaintenanceSelect({
  selected,
  onChange,
  plan,
  budget,
}: MaintenanceSelectProps) {
  const caps = planCaps[plan];
  const [warning, setWarning] = useState("");

  const maintenanceRank = ["low", "standard", "high", "mission_critical"];

  function isAllowed(option: string) {
    return (
      maintenanceRank.indexOf(option) <= maintenanceRank.indexOf(caps.max)
    );
  }

  useEffect(() => {
    if (!isAllowed(selected)) {
      setWarning(
        `Your plan (${plan}) only allows up to "${caps.max}" maintenance. Upgrade to ${caps.upgrade} to unlock higher uptime.`
      );
    } else {
      setWarning("");
    }
  }, [selected, plan]);

  function handleSelect(option: string) {
    if (!isAllowed(option)) {
      setWarning(
        `Upgrade required: "${option}" exceeds your maintenance limit (${caps.max}).`
      );
      onChange(caps.max);
      return;
    }

    // If they choose mission-critical but have a low budget
    if (option === "mission_critical" && budget < 500) {
      setWarning(
        `Mission-critical uptime typically requires a budget of $500+/month. Current budget: $${budget}.`
      );
    }

    onChange(option);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Maintenance & Uptime</h2>

      <p className="text-gray-400 text-sm">
        Your plan:{" "}
        <strong className="capitalize text-white">{plan}</strong> — Max uptime tier:{" "}
        <strong className="capitalize text-blue-300">{caps.max}</strong>.
      </p>

      {warning && (
        <div className="p-3 rounded-md bg-yellow-900/40 border border-yellow-700 text-yellow-200 text-sm">
          {warning}
        </div>
      )}

      <div className="grid gap-4">
        {maintenanceOptions.map((opt) => {
          const allowed = isAllowed(opt.id);
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

              <div className="text-xs mt-2 text-blue-300">
                Uptime target: {opt.uptime}
              </div>

              {disabled && (
                <div className="text-xs text-yellow-400 mt-2">
                  Upgrade required (max: {caps.max})
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
