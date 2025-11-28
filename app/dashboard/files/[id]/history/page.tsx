"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function FileVersionHistoryPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const fileId = params.id;

  const [file, setFile] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("developer");
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------
  // Load user metadata (plan + org)
  // -------------------------------------------------
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.app_metadata?.plan) {
        setPlan(user.app_metadata.plan);
      }
    }
    loadUser();
  }, []);

  // -------------------------------------------------
  // Load file + version history
  // -------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const { data: f, error: fileErr } = await supabase
          .from("files")
          .select("*")
          .eq("id", fileId)
          .single();

        if (fileErr) throw fileErr;
        setFile(f);

        const { data: v, error: vErr } = await supabase
          .from("file_version_history")
          .select("*")
          .eq("file_id", fileId)
          .order("version", { ascending: false });

        if (vErr) throw vErr;
        setVersions(v || []);
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    load();
  }, [fileId, supabase]);

  // -------------------------------------------------
  // If tier doesn't allow history → block access
  // -------------------------------------------------
  if (plan === "developer") {
    return (
      <main className="max-w-3xl mx-auto p-12 text-center text-white">
        <h1 className="text-3xl font-bold">Upgrade Required</h1>
        <p className="mt-4 text-gray-400">
          Version history is available on Startup, Team, and Enterprise plans.
        </p>
      </main>
    );
  }

  // -------------------------------------------------
  // Restore a version → creates a new version entry
  // -------------------------------------------------
  async function restoreVersion(v: any) {
    try {
      const { error } = await supabase.functions.invoke(
        "restore-file-version",
        {
          body: { file_id: fileId, version: v.version },
        }
      );

      if (error) throw error;

      router.refresh();
    } catch (err: any) {
      alert("Error restoring version: " + err.message);
    }
  }

  // -------------------------------------------------
  // Open in AI Builder → prefill the editor
  // -------------------------------------------------
  async function openInAIBuilder(content: string) {
    localStorage.setItem("devvelocity_ai_prefill", content);
    router.push("/ai-builder?prefill=1");
  }

  // -------------------------------------------------
  // UI Rendering
  // -------------------------------------------------

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-12 text-white text-center">
        Loading version history…
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Version History — {file?.filename}
      </h1>

      <p className="text-gray-400 mb-12">
        Track older versions, restore builds, and send versions to the AI Builder
        for upgrade recommendations.
      </p>

      <div className="space-y-4">
        {versions.map((v) => (
          <div
            key={v.version}
            className="p-6 border border-neutral-800 rounded-xl bg-neutral-900"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  Version {v.version}
                  {v.version !== file.latest_version && (
                    <span className="ml-2 text-xs text-yellow-400">
                      (Outdated — upgrade recommended)
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  Saved: {new Date(v.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => openInAIBuilder(v.content)}
                  className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700"
                >
                  Open in AI Builder
                </button>

                <button
                  onClick={() => restoreVersion(v)}
                  className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700"
                >
                  Restore
                </button>
              </div>
            </div>

            <pre className="mt-4 text-xs bg-black/40 p-3 rounded overflow-x-auto">
{v.content}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
