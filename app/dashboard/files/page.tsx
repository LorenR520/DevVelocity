"use client";

import { useEffect, useState } from "react";

interface SavedFile {
  id: string;
  name: string;
  created_at: string;
  category: string;
  size_kb: number;
}

export default function FilePortalPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ---------------------------------------------------------
  // Load plan + files
  // ---------------------------------------------------------
  useEffect(() => {
    async function load() {
      // Load plan tier
      const planRes = await fetch("/api/user/plan");
      const planJson = await planRes.json();
      setPlan(planJson.plan || "developer");

      if (planJson.plan === "developer") {
        setShowUpgradeModal(true);
        setLoading(false);
        return;
      }

      // Load files
      const res = await fetch("/api/files/list");
      const json = await res.json();

      if (!json.error) setFiles(json.files || []);

      setLoading(false);
    }

    load();
  }, []);

  // ---------------------------------------------------------
  // Upgrade Modal (Developer Tier)
  // ---------------------------------------------------------
  const UpgradeBlockModal = () => {
    if (!showUpgradeModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 max-w-md w-full text-white">
          <h2 className="text-2xl font-bold mb-4">
            File Portal is not included in your current plan
          </h2>

          <p className="text-gray-300 mb-6">
            The File Portal is available starting at the{" "}
            <span className="font-semibold text-blue-400">Startup Plan</span>.
            Save infrastructure builds, cloud-init scripts, pipelines, 
            and automation templates — and unlock full Dev+ capabilities.
          </p>

          <a
            href="/dashboard/billing/upgrade"
            className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Upgrade to Unlock
          </a>

          <button
            onClick={() => setShowUpgradeModal(false)}
            className="mt-4 w-full py-2 text-gray-400 hover:text-gray-200 text-sm"
          >
            Continue without File Portal
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------
  // Developer → Block Entire Page
  // ---------------------------------------------------------
  if (plan === "developer") {
    return (
      <>
        <UpgradeBlockModal />
        <main className="max-w-3xl mx-auto px-6 py-16 text-white">
          <h1 className="text-3xl font-bold mb-6">File Portal</h1>
          <p className="text-gray-400">
            Upgrade your plan to save and manage your infrastructure templates.
          </p>
        </main>
      </>
    );
  }

  // ---------------------------------------------------------
  // Main File Portal Page (Paid Plans Only)
  // ---------------------------------------------------------
  return (
    <main className="max-w-5xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-10">Saved Files</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : files.length === 0 ? (
        <p className="text-gray-400">No files saved yet.</p>
      ) : (
        <div className="overflow-x-auto border border-neutral-800 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="border-t border-neutral-800 hover:bg-neutral-900"
                >
                  <td className="px-4 py-3">{file.name}</td>
                  <td className="px-4 py-3 text-gray-400">{file.category}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {file.size_kb} KB
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(file.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/files/download?id=${file.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <UpgradeBlockModal />
    </main>
  );
}
