"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();

      if (!data?.session) {
        router.push("/auth/login");
        return;
      }

      setSession(data.session);
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-lg">Loading billing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-semibold mb-6">Billing</h1>

      <p className="text-gray-300 mb-10">
        Manage your DevVelocity subscription and payment details.
      </p>

      {/* BILLING CARD */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
        <h2 className="text-2xl font-semibold mb-4">
          Current Plan: <span className="text-blue-400">Free Tier</span>
        </h2>

        <p className="text-gray-400 mb-8">
          Upgrade to unlock multi-cloud builders, automation workflows, team
          access, and production features.
        </p>

        <div className="flex gap-4">
          <a
            href="/pricing"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            Upgrade Plan
          </a>

          <button
            className="px-6 py-3 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition"
            onClick={() => alert("Portal integration coming soon.")}
          >
            Open Billing Portal
          </button>
        </div>
      </div>
    </div>
  );
}
