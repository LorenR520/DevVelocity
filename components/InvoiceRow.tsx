"use client";

import { useEffect, useState } from "react";

export default function InvoiceRow({ source }: { source: "stripe" | "lemon" }) {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/billing/${source}/invoices`);
      const json = await res.json();
      setInvoices(json || []);
    }
    load();
  }, [source]);

  if (!invoices.length) {
    return (
      <div className="text-gray-400 text-sm mb-4">
        No {source} invoices found.
      </div>
    );
  }

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4 capitalize">{source} Invoices</h2>

      <div className="space-y-3">
        {invoices.map((inv: any) => (
          <div
            key={inv.id}
            className="flex justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-lg"
          >
            <div>
              <p className="text-white font-medium">{inv.description}</p>
              <p className="text-gray-400 text-sm">
                {new Date(inv.date).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <p className="text-white font-semibold">${inv.amount}</p>

              <a
                href={inv.url}
                target="_blank"
                className="text-blue-400 text-sm underline"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
