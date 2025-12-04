"use client";

import { useState, useEffect } from "react";

interface ProviderSelectProps {
  selected: string[];
  onChange: (list: string[]) => void;
  plan: "developer" | "startup" | "team" | "enterprise";
}

const providerOptions = [
  "AWS",
  "Azure",
  "Google Cloud",
  "Oracle Cloud",
  "DigitalOcean",
  "Linode",
  "Vultr",
  "Heroku",
  "Render",
];

const planCaps = {
  developer: 1,
  startup: 3,
  team: 7,
  enterprise: 999,
};

export default function ProviderSelect({
  selected,
  onChange,
  plan,
}: ProviderSelectProps) {
  const [limitReached, setLimitReached] = useState(false);

  const limit = planCaps[plan];

  useEffect(() => {
    setLimitReached(selected.length >= limit);
  }, [selected, limit]);

  function toggleProvider(p: string) {
    if (selected.includes(p)) {
      onChange(selected.filter((x) => x !== p));
      return;
    }

    if (selected.length >= limit) {
      return; // hard-lock
    }

    onChange([...selected, p]);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Choose Cloud Providers</h2>

      <p className="text-gray-400 text-sm">
        Your plan: <strong className="text-white capitalize">{plan}</strong> — supports{" "}
        <span className="text-blue-400">{limit}</span> provider
        {limit > 1 ? "s" : ""}.
      </p>

      {limitReached && plan !== "enterprise" && (
        <div className="p-3 rounded-md bg-yellow-900/40 border border-yellow-700 text-yellow-200 text-sm">
          You’ve reached your plan limit. Upgrade to unlock more providers.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {providerOptions.map((p) => (
          <button
            key={p}
            onClick={() => toggleProvider(p)}
            className={`p-3 rounded-lg border text-sm transition ${
              selected.includes(p)
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-neutral-900 border-neutral-700 text-gray-300 hover:border-neutral-500"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="text-green-300 text-sm pt-2">
          Selected: {selected.join(", ")}
        </p>
      )}
    </div>
  );
}
