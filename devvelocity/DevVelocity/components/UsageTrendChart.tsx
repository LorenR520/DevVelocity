"use client";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

type Props = {
  months: string[];
  usageData: number[];
  label?: string;
};

export default function UsageTrendChart({ months, usageData, label }: Props) {
  const data = {
    labels: months,
    datasets: [
      {
        label: label ?? "Monthly Usage",
        data: usageData,
        borderColor: "rgba(59,130,246,1)", // blue-500
        backgroundColor: "rgba(59,130,246,0.3)",
        tension: 0.3,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: any = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "white" } },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.parsed.y} credits`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "rgba(200,200,200,0.8)" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: { color: "rgba(200,200,200,0.8)" },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-4">Usage Overview</h3>
      <Line data={data} options={options} />
    </div>
  );
}
