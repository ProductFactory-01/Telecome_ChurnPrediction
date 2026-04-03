"use client";
import { Line, Bar } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import ChartCard from "../shared/ChartCard";

interface Props {
  churnTrend: { labels: string[]; without_ai: number[]; with_ai: number[] };
  riskDistribution: { labels: string[]; counts: number[] };
}

export default function OverviewCharts({ churnTrend, riskDistribution }: Props) {
  const trendData = {
    labels: churnTrend.labels,
    datasets: [
      {
        label: "Expected Churn % (Without AI)",
        data: churnTrend.without_ai,
        borderColor: COLORS.red,
        backgroundColor: "rgba(239,68,68,0.1)",
        borderDash: [6, 3],
        tension: 0.4,
        fill: false,
      },
      {
        label: "AI-Predicted Churn %",
        data: churnTrend.with_ai,
        borderColor: COLORS.blue,
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const riskData = {
    labels: riskDistribution.labels,
    datasets: [
      {
        label: "Subscribers",
        data: riskDistribution.counts,
        backgroundColor: [COLORS.greenAlpha, COLORS.amberAlpha, COLORS.redAlpha],
        borderColor: [COLORS.green, COLORS.amber, COLORS.red],
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const trendOptions = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      legend: { position: "top" as const },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      y: { grid: { color: COLORS.gridColor, borderDash: [4, 4] }, title: { display: true, text: "Churn Probability %" } },
      x: { grid: { display: false }, title: { display: true, text: "Tenure Groups" } },
    },
  };

  const riskOptions = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      legend: { display: false },
    },
  };

  return (
    <div className="panel-grid panel-grid--2">
      <ChartCard title="Churn Trajectory by Tenure" icon="📉">
        <Line data={trendData} options={trendOptions} />
      </ChartCard>
      <ChartCard title="Risk Flag Distribution" icon="🚨">
        <Bar data={riskData} options={riskOptions} />
      </ChartCard>
    </div>
  );
}
