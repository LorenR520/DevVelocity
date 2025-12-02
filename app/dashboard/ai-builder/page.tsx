"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { generateQuestions } from "@/ai-builder/plan-logic";
import AIBuildResult from "@/components/AIBuildResult";

export default function AIBuildDashboardPage() {
  const [plan, setPlan] = useState<string>("developer");
  const [loadingPlan, setLoadingPlan] = useState(true);

  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // Fetch user plan from cookie
  // -------------------------
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("user_plan="));

    if (cookie) {
      setPlan(cookie.split("=")[1]);
    }

    setLoadingPlan(false);
  }, []);

  // -------------------------
  // Load questions based on plan
  // -------------------------
  useEffect(() => {
    if (!loadingPlan) {
      const q = generateQuestions(plan);
      setQuestions(q);
    }
  }, [plan, loadingPlan]);

  const updateAnswer = (id: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // -------------------------
  // Submit to AI Builder
  // -------------------------
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
        window.scrollTo({ top: 99999, behavior: "smooth" });
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  // -------------------------
  // Upgrade Gate
  // -------------------------
  if (plan === "developer") {
    return (
      <div className="text-white p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">AI Builder</h1>
        <p className="text-gray-400 mb-6">
          Your current plan does not include AI Builder. Upgrade to access the full
          architecture generator, automation builder, cloud-init engine, and
          docker orchestration system.
        </p>

        <Link
          href="/upgrade?from=ai-builder"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          Upgrade to Unlock AI Builder
        </Link>
      </div>
    );
  }

  // -------------------------
  // Main Builder UI
  // -------------------------
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">AI Infrastructure Builder</h1>

      {/* Paste Previous File */}
      <Link
        href="/dashboard/files/update?mode=paste"
        className="block mb-10 p-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-blue-600 text-blue-400 text-sm font-semibold"
      >
        Paste an Existing DevVelocity File → Update with AI
      </Link>

      {/* Questions */}
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

      {/* Submit */}
      <button
        onClick={submit}
        disabled={loading}
        className="mt-10 py-3 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        {loading ? "Building Your Architecture..." : "Generate My Architecture"}
      </button>

      {/* Error */}
      {error && <p className="mt-6 text-red-400 text-sm">{error}</p>}

      {/* AI Output */}
      {result && <AIBuildResult result={result} />}
    </main>
  );
}
