// app/dashboard/ai-builder/page.tsx
"use client";

import { useState, useEffect } from "react";
import { generateQuestions } from "@/ai-builder/plan-logic";
import ResultViewer from "@/components/ResultViewer";

// ----------------------------------------
// AI Builder Page
// ----------------------------------------
export default function AIBuildPage() {
  const [plan, setPlan] = useState<string>("developer");
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------
  // Load questions when plan tier changes
  // ----------------------------------------
  useEffect(() => {
    const q = generateQuestions(plan);
    setQuestions(q);
    setAnswers({}); // reset answers when plan changes
  }, [plan]);

  const updateAnswer = (id: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // ----------------------------------------
  // Submit → AI Builder Engine (API route)
  // ----------------------------------------
  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai-builder", {
        method: "POST",
        body: JSON.stringify({
          answers: {
            ...answers,
            plan,
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setResult(json.output);

        // smooth scroll to result
        setTimeout(() => {
          window.scrollTo({ top: 99999, behavior: "smooth" });
        }, 100);
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  // ----------------------------------------
  // Render UI
  // ----------------------------------------
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">AI Infrastructure Builder</h1>

      {/* ------------------ Current Plan Selector ------------------ */}
      <div className="mb-12">
        <label className="block text-gray-300 mb-2 font-medium">
          Your Current Plan Tier
        </label>

        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg text-white"
        >
          <option value="developer">Developer</option>
          <option value="startup">Startup</option>
          <option value="team">Team</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <p className="text-gray-400 text-sm mt-2">
          Questions & capabilities automatically adjust based on your plan.
        </p>
      </div>

      {/* ------------------ Dynamic Questionnaire ------------------ */}
      <div className="space-y-8">
        {questions.map((q, index) => (
          <div
            key={index}
            className="p-6 rounded-xl bg-neutral-900 border border-neutral-800"
          >
            <p className="text-lg font-semibold mb-4">{q.question}</p>

            <div className="space-y-3">
              {q.options.map((opt: string) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <input
                    type={q.allowMultiple ? "checkbox" : "radio"}
                    name={`q-${index}`}
                    value={opt}
                    onChange={(e) => {
                      if (q.allowMultiple) {
                        const prev = answers[index] || [];
                        if (e.target.checked) {
                          updateAnswer(index, [...prev, opt]);
                        } else {
                          updateAnswer(
                            index,
                            prev.filter((p: string) => p !== opt)
                          );
                        }
                      } else {
                        updateAnswer(index, opt);
                      }
                    }}
                    className="accent-blue-500"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ------------------ Submit Button ------------------ */}
      <button
        onClick={submit}
        disabled={loading}
        className="mt-10 py-3 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        {loading ? "Building Your Architecture..." : "Generate My Architecture"}
      </button>

      {/* ------------------ Error Display ------------------ */}
      {error && (
        <p className="mt-6 text-red-400 text-sm">
          {error}
        </p>
      )}

      {/* ------------------ AI Result Viewer ------------------ */}
      {result && <ResultViewer result={result} />}
    </main>
  );
}
