"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hasFeature } from "@/ai-builder/plan-logic";

interface FileCardProps {
  file: any;
  planId: string;
}

export default function FileCard({ file, planId }: FileCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const allowAdvanced = hasFeature(planId, "file_portal");

  async function download() {
    setLoading(true);
    await fetch(`/api/files/download?id=${file.id}`)
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        a.click();
        window.URL.revokeObjectURL(url);
      });
    setLoading(false);
  }

  async function updateFile() {
    if (!allowAdvanced) {
      router.push("/dashboard/billing/upgrade");
      return;
    }

    router.push(`/dashboard/files/update?file=${file.id}`);
  }

  async function viewHistory() {
    if (!allowAdvanced) {
      router.push("/dashboard/billing/upgrade");
      return;
    }

    router.push(`/dashboard/files/${file.id}/history`);
  }

  const isOld =
    file?.generated_version &&
    file.generated_version < 3; // v3 = latest AI builder schema

  return (
    <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl text-white">

      {/* Outdated Banner */}
      {isOld && (
        <div className="mb-4 p-3 bg-yellow-800/20 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
          This file was generated using an older AI schema.  
          <button
            onClick={updateFile}
            className="underline ml-1 hover:text-yellow-200"
          >
            Update it with AI →
          </button>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-1">{file.filename}</h3>
      <p className="text-gray-400 text-sm">
        Last modified: {new Date(file.updated_at).toLocaleString()}
      </p>

      <div className="flex gap-3 mt-6">

        {/* Download */}
        <button
          onClick={download}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Downloading…" : "Download"}
        </button>

        {/* Update With AI */}
        <button
          onClick={updateFile}
          className={`px-4 py-2 rounded-lg ${
            allowAdvanced
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-neutral-700 cursor-pointer"
          }`}
        >
          Update With AI
        </button>

        {/* Version History */}
        <button
          onClick={viewHistory}
          className={`px-4 py-2 rounded-lg ${
            allowAdvanced
              ? "bg-neutral-700 hover:bg-neutral-600"
              : "bg-neutral-700 cursor-pointer"
          }`}
        >
          History
        </button>

      </div>
    </div>
  );
}
