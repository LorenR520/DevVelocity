"use client";

import { useState } from "react";

export default function NewFilePage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("ai_output");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function saveFile() {
    setLoading(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        body: JSON.stringify({ name, type, content }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setSaved(true);
        setName("");
        setContent("");
      }
    } catch (err: any) {
      setError(err.message || "Error saving file.");
    }

    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Save New Build</h1>

      <div className="space-y-6">

        {/* FILE NAME */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            File Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg"
            placeholder="ex: Production Cloud-init (Oracle)"
          />
        </div>

        {/* FILE TYPE */}
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

        {/* FILE CONTENT */}
        <div>
          <label className="block text-gray-300 mb-2 font-medium">
            Content
          </label>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[250px] bg-neutral-900 border border-neutral-800 p-4 rounded-lg"
            placeholder="Paste your AI plan, cloud-init, YAML, docker-compose, or JSON here..."
          />
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={saveFile}
          disabled={loading}
          className="py-3 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          {loading ? "Saving..." : "Save File"}
        </button>

        {/* RESULT STATES */}
        {saved && (
          <p className="text-green-400 text-sm mt-2">
            File saved successfully!
          </p>
        )}

        {error && (
          <p className="text-red-400 text-sm mt-2">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
