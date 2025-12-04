"use client";

interface UsageEntry {
  date: string;
  pipelines_run?: number;
  provider_api_calls?: number;
  build_minutes?: number;
}

interface Props {
  data: UsageEntry[];
  field: "pipelines_run" | "provider_api_calls" | "build_minutes";
  label: string;
}

/**
 * Pure SVG Line Chart — Cloudflare Pages Compatible
 * No external libraries. Very lightweight.
 */
export default function UsageChart({ data, field, label }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl text-gray-400">
        No usage yet.
      </div>
    );
  }

  // Extract values
  const values = data.map((d) => d[field] || 0);

  const max = Math.max(...values);
  const min = 0;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 300; // width
    const y = 120 - (v / (max || 1)) * 100; // height
    return `${x},${y}`;
  });

  return (
    <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
      <h3 className="font-semibold mb-3">{label}</h3>

      <svg width="100%" height="150" viewBox="0 0 300 150" className="overflow-visible">

        {/* Background grid lines */}
        <line x1="0" y1="20" x2="300" y2="20" stroke="#333" strokeWidth="1" />
        <line x1="0" y1="60" x2="300" y2="60" stroke="#333" strokeWidth="1" />
        <line x1="0" y1="100" x2="300" y2="100" stroke="#333" strokeWidth="1" />

        {/* Main Line */}
        <polyline
          fill="none"
          stroke="#4dabf7"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.join(" ")}
        />

        {/* Points */}
        {points.map((p, i) => {
          const [cx, cy] = p.split(",").map(Number);
          return (
            <circle key={i} cx={cx} cy={cy} r="3" fill="#4dabf7" />
          );
        })}
      </svg>

      {/* Stats */}
      <div className="flex justify-between text-xs text-gray-400 mt-3">
        <span>Min: {min}</span>
        <span>Max: {max}</span>
      </div>
    </div>
  );
}
