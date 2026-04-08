"use client";
import { Bar, Line } from "react-chartjs-2";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import styles from "./OfferEngine.module.css";

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
    <div className={styles.chartGrid}>
      <div className={styles.chartCard}>
        <h3>Offer Type Effectiveness</h3>
        <div className={styles.chartWrap}>
          <Bar
            data={effectivenessData}
            options={{
              ...defaultOptions,
              plugins: {
                ...defaultOptions.plugins,
                legend: { display: false },
              },
              scales: {
                ...defaultOptions.scales,
                y: {
                  ...defaultOptions.scales?.y,
                  beginAtZero: true,
                  title: { display: true, text: "Count of Offers" },
                },
              },
            }}
          />
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3>Offer Generation Timeline</h3>
        <div className={styles.chartWrap}>
          <Line
            data={timelineData}
            options={{
              ...defaultOptions,
              plugins: {
                ...defaultOptions.plugins,
                legend: { position: "bottom" },
              },
              scales: {
                ...defaultOptions.scales,
                y: {
                  ...defaultOptions.scales?.y,
                  beginAtZero: true,
                  title: { display: true, text: "Customers Bound" },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
