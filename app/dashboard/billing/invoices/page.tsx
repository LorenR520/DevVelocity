"use client";

import { useEffect, useState } from "react";

export default function BillingInvoicesPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/billing/invoices");
      const data = await res.json();

      setEvents(data.events || []);
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
      <h1 className="text-3xl font-bold mb-6">Invoices</h1>

      {events.length === 0 && (
        <p className="text-gray-400">No invoices yet.</p>
      )}

      <div className="space-y-4">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="p-4 bg-neutral-900 rounded-lg border border-neutral-800"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-semibold capitalize">
                  {ev.type.replace(/_/g, " ")}
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(ev.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-green-400">
                  ${Number(ev.amount).toFixed(2)}
                </p>

                <a
                  href={`/api/billing/receipt?id=${ev.id}`}
                  target="_blank"
                  className="text-blue-400 underline text-sm"
                >
                  View Receipt
                </a>
              </div>
            </div>

            {ev.details && (
              <div className="text-gray-400 text-sm mt-3 whitespace-pre-wrap">
                {JSON.stringify(ev.details, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
