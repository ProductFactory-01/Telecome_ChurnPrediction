"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
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
  CategoryScale, LinearScale, RadialLinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

export const COLORS = {
  blue: "#1565c0",
  cyan: "#0891b2",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#7c3aed",
  blueAlpha: "rgba(21,101,192,0.65)",
  cyanAlpha: "rgba(8,145,178,0.65)",
  greenAlpha: "rgba(22,163,74,0.65)",
  amberAlpha: "rgba(245,158,11,0.65)",
  redAlpha: "rgba(239,68,68,0.65)",
  purpleAlpha: "rgba(124,58,237,0.65)",
  gridColor: "rgba(226,232,240,0.6)",
  textColor: "#64748b",
};

export const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: COLORS.textColor, font: { size: 11 } } },
    tooltip: {
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      titleColor: "#1e293b",
      bodyColor: "#64748b",
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: { grid: { color: COLORS.gridColor }, ticks: { color: COLORS.textColor, font: { size: 11 } } },
    y: { grid: { color: COLORS.gridColor }, ticks: { color: COLORS.textColor, font: { size: 11 } } },
  },
};
