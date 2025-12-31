"use client";
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

export interface StatsPieChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
}

export default function StatsPieChart({ labels, data, colors }: StatsPieChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors || [
          "#4F8AF4",
          "#FA8B60",
          "#F4D35E",
          "#43E97B",
          "#E53935",
          "#adb5bd",
        ],
        borderWidth: 1,
      },
    ],
  };
  return (
    <div className="w-full flex flex-col items-center">
      <Pie data={chartData} options={{ plugins: { legend: { position: "bottom" } } }} />
    </div>
  );
}
