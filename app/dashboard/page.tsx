"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on page load
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
        <p className="text-gray-500 dark:text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-16 p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user?.email}</h1>

      <p className="text-gray-600 dark:text-gray-300 mb-8">
        This is your DevVelocity dashboard. From here you’ll manage cloud images,
        subscriptions, and automated builds.
      </p>

      {/* MAIN DASHBOARD GRID */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Cloud Providers */}
        <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow">
          <h2 className="font-semibold mb-2 text-lg">Cloud Providers</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Deploy enterprise-grade images to AWS, Azure, GCP, OCI, Linode, Vultr, and DigitalOcean.
          </p>
          <a
            href="/providers"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Providers
          </a>
        </div>

        {/* Subscription Tier */}
        <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow">
          <h2 className="font-semibold mb-2 text-lg">Subscription</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upgrade to unlock automated builds, multi-cloud pipelines, hardened images, and more.
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upgrade Plan
          </a>
        </div>

        {/* Account Settings */}
        <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow">
          <h2 className="font-semibold mb-2 text-lg">Account</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Manage email, security, API keys, and build history.
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
