"use client";

import React from "react";

/**
 * Reusable UI tile for billing/statistics.
 * Used in:
 *  - Billing page
 *  - Usage analytics
 *  - Admin dashboards
 */

export default function BillingTile({
  label,
  value,
  loading = false,
  icon,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{label}</p>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>

      {loading ? (
        <div className="h-7 w-20 rounded bg-neutral-800 animate-pulse"></div>
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </div>
  );
}
