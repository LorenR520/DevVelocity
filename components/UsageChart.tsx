"use client";

import React from "react";

/**
 * Lightweight SVG line chart for usage metrics.
 * Works perfectly on Cloudflare Pages with zero dependencies.
 */

export default function UsageChart({
  data,
  field,
  label,
}: {
  data: any[];
  field: string;
  label: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 text-gray-400">
        No usage data available.
      </div>
    );
  }

  // Extract numeric values
  const values = data.map((d) => d[field] ?? 0);
  const max = Math.max(...values, 10);
  const min = 0;

  // SVG chart dimensions
  const width = 600;
  const height = 160;
  const padding = 20;

  const step = (width - padding * 2) / (values.length - 1);

  // Build line path
  const points = values
    .map((v, i) => {
      const x = padding + i * step;
      const y = height - padding - (v / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
      <h3 className="text-lg font-semibold mb-2">{label}</h3>

      <svg width={width} height={height} className="overflow-visible">
        {/* Background Line */}
        <polyline
          fill="none"
          stroke="#333"
          strokeWidth="1"
          points={`${padding},${height - padding} ${
            width - padding
          },${height - padding}`}
        />

        {/* Data Line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          points={points}
        />

        {/* Dots */}
        {points.split(" ").map((p, i) => {
          const [x, y] = p.split(",");
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill="#3b82f6"
              stroke="#1e40af"
              strokeWidth={1}
            />
          );
        })}
      </svg>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-gray-400 text-xs mt-2">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
