"use client";

import { FaGoogle, FaMicrosoft, FaOkta, FaKey } from "react-icons/fa";

export default function SSOProviderBadge({
  plan,
  provider,
}: {
  plan: string;        // developer, startup, team, enterprise
  provider?: string;   // google / microsoft / okta / auth0 / oidc / undefined
}) {
  const isDev = plan === "developer";

  const icons: any = {
    google: <FaGoogle className="text-red-400" />,
    microsoft: <FaMicrosoft className="text-blue-400" />,
    okta: <FaOkta className="text-indigo-400" />,
    auth0: <FaKey className="text-orange-400" />,
    oidc: <FaKey className="text-green-400" />,
  };

  const labels: any = {
    google: "Google SSO Enabled",
    microsoft: "Microsoft SSO Enabled",
    okta: "Okta SSO Enabled",
    auth0: "Auth0 SSO Enabled",
    oidc: "SSO Enabled",
  };

  // Developer plan → show upgrade message
  if (isDev) {
    return (
      <div className="text-sm text-gray-400 bg-neutral-900/40 px-4 py-2 rounded-lg border border-neutral-800">
        🔒 SSO unavailable on Developer plan.
        <a
          href="/upgrade?from=sso"
          className="ml-2 text-blue-400 hover:underline"
        >
          Upgrade to unlock.
        </a>
      </div>
    );
  }

  // No SSO provider configured yet
  if (!provider) {
    return (
      <div className="text-sm text-yellow-300 bg-yellow-900/30 px-4 py-2 rounded-lg border border-yellow-700">
        ⚠️ No SSO provider configured.
        <a
          href="/dashboard/settings/sso"
          className="ml-2 text-yellow-300 underline hover:text-yellow-200"
        >
          Configure now
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-neutral-900/50 border border-neutral-800 px-4 py-2 rounded-lg text-sm">
      {icons[provider] || <FaKey className="text-white" />}
      <span className="text-gray-200">{labels[provider]}</span>
    </div>
  );
}
