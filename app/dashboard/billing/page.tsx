"use client";

import { useState, useEffect } from "react";

// API helpers
async function fetchUsage(plan: string) {
  const res = await fetch("/api/billing/get-usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  return res.json();
}

async function fetchInvoices(plan: string) {
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("dv_token")
    : null;

  const res = await fetch("/api/billing/get-invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });
  return res.json();
}

export default function BillingPage() {
  const [plan, setPlan] = useState("developer");
  const [usage, setUsage] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // ------------------------------------
  // Load billing/usage + invoices
  // ------------------------------------
  useEffect(() => {
    loadUsage();
    loadInvoices();
  }, [plan]);

  async function loadUsage() {
    setLoadingUsage(true);
    const data = await fetchUsage(plan);
    setUsage(data);
    setLoadingUsage(false);
  }

  async function loadInvoices() {
    setLoadingInvoices(true);
    const data = await fetchInvoices(plan);
    setInvoices(data.invoices ?? []);
    setLoadingInvoices(false);
  }

  // ------------------------------------
  // Render Tiles
  // ------------------------------------
  const renderTile = (label: string, value: any) => (
    <div className="p-5 rounded-lg bg-neutral-900 border border-neutral-800">
      <p className="text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );

  return (
    <main className="max-w-5xl mx-auto pt-10 px-6 text-white">

      <h1 className="text-3xl font-bold mb-2">Billing & Usage</h1>
      <p className="text-gray-400 mb-10">
        Track your DevVelocity usage, invoices, and plan details.
      </p>

      {/* ---------------------- PLAN SELECTOR ---------------------- */}
      <div className="mb-10">
        <label className="text-sm text-gray-300 mb-2 block">
          Active Plan
        </label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-lg"
        >
          <option value="developer">Developer</option>
          <option value="startup">Startup</option>
          <option value="team">Team</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* ---------------------- USAGE SECTION ---------------------- */}
      <h2 className="text-xl font-semibold mb-4">Usage Summary</h2>

      {loadingUsage ? (
        <p className="text-gray-400">Loading usage…</p>
      ) : plan === "developer" ? (
        <p className="text-yellow-400 p-4 bg-neutral-900 rounded-lg border border-neutral-700">
          Developer plan has no billing usage — upgrade for deployments, files, and pipelines.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {renderTile("AI Builder Runs", usage.totalPipelines ?? 0)}
          {renderTile("Provider API Calls", usage.totalApiCalls ?? 0)}
          {renderTile("Build Minutes", usage.totalMinutes ?? 0)}
        </div>
      )}

      {/* ---------------------- INVOICE SECTION ---------------------- */}
      <h2 className="text-xl font-semibold mb-4">Invoices</h2>

      {loadingInvoices ? (
        <p className="text-gray-400">Loading invoices…</p>
      ) : plan === "developer" ? (
        <p className="text-yellow-400 p-4 bg-neutral-900 rounded-lg border border-neutral-700">
          Developer plan has no invoices. Upgrade to unlock full billing portal access.
        </p>
      ) : invoices.length === 0 ? (
        <p className="text-gray-400">No invoices found.</p>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv: any) => (
            <div
              key={inv.id}
              className="p-5 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold">{inv.invoice_number}</p>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    inv.status === "paid"
                      ? "bg-green-600/40 text-green-300"
                      : "bg-yellow-600/40 text-yellow-300"
                  }`}
                >
                  {inv.status}
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-2">
                {new Date(inv.created_at).toLocaleDateString()}
              </p>

              <p className="text-lg font-bold">
                ${(inv.amount / 100).toFixed(2)}
              </p>

              {inv.pdf_url && (
                <a
                  href={inv.pdf_url}
                  target="_blank"
                  className="text-blue-400 hover:underline text-sm mt-2 inline-block"
                >
                  View PDF →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
