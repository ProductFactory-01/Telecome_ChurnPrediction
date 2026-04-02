"use client";
import { Line, Bar } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import ChartCard from "../shared/ChartCard";

interface Props {
  churnTrend: { labels: string[]; without_ai: number[]; with_ai: number[] };
  agentActivity: { labels: string[]; tasks_completed: number[] };
}

export default function OverviewCharts({ churnTrend, agentActivity }: Props) {
  const trendData = {
    labels: churnTrend.labels,
    datasets: [
      {
        label: "Without AI",
        data: churnTrend.without_ai,
        borderColor: COLORS.red,
        backgroundColor: "rgba(239,68,68,0.1)",
        borderDash: [6, 3],
        tension: 0.3,
        fill: false,
      },
      {
        label: "With AI Pipeline",
        data: churnTrend.with_ai,
        borderColor: COLORS.green,
        backgroundColor: "rgba(16,185,129,0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const actData = {
    labels: agentActivity.labels,
    datasets: [
      {
        label: "Tasks Completed",
        data: agentActivity.tasks_completed,
        backgroundColor: [COLORS.blueAlpha, COLORS.amberAlpha, COLORS.greenAlpha, COLORS.purpleAlpha],
        borderColor: [COLORS.blue, COLORS.amber, COLORS.green, COLORS.purple],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="panel-grid panel-grid--2">
      <ChartCard title="Projected Churn Trend" icon="📉">
        <Line data={trendData} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { ...defaultOptions.plugins.legend, position: "top" as const } } }} />
      </ChartCard>
      <ChartCard title="Agent Activity" icon="⚡">
        <Bar data={actData} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
      </ChartCard>
    </div>
  );
}
