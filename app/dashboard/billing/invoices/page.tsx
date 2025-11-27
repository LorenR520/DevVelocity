"use client";

import { useEffect, useState } from "react";

export default function BillingInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/billing/invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-300 py-20">
        Loading invoices...
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-8">Invoices</h1>

      <div className="space-y-4">
        {invoices.length === 0 && (
          <p className="text-gray-400">No invoices yet.</p>
        )}

        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="p-4 bg-neutral-900 rounded-lg border border-neutral-800"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {inv.provider === "stripe" ? "Stripe" : "Lemon Squeezy"}
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(inv.date).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold">
                  ${inv.amount} {inv.currency}
                </p>
                {inv.pdf && (
                  <a
                    href={inv.pdf}
                    className="text-blue-400 underline text-sm"
                    target="_blank"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
