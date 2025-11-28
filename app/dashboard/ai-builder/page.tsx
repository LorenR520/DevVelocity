"use client";

import { useState, useEffect } from "react";
import { generateQuestions, recommendPlan } from "@/ai-builder/plan-logic";

export default function AIBuildPage() {
  const [plan, setPlan] = useState<string>("developer");
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------
  // Load questions based on the user's plan
  // ----------------------------------------
  useEffect(() => {
    const q = generateQuestions(plan);
    setQuestions(q);
  }, [plan]);

  const updateAnswer = (id: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // ----------------------------------------
  // Submit answers → Run AI Builder
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
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  // ----------------------------------------
  // Render Output (AI Result)
  // ----------------------------------------

  const renderOutput = () => {
    if (!result) return null;

    return (
      <div className="mt-12 p-6 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
        <h2 className="text-3xl font-bold mb-6">Your AI-Generated Infrastructure Plan</h2>

        <pre className="whitespace-pre-wrap text-sm bg-black/40 p-4 rounded-lg overflow-x-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  // ----------------------------------------
  // Render questionnaire
  // ----------------------------------------

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">AI Infrastructure Builder</h1>

      {/* Plan Selector */}
      <div className="mb-8">
        <label className="block text-gray-300 mb-2 font-medium">
          Your Current Plan
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
      </div>

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
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
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
        className="mt-8 py-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        {loading ? "Building..." : "Generate My Architecture"}
      </button>

      {/* Error */}
      {error && (
        <p className="mt-6 text-red-400 text-sm">
          {error}
        </p>
      )}

      {/* Output */}
      {renderOutput()}
    </main>
  );
}
