import React from "react";

interface InvoiceProps {
  invoice: {
    id: string;
    provider: string;
    date: string;
    amount: number;
    currency: string;
    pdf?: string;
    description?: string;
  };
}

export default function InvoiceRow({ invoice }: InvoiceProps) {
  return (
    <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold capitalize">
            {invoice.provider === "stripe"
              ? "Stripe"
              : invoice.provider === "lemon"
              ? "Lemon Squeezy"
              : "DevVelocity (Internal)"}
          </p>

          <p className="text-gray-400 text-sm mt-1">
            {new Date(invoice.date).toLocaleDateString()}
          </p>

          {invoice.description && (
            <p className="text-gray-500 text-xs mt-1">{invoice.description}</p>
          )}
        </div>

        <div className="text-right">
          <p className="text-xl font-bold">
            ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
          </p>

          {invoice.pdf && (
            <a
              href={invoice.pdf}
              className="text-blue-400 underline text-sm mt-1 inline-block"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
