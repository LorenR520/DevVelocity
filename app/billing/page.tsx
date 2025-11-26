"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function BillingPage() {
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

  async function upgradeToPro() {
    const { error } = await supabase
      .from("profiles")
      .update({ plan: "pro" })
      .eq("id", user?.id);

    if (!error) {
      alert("🎉 Your account has been upgraded to Pro!");
      router.push("/dashboard");
    } else {
      alert("Something went wrong upgrading your plan.");
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <p className="text-gray-500 dark:text-gray-300">Loading billing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-16 p-6">
      <h1 className="text-3xl font-bold mb-4">Upgrade Your Plan</h1>

      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Your current plan: <strong>Free Tier</strong>
      </p>

      <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow">
        <h2 className="text-xl font-semibold mb-2">
          Pro Plan – $29/month
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Unlock enterprise-grade cloud images, automated builds, and multi-cloud deployments.
        </p>

        <ul className="text-sm text-gray-700 dark:text-gray-300 mb-8 space-y-2">
          <li>✓ Automated hardened pipelines</li>
          <li>✓ All cloud providers unlocked</li>
          <li>✓ Priority image processing</li>
          <li>✓ Versioned build history</li>
        </ul>

        <button
          onClick={upgradeToPro}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
