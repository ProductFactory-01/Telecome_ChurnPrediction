import { Bar, Line } from "react-chartjs-2";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import ChartCard from "../shared/ChartCard";

interface ChartData {
  effectiveness: { label: string; value: number }[];
  timeline: { date: string; count: number }[];
}

export default function OfferCharts({ data }: { data?: ChartData }) {
  const filteredEffectiveness = data?.effectiveness?.filter(
    (item) => item.label !== "Gamification" && item.label !== "Test Offer"
  );

  const effectivenessData = {
    labels: filteredEffectiveness?.map(item => item.label) || ["Discount", "Upgrade", "Loyalty Pts", "Bundle"],
    datasets: [
      {
        label: "Offer Count",
        data: filteredEffectiveness?.map(item => item.value) || [18, 14, 16, 12],
        backgroundColor: [
          COLORS.green,
          COLORS.blue,
          COLORS.amber,
          COLORS.cyan,
        ],
        borderRadius: 6,
      },
    ],
  };

  const timelineData = {
    labels: data?.timeline?.map(item => item.date) || ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
    datasets: [
      {
        label: "Customers Reached",
        data: data?.timeline?.map(item => item.count) || [10, 14, 19, 24, 29],
        backgroundColor: COLORS.greenAlpha || "rgba(75, 192, 192, 0.2)",
        borderColor: COLORS.green,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ChartCard title="Offer Type Effectiveness" icon="📊" height={350}>
        <Bar
          data={effectivenessData}
          options={{
            ...defaultOptions,
            maintainAspectRatio: false,
            plugins: {
              ...defaultOptions.plugins,
              legend: { display: false },
            },
            scales: {
              ...defaultOptions.scales,
              y: {
                ...defaultOptions.scales?.y,
                beginAtZero: true,
              },
            },
          }}
        />
      </ChartCard>

      <ChartCard title="Offer Generation Timeline" icon="📉" height={350}>
        <Line
          data={timelineData}
          options={{
            ...defaultOptions,
            maintainAspectRatio: false,
            plugins: {
              ...defaultOptions.plugins,
              legend: { position: "bottom" },
            },
            scales: {
              ...defaultOptions.scales,
              y: {
                ...defaultOptions.scales?.y,
                beginAtZero: true,
              },
            },
          }}
        />
      </ChartCard>
    </div>
  );
}
