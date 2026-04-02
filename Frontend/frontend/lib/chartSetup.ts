"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

export const COLORS = {
  blue: "#3b82f6",
  cyan: "#22d3ee",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#a855f7",
  blueAlpha: "rgba(59,130,246,0.6)",
  cyanAlpha: "rgba(34,211,238,0.6)",
  greenAlpha: "rgba(16,185,129,0.6)",
  amberAlpha: "rgba(245,158,11,0.6)",
  redAlpha: "rgba(239,68,68,0.6)",
  purpleAlpha: "rgba(168,85,247,0.6)",
  gridColor: "rgba(26,48,80,0.3)",
  textColor: "#8899aa",
};

export const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: COLORS.textColor, font: { size: 11 } } },
    tooltip: {
      backgroundColor: "#132036",
      borderColor: "#1a3050",
      borderWidth: 1,
      titleColor: "#e8edf5",
      bodyColor: "#8899aa",
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: { grid: { color: COLORS.gridColor }, ticks: { color: COLORS.textColor, font: { size: 11 } } },
    y: { grid: { color: COLORS.gridColor }, ticks: { color: COLORS.textColor, font: { size: 11 } } },
  },
};
