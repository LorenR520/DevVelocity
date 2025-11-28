"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FileDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const fileId = params.id;

  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("ai_output");
  const [content, setContent] = useState("");

  // -----------------------------
  // Load file on page load
  //------------------------------
  useEffect(() => {
    async function loadFile() {
      const res = await fetch(`/api/files/get?id=${fileId}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setFile(json.file);
        setName(json.file.name);
        setType(json.file.type);
        setContent(json.file.content);
      }
      setLoading(false);
    }

    loadFile();
  }, [fileId]);

  // -----------------------------
  // Save Changes
  // -----------------------------
  async function save() {
    setSaving(true);
    setError("");

    const res = await fetch("/api/files/update", {
      method: "POST",
      body: JSON.stringify({
        id: fileId,
        name,
        type,
        content,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();

    if (json.error) {
      setError(json.error);
    }

    setSaving(false);
  }

  // -----------------------------
  // Delete File
  // -----------------------------
  async function deleteFile() {
    if (!confirm("Are you sure you want to delete this file?")) return;

    setDeleting(true);

    const res = await fetch("/api/files/delete", {
      method: "POST",
      body: JSON.stringify({ id: fileId }),
      headers: { "Content-Type": "application/json" },
    });

    await res.json();
    router.push("/dashboard/files");
  }

  // -----------------------------
  // Loading state
  // -----------------------------
  if (loading) {
    return (
      <main className="text-center text-gray-400 py-20">
        Loading file...
      </main>
    );
  }

  if (!file) {
    return (
      <main className="text-center text-red-400 py-20">
        File not found.
      </main>
    );
  }

  // -----------------------------
  // Main render
  // -----------------------------
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Edit File</h1>

      <div className="space-y-8">

        {/* NAME */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            File Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg"
          />
        </div>

        {/* TYPE */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            File Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg"
          >
            <option value="ai_output">AI Output</option>
            <option value="cloud_init">Cloud-init</option>
            <option value="docker">Docker</option>
            <option value="pipeline">Pipeline</option>
            <option value="template">Template</option>
            <option value="notes">Notes</option>
          </select>
        </div>

        {/* CONTENT */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Content
          </label>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[300px] bg-neutral-900 border border-neutral-800 p-4 rounded-lg"
          />
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={save}
          disabled={saving}
          className="py-3 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {/* DELETE BUTTON */}
        <button
          onClick={deleteFile}
          disabled={deleting}
          className="py-3 px-8 bg-red-600 hover:bg-red-700 rounded-lg font-semibold ml-4"
        >
          {deleting ? "Deleting..." : "Delete File"}
        </button>

        {/* ERRORS */}
        {error && (
          <p className="text-red-400 mt-4">{error}</p>
        )}
      </div>
    </main>
  );
}
