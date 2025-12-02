"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import CodeBlock from "@/components/CodeBlock";

export default function UpdateFilePage() {
  const router = useRouter();
  const params = useSearchParams();
  const fileId = params.get("id");

  const { user } = useSession();

  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFile() {
    if (!fileId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/files/get?id=${fileId}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setFileContent(json.content);
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  async function upgradeFile() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai-builder/upgrade-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          content: fileContent,
        }),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setResult(json.output);
        setFileContent(json.output.updated_file);
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  async function save() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/files/update", {
        method: "POST",
        body: JSON.stringify({
          id: fileId,
          content: fileContent,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        router.push("/dashboard/files");
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-14 text-white">
      <h1 className="text-3xl font-bold mb-6">Update Saved Build File</h1>

      {!fileContent && (
        <button
          onClick={loadFile}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg mb-8 font-semibold"
        >
          {loading ? "Loading..." : "Load File"}
        </button>
      )}

      {fileContent && (
        <>
          <label className="block mb-4 text-gray-300 font-medium">
            File Content
          </label>

          <textarea
            className="w-full h-80 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-mono"
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
          />

          <div className="flex gap-4 mt-6">
            <button
              onClick={upgradeFile}
              disabled={loading}
              className="py-3 px-6 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
            >
              {loading ? "Upgrading..." : "Run AI Upgrade (GPT-5.1 Pro)"}
            </button>

            <button
              onClick={save}
              disabled={loading}
              className="py-3 px-6 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Error */}
          {error && <p className="mt-6 text-red-400">{error}</p>}

          {/* Output Preview */}
          {result && (
            <div className="mt-12 border border-neutral-800 rounded-xl p-6 bg-neutral-900">
              <h2 className="text-2xl font-bold mb-4">
                AI Upgrade Result (v{result.version})
              </h2>

              <CodeBlock code={JSON.stringify(result, null, 2)} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
