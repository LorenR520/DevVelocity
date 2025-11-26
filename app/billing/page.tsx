"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Client-only Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount (client-side only)
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Loading billing data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg text-gray-300 mb-4">
          You must be logged in to view billing.
        </p>
        <a
          href="/auth/login"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
        >
          Login
        </a>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-6">Billing</h1>

      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium">Developer Plan</p>
            <p className="text-sm text-gray-400">$19 / month</p>
          </div>

          <button className="px-6 py-2 rounded-md bg-gray-700 hover:bg-gray-600">
            Manage Subscription
          </button>
        </div>
      </div>

      <div className="mt-8 bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Billing History</h2>

        <p className="text-gray-400">No invoices yet.</p>
      </div>
    </main>
  );
}
