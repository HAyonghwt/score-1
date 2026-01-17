"use client";
import React from "react";
import { Line, Bar } from "react-chartjs-2";
import { Chart, LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from "chart.js";
Chart.register(LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export interface LineBarChartsProps {
  monthlyData: { labels: string[]; data: number[] };
  byCourseData: { labels: string[]; data: number[] };
  recentRoundsData: { labels: string[]; data: number[] };
}

export default function LineBarCharts({ monthlyData, byCourseData, recentRoundsData }: LineBarChartsProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. 월별 점수 추이 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="font-bold mb-2">월별 점수 추이</div>
        <Line
          data={{
            labels: monthlyData.labels,
            datasets: [
              {
                label: "평균 점수",
                data: monthlyData.data,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.2)",
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: "#2563eb",
              },
            ],
          }}
          options={{
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                displayColors: false,
                padding: 10,
                bodyFont: { size: 14, weight: 'bold' },
                titleFont: { size: 13 }
              }
            },
            elements: {
              point: {
                hitRadius: 20, // 터치 인식 범위 확대
                hoverRadius: 6
              }
            }
          }}
        />
      </div>
      {/* 2. 구장별 평균 점수 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="font-bold mb-2">구장별 평균 점수</div>
        <Bar
          data={{
            labels: byCourseData.labels,
            datasets: [
              {
                label: "평균 점수",
                data: byCourseData.data,
                backgroundColor: "#43e97b",
                borderRadius: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                displayColors: false,
                padding: 10,
                bodyFont: { size: 14, weight: 'bold' }
              }
            },
          }}
        />
      </div>
      {/* 4. 최근 라운드별 점수 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="font-bold mb-2">최근 라운드별 점수</div>
        <Bar
          data={{
            labels: recentRoundsData.labels,
            datasets: [
              {
                label: "점수",
                data: recentRoundsData.data,
                backgroundColor: "#fa8b60",
                borderRadius: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                displayColors: false,
                padding: 10,
                bodyFont: { size: 14, weight: 'bold' }
              }
            },
          }}
        />
      </div>
    </div>
  );
}
