"use client";

import { useEffect, useState } from "react";
import { FaGoogle, FaMicrosoft, FaOkta, FaKey } from "react-icons/fa";

export default function SSOSettingsPage() {
  const [plan, setPlan] = useState("developer");
  const [provider, setProvider] = useState("");
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // ------------------------------------------------------
  // Load plan + existing SSO settings
  // ------------------------------------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);

      const res = await fetch("/api/sso/load", {
        method: "POST",
      });

      const json = await res.json();
      if (json.plan) setPlan(json.plan);
      if (json.sso_provider) {
        setProvider(json.sso_provider);
        setConfig(json.sso_config || {});
      }

      setLoading(false);
    }

    load();
  }, []);

  // ------------------------------------------------------
  // Save SSO provider + configuration
  // ------------------------------------------------------
  async function save() {
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/sso/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, config }),
    });

    const json = await res.json();

    if (json.error) {
      setMessage("❌ " + json.error);
    } else {
      setMessage("✅ SSO settings saved successfully!");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="text-gray-400 animate-pulse">
        Loading SSO settings…
      </div>
    );
  }

  // ------------------------------------------------------
  // Developer plan → show upgrade screen
  // ------------------------------------------------------
  if (plan === "developer") {
    return (
      <div className="p-8 rounded-xl bg-neutral-900 border border-neutral-800 text-gray-300">
        <h1 className="text-3xl font-bold mb-4">Single Sign-On (SSO)</h1>
        <p className="mb-4">
          SSO is disabled for the Developer plan. Unlock:
        </p>

        <ul className="list-disc ml-6 mb-6 text-gray-400">
          <li>Google SSO</li>
          <li>Microsoft Azure AD SSO</li>
          <li>Okta / Auth0 / OIDC</li>
          <li>Enterprise identity compliance</li>
        </ul>

        <a
          href="/upgrade?from=sso"
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
        >
          Upgrade Plan
        </a>
      </div>
    );
  }

  // ------------------------------------------------------
  // Provider-specific configuration forms
  // ------------------------------------------------------
  const providerFields = {
    google: [
      { key: "client_id", label: "Google Client ID" },
      { key: "client_secret", label: "Google Client Secret" },
    ],

    microsoft: [
      { key: "client_id", label: "Azure AD Client ID" },
      { key: "tenant_id", label: "Azure Tenant ID" },
      { key: "client_secret", label: "Client Secret" },
    ],

    okta: [
      { key: "domain", label: "Okta Domain" },
      { key: "client_id", label: "Okta Client ID" },
      { key: "client_secret", label: "Okta Client Secret" },
    ],

    auth0: [
      { key: "domain", label: "Auth0 Domain" },
      { key: "client_id", label: "Auth0 Client ID" },
      { key: "client_secret", label: "Auth0 Client Secret" },
    ],
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Single Sign-On (SSO)</h1>

      {/* Select Provider */}
      <label className="block text-gray-300 mb-2 font-medium">
        Select SSO Provider
      </label>

      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg text-white mb-6"
      >
        <option value="">None</option>
        <option value="google">Google</option>
        <option value="microsoft">Microsoft Azure AD</option>
        <option value="okta">Okta</option>
        <option value="auth0">Auth0</option>
      </select>

      {/* Provider Form */}
      {provider && (
        <div className="mt-6 p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <h2 className="text-xl font-semibold mb-4">
            {provider.charAt(0).toUpperCase() + provider.slice(1)} Settings
          </h2>

          <div className="space-y-4">
            {providerFields[provider]?.map((field) => (
              <div key={field.key}>
                <label className="block text-gray-300 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={config[field.key] || ""}
                  onChange={(e) =>
                    setConfig({ ...config, [field.key]: e.target.value })
                  }
                  className="bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={save}
        disabled={saving}
        className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>

      {/* Status Message */}
      {message && (
        <p className="mt-4 text-sm text-gray-300">{message}</p>
      )}
    </div>
  );
}
