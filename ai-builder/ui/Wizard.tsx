"use client";

import { useState, useEffect } from "react";
import { AI_BUILDER_QUESTIONS, PLAN_CAPS, validateTierInput } from "../schema";
import { buildAIPrompt } from "../prompt";

export default function AIBuildWizard({ userPlan }: { userPlan: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const plan = userPlan ?? "developer";
  const caps = PLAN_CAPS[plan];

  const q = AI_BUILDER_QUESTIONS[step];

  function updateAnswer(id: number, value: any) {
    const next = { ...answers, [id]: value, plan };
    setAnswers(next);

    // auto-validate on every update
    const w = validateTierInput(plan, next);
    setWarnings(w);
  }

  function nextStep() {
    if (step < AI_BUILDER_QUESTIONS.length - 1) setStep(step + 1);
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  // ---------------------------------------------
  // ⭐ Submit to AI endpoint
  // ---------------------------------------------

  async function submit() {
    setSubmitting(true);

    try {
      const prompt = buildAIPrompt(answers);

      const res = await fetch("/api/ai-builder/run", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();
      setResult(json);
    } catch (e) {
      console.error("AI Builder Error:", e);
    }

    setSubmitting(false);
  }

  // ---------------------------------------------
  // ⭐ Render Input Control
  // ---------------------------------------------

  function renderInput(question: any) {
    switch (question.type) {
      case "select":
        return (
          <select
            className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg"
            value={answers[question.id] ?? ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {question.options.map((o: string) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );

      case "multi-select":
        return (
          <div className="space-y-2">
            {question.options.map((o: string) => {
              const set = new Set(answers[question.id] ?? []);
              const checked = set.has(o);

              return (
                <label
                  key={o}
                  className="flex items-center gap-3 bg-neutral-900 p-3 border border-neutral-700 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={checked}
                    onChange={() => {
                      if (checked) set.delete(o);
                      else set.add(o);
                      updateAnswer(question.id, Array.from(set));
                    }}
                  />
                  {o}
                </label>
              );
            })}
          </div>
        );

      case "textarea":
        return (
          <textarea
            className="w-full h-40 p-3 bg-neutral-900 border border-neutral-700 rounded-lg"
            value={answers[question.id] ?? ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
          />
        );

      case "number":
        return (
          <input
            type="number"
            className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg"
            value={answers[question.id] ?? ""}
            onChange={(e) => updateAnswer(question.id, Number(e.target.value))}
            placeholder={question.placeholder}
          />
        );

      default:
        return <div>Unsupported field type</div>;
    }
  }

  // ---------------------------------------------
  // ⭐ Render Completion Screen
  // ---------------------------------------------

  if (result) {
    return (
      <div className="text-white p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Your AI-Generated Architecture</h1>
        <pre className="bg-neutral-900 p-6 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }

  // ---------------------------------------------
  // ⭐ Wizard Step UI
  // ---------------------------------------------

  return (
    <div className="max-w-2xl mx-auto text-white p-8">
      <h1 className="text-3xl font-bold mb-6">AI Builder</h1>

      <div className="mb-6 text-lg font-medium text-blue-300">
        Step {step + 1} / {AI_BUILDER_QUESTIONS.length}
      </div>

      <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-4">{q.label}</h2>
        {renderInput(q)}

        {warnings.length > 0 && (
          <div className="mt-4 bg-yellow-900/40 p-4 rounded-lg border border-yellow-700 text-yellow-300 text-sm space-y-2">
            {warnings.map((w, i) => (
              <p key={i}>⚠️ {w}</p>
            ))}
            <p className="text-yellow-400 font-semibold">
              Upgrade recommended for more capabilities.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        {step > 0 ? (
          <button
            onClick={prevStep}
            className="px-5 py-2 bg-neutral-700 rounded-md"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < AI_BUILDER_QUESTIONS.length - 1 ? (
          <button
            onClick={nextStep}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-md"
          >
            {submitting ? "Generating…" : "Generate Architecture"}
          </button>
        )}
      </div>
    </div>
  );
}
