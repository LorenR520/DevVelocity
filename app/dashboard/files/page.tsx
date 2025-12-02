"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * File Portal — Main Page
 * --------------------------------------------------
 * Visible only to Startup / Team / Enterprise.
 * Developer sees upgrade message.
 */

export default function FilePortalPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("developer");
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // Load plan + files
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        // Load plan from cookie
        const planCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user_plan="));

        const planValue = planCookie ? planCookie.split("=")[1] : "developer";
        setPlan(planValue);

        // If developer → don't call API
        if (planValue === "developer") {
          setLoading(false);
          return;
        }

        const orgCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("org_id="));
        const orgId = orgCookie ? orgCookie.split("=")[1] : null;

        if (!orgId) {
          setError("Missing orgId cookie");
          setLoading(false);
          return;
        }

        // Fetch from API
        const res = await fetch("/api/files/list", {
          method: "POST",
          body: JSON.stringify({ orgId, plan: planValue }),
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setFiles(json.files || []);
        }
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    load();
  }, []);

  // --------------------------------------------------
  // Developer Tier View
  // --------------------------------------------------
  if (plan === "developer") {
    return (
      <main className="p-10 text-white">
        <h1 className="text-3xl font-bold mb-4">File Portal</h1>
        <div className="p-6 rounded-xl bg-yellow-900/40 border border-yellow-700 text-yellow-300">
          🚫 File Portal is not available on the Developer plan.
          <br />
          <Link
            href="/upgrade?from=file-portal"
            className="text-yellow-200 underline mt-2 inline-block"
          >
            Upgrade now to unlock saved file management
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Loading View
  // --------------------------------------------------
  if (loading) {
    return (
      <main className="p-10 text-white">
        <p className="animate-pulse text-gray-400">Loading files…</p>
      </main>
    );
  }

  // --------------------------------------------------
  // Error View
  // --------------------------------------------------
  if (error) {
    return (
      <main className="p-10 text-red-400">
        <p>Error: {error}</p>
      </main>
    );
  }

  // --------------------------------------------------
  // File Portal (Startup / Team / Enterprise)
  // --------------------------------------------------
  return (
    <main className="p-10 text-white">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">File Portal</h1>

        <Link
          href="/dashboard/files/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
        >
          + New File
        </Link>
      </div>

      {/* File Table */}
      <div className="overflow-hidden border border-neutral-800 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-neutral-900">
            <tr className="text-gray-400 text-sm">
              <th className="p-4">File Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Versions</th>
              <th className="p-4">Last Updated</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {files.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-gray-500 p-6 italic"
                >
                  No saved files yet.
                </td>
              </tr>
            )}

            {files.map((file) => (
              <tr
                key={file.id}
                className="border-t border-neutral-800 hover:bg-neutral-900/40"
              >
                <td className="p-4 font-medium">{file.filename}</td>

                <td className="p-4">{file.description || "—"}</td>

                <td className="p-4">{file.version_count || 0}</td>

                <td className="p-4">
                  {new Date(file.updated_at).toLocaleString()}
                </td>

                <td className="p-4 text-right space-x-3">
                  <Link
                    href={`/dashboard/files/view?id=${file.id}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View
                  </Link>

                  <Link
                    href={`/dashboard/files/update?id=${file.id}`}
                    className="text-green-400 hover:text-green-300"
                  >
                    Update
                  </Link>

                  <Link
                    href={`/dashboard/files/history?id=${file.id}`}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    History
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
