"use client";

import { useState } from "react";
import { FaGoogle, FaMicrosoft, FaOkta, FaKey } from "react-icons/fa";

export default function SSOLoginButton({
  provider,
  orgId,
  disabled = false,
}: {
  provider: string; // google | microsoft | okta | auth0 | onelogin | oidc
  orgId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const icons: any = {
    google: <FaGoogle className="text-red-400" />,
    microsoft: <FaMicrosoft className="text-blue-400" />,
    okta: <FaOkta className="text-indigo-400" />,
    auth0: <FaKey className="text-orange-400" />,
    onelogin: <FaKey className="text-blue-500" />,
    oidc: <FaKey className="text-green-400" />,
  };

  const labelMap: any = {
    google: "Sign in with Google",
    microsoft: "Sign in with Microsoft",
    okta: "Sign in with Okta",
    auth0: "Sign in with Auth0",
    onelogin: "Sign in with OneLogin",
    oidc: "Sign in with SSO",
  };

  const displayIcon = icons[provider] ?? <FaKey className="text-white" />;
  const displayLabel = labelMap[provider] ?? "Sign in with SSO";

  async function handleLogin() {
    if (disabled) return;

    setLoading(true);
    try {
      window.location.href = `/api/auth/sso/login?provider=${provider}&orgId=${orgId}`;
    } catch (err) {
      alert("SSO login failed. Please check configuration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      disabled={disabled || loading}
      onClick={handleLogin}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg 
        font-semibold transition-colors
        ${
          disabled
            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
            : "bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-white"
        }
      `}
    >
      {loading ? (
        <span className="animate-pulse text-blue-400">Connecting…</span>
      ) : (
        <>
          {displayIcon}
          <span>{displayLabel}</span>
        </>
      )}
    </button>
  );
}
