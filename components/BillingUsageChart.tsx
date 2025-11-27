"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function BillingUsageChart({ usage }) {
  const labels = usage.map(u => u.period);
  const values = usage.map(u => u.amount);

  const data = {
    labels,
    datasets: [
      {
        label: "Resource Usage (Units)",
        data: values,
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
      <h2 className="text-xl font-semibold text-white mb-4">Usage Overview</h2>
      <Bar data={data} />
    </div>
  );
}
