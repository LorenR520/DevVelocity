"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import FileDiffViewer from "@/components/FileDiffViewer";

export default function FileVersionsPage({ params }: any) {
  const fileId = params.fileId;

  const [file, setFile] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [compareMode, setCompareMode] = useState(false);
  const [oldContent, setOldContent] = useState("");
  const [oldLabel, setOldLabel] = useState("");
  const [plan, setPlan] = useState("developer"); // TODO: replace with authenticated user plan

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Load main file
    const { data: fileData } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    // Load version history
    const { data: history } = await supabase
      .from("file_version_history")
      .select("*")
      .eq("file_id", fileId)
      .order("created_at", { ascending: false });

    setFile(fileData);
    setVersions(history || []);
    setLoading(false);
  }

  function startCompare(version: any) {
    setOldContent(version.content);
    setOldLabel(`Version from ${new Date(version.created_at).toLocaleString()}`);
    setCompareMode(true);
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-center text-gray-300">
        Loading file versions...
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">

      <h1 className="text-3xl font-bold mb-6">File Version History</h1>
      <p className="text-gray-400 mb-10">
        Review previous versions, restore older versions, or compare changes over time.
      </p>

      {/* -------------------- Version List -------------------- */}
      <div className="space-y-6">
        {versions.map((v) => (
          <div
            key={v.id}
            className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl"
          >
            <p className="font-semibold">
              Version from {new Date(v.created_at).toLocaleString()}
            </p>

            <div className="flex items-center gap-4 mt-3">
              {/* Compare Button */}
              <button
                onClick={() => startCompare(v)}
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
              >
                Compare with Current
              </button>

              {/* Download */}
              <a
                href={`/api/files/download?id=${v.id}&type=version`}
                className="px-4 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* -------------------- Comparison Panel -------------------- */}
      {compareMode && file && (
        <FileDiffViewer
          oldContent={oldContent}
          newContent={file.content}
          oldLabel={oldLabel}
          newLabel="Current Version"
          plan={plan}
        />
      )}
    </main>
  );
}
