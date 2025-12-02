"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Link from "next/link";

export default function ViewFilePage() {
  const params = useSearchParams();
  const fileId = params.get("id");

  const [file, setFile] = useState<any>(null);
  const [content, setContent] = useState("");
  const [plan, setPlan] = useState("developer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------
  // Load file + plan
  // ----------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        // Load plan tier from cookie
        const planCookie = document.cookie
          .split("; ")
          .find((r) => r.startsWith("user_plan="));

        const planValue = planCookie ? planCookie.split("=")[1] : "developer";
        setPlan(planValue);

        if (!fileId) {
          setError("Missing file ID");
          setLoading(false);
          return;
        }

        if (planValue === "developer") {
          setLoading(false);
          return;
        }

        // Load org ID
        const orgCookie = document.cookie
          .split("; ")
          .find((r) => r.startsWith("org_id="));
        const orgId = orgCookie ? orgCookie.split("=")[1] : null;

        if (!orgId) {
          setError("Missing orgId cookie");
          setLoading(false);
          return;
        }

        // Call API to load file
        const res = await fetch("/api/files/get", {
          method: "POST",
          body: JSON.stringify({ fileId, orgId }),
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setFile(json.file);
          setContent(json.file?.content || "");
        }
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    load();
  }, [fileId]);

  // ----------------------------------------------------
  // Developer Tier View (blocked)
  // ----------------------------------------------------
  if (plan === "developer") {
    return (
      <main className="p-10 text-white">
        <h1 className="text-3xl font-bold">View File</h1>
        <div className="p-6 mt-6 rounded-xl bg-yellow-900/40 border border-yellow-700 text-yellow-300">
          🚫 File Portal is unavailable on the Developer plan.
          <br />
          <Link href="/upgrade?from=file-portal" className="text-yellow-200 underline inline-block mt-2">
            Upgrade now to unlock file storage
          </Link>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // Loading
  // ----------------------------------------------------
  if (loading) {
    return (
      <main className="p-10 text-gray-400 animate-pulse">Loading file…</main>
    );
  }

  // ----------------------------------------------------
  // Error
  // ----------------------------------------------------
  if (error) {
    return (
      <main className="p-10 text-red-400">
        Error loading file: {error}
      </main>
    );
  }

  // ----------------------------------------------------
  // No file found
  // ----------------------------------------------------
  if (!file) {
    return (
      <main className="p-10 text-gray-400">File not found.</main>
    );
  }

  // ----------------------------------------------------
  // MAIN FILE VIEW
  // ----------------------------------------------------
  return (
    <main className="p-10 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{file.filename}</h1>
          <p className="text-gray-400 mt-1">{file.description || "No description provided."}</p>
          <p className="text-gray-500 text-sm mt-1">
            Last updated: {new Date(file.updated_at).toLocaleString()}
          </p>
        </div>

        <div className="space-x-3">
          <Link
            href={`/dashboard/files/update?id=${file.id}`}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
          >
            Update
          </Link>

          <Link
            href={`/dashboard/files/history?id=${file.id}`}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium"
          >
            History
          </Link>
        </div>
      </div>

      {/* ----------------------------------------
          OUTDATED WARNING + UPGRADE BUTTON
      ---------------------------------------- */}
      <div className="p-4 mb-6 rounded-lg bg-yellow-900/40 border border-yellow-700 text-yellow-300">
        ⚠️ This config may be outdated if DevVelocity has released new templates.
        <Link
          href={`/dashboard/files/update?id=${file.id}`}
          className="ml-4 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium"
        >
          Run AI Upgrade
        </Link>
      </div>

      {/* ----------------------------------------
          FILE CONTENT (Syntax Highlighted)
      ---------------------------------------- */}
      <SyntaxHighlighter
        language="json"
        style={tomorrow}
        wrapLongLines={true}
        customStyle={{
          background: "rgba(0,0,0,0.4)",
          padding: "16px",
          borderRadius: "8px",
          fontSize: "13px",
        }}
      >
        {content}
      </SyntaxHighlighter>
    </main>
  );
}
