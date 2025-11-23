"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.push("/auth/login");
        return;
      }

      setUser(data.user);
      setLoading(false);
    }

    loadUser();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-12 p-6">

      <h1 className="text-3xl font-bold mb-2">
        Welcome, {user?.email}
      </h1>

      <p className="text-gray-600 dark:text-gray-300 mb-10">
        Manage your cloud builds, subscriptions, and automation.
      </p>

      {/* GRID */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* CLOUD PROVIDERS */}
        <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow">
          <h2 className="text-lg font-semibold mb-2">Cloud Providers</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Deploy enterprise-grade images to AWS, Azure, GCP, OCI, Linode, Vultr, and DigitalOcean.
          </p>
          <a
            href="/docs/providers/aws"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Providers
          </a>
        </div>

        {/* SUBSCRIPTIONS */}
        <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow">
          <h2 className="text-lg font-semibold mb-2">Subscription</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Unlock automated builds, hardened images, and multi-cloud pipelines.
          </p>
          <a
            href="/docs/pricing"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upgrade Plan
          </a>
        </div>

        {/* ACCOUNT */}
        <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow">
          <h2 className="text-lg font-semibold mb-2">Account Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Manage your security, API keys, and build history.
          </p>
          <button
            onClick={logout}
            className="inline-block px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}
