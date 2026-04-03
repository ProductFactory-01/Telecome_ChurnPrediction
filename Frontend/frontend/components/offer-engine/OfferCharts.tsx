"use client";
import { Bar } from "react-chartjs-2";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import styles from "./OfferEngine.module.css";

export default function OfferCharts() {
  const effectivenessData = {
    labels: ["Discount", "Upgrade", "Loyalty Pts", "Gamification", "Bundle"],
    datasets: [
      {
        label: "Acceptance %",
        data: [18, 14, 16, 22, 12],
        backgroundColor: [
          COLORS.green,
          COLORS.blue,
          COLORS.amber,
          COLORS.purple,
          COLORS.cyan,
        ],
        borderRadius: 6,
      },
    ],
  };

  const riskAcceptanceData = {
    labels: ["Level 5", "Level 4", "Level 3", "Level 2", "Level 1"],
    datasets: [
      {
        label: "Generic",
        data: [5, 7, 9, 11, 13],
        backgroundColor: "rgba(239, 68, 68, 0.46)", // COLORS.redAlpha-ish
        borderRadius: 4,
      },
      {
        label: "AI Personalised",
        data: [10, 14, 19, 24, 29],
        backgroundColor: COLORS.green,
        borderRadius: 4,
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
                  title: { display: true, text: "Acceptance Rate %" },
                },
              },
            }}
          />
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3>Acceptance Rate by Churn Risk Level</h3>
        <div className={styles.chartWrap}>
          <Bar
            data={riskAcceptanceData}
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
                  title: { display: true, text: "Acceptance Rate %" },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
