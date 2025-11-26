"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!data?.session) {
        router.replace("/auth/login");
        return;
      }

      if (!ignore) {
        setSession(data.session);
        setLoading(false);
      }
    }

    loadSession();
    return () => {
      ignore = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <p className="text-gray-400 text-lg animate-pulse">
          Loading dashboard…
        </p>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 text-white">

      <h1 className="text-4xl font-semibold mb-6">
        Welcome, {session?.user?.email}
      </h1>

      <p className="text-gray-300 mb-10">
        This is your DevVelocity dashboard. More analytics, provider stats, and
        automated build workflows will appear here as your subscription expands.
      </p>

      {/* GRID */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* PROVIDERS */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Cloud Providers</h2>
          <p className="text-gray-400">7 connected providers</p>
        </div>

        {/* BUILDS */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Builds</h2>
          <p className="text-gray-400">0 active builds</p>
        </div>

        {/* TEMPLATES */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Templates</h2>
          <p className="text-gray-400">Template Builder coming soon</p>
        </div>
      </div>
    </main>
  );
}
