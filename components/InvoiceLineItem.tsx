"use client";

import React from "react";
import { FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";

type Props = {
  description: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "failed";
};

export default function InvoiceLineItem({ description, amount, date, status }: Props) {
  const statusStyles: Record<string, string> = {
    paid: "text-green-400 bg-green-900/30 border-green-600/40",
    pending: "text-yellow-300 bg-yellow-900/40 border-yellow-700/40",
    failed: "text-red-400 bg-red-900/40 border-red-600/40",
  };

  const statusIcons: Record<string, JSX.Element> = {
    paid: <FiCheckCircle size={16} />,
    pending: <FiClock size={16} />,
    failed: <FiXCircle size={16} />,
  };

  return (
    <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-900/70 transition">
      
      {/* LEFT SIDE — DESCRIPTION + DATE */}
      <div className="flex flex-col">
        <p className="font-medium text-white">{description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(date).toLocaleDateString()}
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6">

        {/* STATUS BADGE */}
        <div
          className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded border ${statusStyles[status]}`}
        >
          {statusIcons[status]}
          <span className="capitalize">{status}</span>
        </div>

        {/* AMOUNT */}
        <p className="text-lg font-semibold text-white">${amount.toFixed(2)}</p>
      </div>
    </div>
  );
}
