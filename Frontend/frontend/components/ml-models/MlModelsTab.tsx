"use client";

import { useEffect, useState } from "react";
import { Bar, Doughnut, Line, Radar } from "react-chartjs-2";

import api from "../../lib/api";
import Loading from "../shared/Loading";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import ChartCard from "../shared/ChartCard";
import SectionTitle from "../shared/SectionTitle";

type Metrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
};

type FeatureImportance = {
  labels: string[];
  values: number[];
};

type ModelResult = {
  metrics: Metrics;
  feature_importances?: FeatureImportance | null;
};

type ModelsResponse = {
  models: Record<string, Record<string, ModelResult>>;
  ds_names: string[];
  ds_labels: string[];
  best_model?: {
    name: string;
    dataset: string;
    dataset_label: string;
    display_name: string;
    roc_auc: number;
    metrics: Metrics;
    hyperparameters: {
      learning_rate: number;
      max_depth: number;
      n_estimators: number;
    };
  };
};

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

const baseFeatures = [
  { label: "Contract", value: 7.0 },
  { label: "Satisfaction Score", value: 6.5 },
  { label: "Tenure in Months", value: 5.5 },
  { label: "Monthly Charge", value: 5.0 },
  { label: "Internet Type", value: 4.5 },
  { label: "Payment Delay", value: 4.0 },
  { label: "Complaint Frequency", value: 3.5 },
  { label: "Complaint Resolution", value: 3.0 },
  { label: "Dropped Calls", value: 2.5 },
  { label: "Packet Loss", value: 2.5 },
  { label: "SIM Inactive Pattern", value: 2.0 },
  { label: "Offer", value: 2.0 },
  { label: "Number of Referrals", value: 1.5 },
  { label: "Online Security", value: 0.75 },
  { label: "Premium Tech Support", value: 0.75 },
  { label: "Latency", value: 1.0 },
  { label: "Jitter", value: 1.0 },
  { label: "Signal Strength", value: 1.0 },
  { label: "Throughput", value: 1.0 },
  { label: "Payment Method", value: 1.0 },
  { label: "Avg Monthly GB Download", value: 1.0 },
  { label: "Gender", value: 0.5 },
  { label: "Married", value: 0.5 },
  { label: "Age", value: 0.5 },
  { label: "Dependents", value: 0.5 },
  { label: "Senior Citizen", value: 0.5 },
  { label: "Number of Dependents", value: 0.5 },
  { label: "Phone Service", value: 0.5 },
  { label: "Multiple Lines", value: 0.5 },
  { label: "Internet Service", value: 0.5 },
  { label: "Online Backup", value: 0.5 },
  { label: "Device Protection Plan", value: 0.5 },
  { label: "Streaming TV", value: 0.5 },
  { label: "Streaming Movies", value: 0.5 },
  { label: "Streaming Music", value: 0.5 },
  { label: "Unlimited Data", value: 0.5 },
  { label: "Paperless Billing", value: 0.5 },
  { label: "Device Capability", value: 0.5 },
];

const feFeatures = [
  { label: "Contract Risk Score", value: 6.0 },
  { label: "Complaint Severity Index", value: 5.5 },
  { label: "Network Quality Score", value: 5.0 },
  { label: "Value-to-Spend Ratio", value: 4.5 },
  { label: "Loyalty Score", value: 4.0 },
  { label: "Charge Deviation", value: 3.5 },
  { label: "SIM Inactivity Flag", value: 3.0 },
  { label: "Payment Delay Flag", value: 2.5 },
  { label: "Call Quality Score", value: 2.0 },
  { label: "Service Count", value: 1.5 },
  { label: "Tenure Group", value: 1.0 },
  { label: "Age Group", value: 0.5 },
  { label: "Internet Heavy User Flag", value: 0.25 },
  { label: "Long Distance Dependency", value: 0.25 },
  { label: "Refund Rate", value: 0.25 },
  { label: "Add-on Revenue Share", value: 0.25 },
  { label: "Avg Monthly Spend", value: 0.25 },
  { label: "Premium Tier Flag", value: 0.25 },
];

const baseFeaturesData = {
  labels: baseFeatures.map((feature) => feature.label),
  values: baseFeatures.map((feature) => feature.value),
};

const feFeaturesData = {
  labels: feFeatures.map((feature) => feature.label),
  values: feFeatures.map((feature) => feature.value),
};

const baseTotal = Number(baseFeatures.reduce((sum, feature) => sum + feature.value, 0).toFixed(2));
const feTotal = Number(feFeatures.reduce((sum, feature) => sum + feature.value, 0).toFixed(2));
const totalImportance = baseTotal + feTotal;

const baseVsFeData = {
  labels: ["Base Features", "Engineered Features"],
  values: [
    Number(((baseTotal / totalImportance) * 100).toFixed(1)),
    Number(((feTotal / totalImportance) * 100).toFixed(1)),
  ],
  colors: [COLORS.blue, COLORS.cyan]
};

const baseChartHeight = Math.max(560, baseFeaturesData.labels.length * 18);
const feChartHeight = Math.max(520, feFeaturesData.labels.length * 20);
const radarPalette = [
  {
    borderColor: "#3b82f6",
    backgroundColor: "rgba(59,130,246,0.28)",
    pointBackgroundColor: "#3b82f6",
  },
  {
    borderColor: "#10b981",
    backgroundColor: "rgba(16,185,129,0.22)",
    pointBackgroundColor: "#10b981",
  },
  {
    borderColor: "#a855f7",
    backgroundColor: "rgba(168,85,247,0.2)",
    pointBackgroundColor: "#a855f7",
  },
  {
    borderColor: "#f59e0b",
    backgroundColor: "rgba(245,158,11,0.2)",
    pointBackgroundColor: "#f59e0b",
  },
];
const horizontalBarOptions: any = {
  ...defaultOptions,
  indexAxis: 'y',
  maintainAspectRatio: false,
  plugins: { ...defaultOptions.plugins, legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: "rgba(148,163,184,0.3)", lineWidth: 1 },
      ticks: { stepSize: 1, color: COLORS.textColor },
    },
    y: {
      grid: { display: false },
      ticks: { autoSkip: false, font: { size: 10 }, color: COLORS.textColor },
    },
  },
};

export default function MlModelsTab() {
  const [data, setData] = useState<ModelsResponse | null>(null);

  useEffect(() => {
    api.get("/models").then((response) => setData(response.data)).catch(console.error);
  }, []);

  if (!data) {
    return <Loading message="Querying AI Model Intelligence..." />;
  }

  if (!data.ds_names.length) {
    return <div className="dashboard-content text-muted">No model results available.</div>;
  }

  const activeDs = data.best_model?.dataset && data.models[data.best_model.dataset] ? data.best_model.dataset : data.ds_names[0];
  const dsModels = data.models[activeDs] || {};
  const modelNames = Object.keys(dsModels).sort((left, right) => dsModels[right].metrics.roc_auc - dsModels[left].metrics.roc_auc);
  const computedBestModelName =
    modelNames.reduce<string | null>((best, modelName) => {
      if (!best) {
        return modelName;
      }

      return dsModels[modelName].metrics.roc_auc > dsModels[best].metrics.roc_auc ? modelName : best;
    }, null) ?? "";
  const bestModelName = data.best_model?.dataset === activeDs ? data.best_model.name : computedBestModelName;
  const bestModel = bestModelName ? dsModels[bestModelName] : null;
  const tableRows = modelNames.map((modelName) => ({
    modelName,
    result: dsModels[modelName],
  }));
  const bestMetrics = data.best_model?.metrics ?? bestModel?.metrics ?? null;
  const radarModelNames = modelNames.slice(0, 4);
  const radarMetricLabels = ["Accuracy", "Precision", "Recall", "F1 Score", "ROC-AUC"];
  const radarData = {
    labels: radarMetricLabels,
    datasets: radarModelNames.map((modelName, index) => {
      const colors = radarPalette[index % radarPalette.length];
      const metrics = dsModels[modelName].metrics;

      return {
        label: modelName,
        data: [metrics.accuracy, metrics.precision, metrics.recall, metrics.f1, metrics.roc_auc],
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        pointBackgroundColor: colors.pointBackgroundColor,
        pointBorderColor: "#ffffff",
        pointHoverBackgroundColor: "#ffffff",
        pointHoverBorderColor: colors.borderColor,
        borderWidth: 2,
        fill: true,
      };
    }),
  };

  return (
    <div className="dashboard-content">
      <SectionTitle title="ML Model Comparison" description="Performance across Models and algorithms" color="purple" />

      <div className="panel-grid panel-grid--4 mb-6">
        <div className="card">
          <div className="card__header">
            <div className="card__title">Best Model</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-green)" }}>{data.best_model?.display_name || "N/A"}</div>
          <div className="text-muted" style={{ marginTop: 6 }}>
            {data.best_model ? `${data.best_model.dataset_label}` : "No summary available"}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div className="card__title">Max Depth</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-cyan)" }}>{data.best_model?.hyperparameters.max_depth ?? "N/A"}</div>
          <div className="text-muted" style={{ marginTop: 6 }}>
            Tree depth
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div className="card__title">ROC-AUC</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-cyan)" }}>{data.best_model ? formatPercent(data.best_model.roc_auc) : "N/A"}</div>
          <div className="text-muted" style={{ marginTop: 6 }}>
            Production model score
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div className="card__title">Estimators</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-cyan)" }}>{data.best_model?.hyperparameters.n_estimators ?? "N/A"}</div>
          <div className="text-muted" style={{ marginTop: 6 }}>
            Boosting rounds
          </div>
        </div>
      </div>

      {/* Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 24, marginBottom: 24, marginTop: 24 }} className="max-lg:grid-cols-1 max-lg:flex max-lg:flex-col">
        <div style={{ gridColumn: "span 8" }}>
          <ChartCard title="ROC-AUC Comparison" height={320}>
            <Line
              data={{
                labels: modelNames,
                datasets: [
                  {
                    label: "ROC-AUC %",
                    data: modelNames.map((modelName) => dsModels[modelName].metrics.roc_auc),
                    borderColor: COLORS.blue,
                    backgroundColor: COLORS.blueAlpha,
                    fill: true,
                    tension: 0.3,
                    pointRadius: modelNames.map((modelName) => (modelName === bestModelName ? 6 : 4)),
                    pointHoverRadius: modelNames.map((modelName) => (modelName === bestModelName ? 7 : 5)),
                    pointBackgroundColor: modelNames.map((modelName) => (modelName === bestModelName ? COLORS.green : COLORS.blue)),
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={{
                ...defaultOptions,
                plugins: { ...defaultOptions.plugins, legend: { display: false } },
              }}
            />
          </ChartCard>
        </div>
        <div style={{ gridColumn: "span 4" }}>
          <ChartCard title="Model Accuracy Comparison" height={320}>
            <Line
              data={{
                labels: modelNames,
                datasets: [
                  {
                    label: "Accuracy %",
                    data: modelNames.map((modelName) => dsModels[modelName].metrics.accuracy),
                    borderColor: COLORS.green,
                    backgroundColor: COLORS.greenAlpha,
                    fill: true,
                    tension: 0.25,
                    pointBackgroundColor: COLORS.green,
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    pointRadius: 4,
                  },
                ],
              }}
              options={{
                ...defaultOptions,
                plugins: { ...defaultOptions.plugins, legend: { display: false } },
              }}
            />
          </ChartCard>
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 24, marginBottom: 24 }} className="max-lg:grid-cols-1 max-lg:flex max-lg:flex-col">
        <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", gap: 24 }}>
          <ChartCard title="Model Fingerprint Comparison" height={460}>
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  ...defaultOptions.plugins,
                  legend: {
                    position: "bottom",
                    labels: {
                      color: COLORS.textColor,
                      font: { size: 12 },
                      usePointStyle: true,
                      boxWidth: 10,
                      padding: 16,
                    },
                  },
                },
                scales: {
                  r: {
                    min: 0,
                    max: 100,
                    ticks: {
                      stepSize: 20,
                      color: COLORS.textColor,
                      backdropColor: "transparent",
                      showLabelBackdrop: false,
                    },
                    angleLines: { color: COLORS.gridColor },
                    grid: { color: COLORS.gridColor },
                    pointLabels: {
                      color: COLORS.textColor,
                      font: { size: 12 },
                    },
                  },
                },
                elements: {
                  line: { tension: 0.15 },
                },
              }}
            />
          </ChartCard>

          <div className="card" style={{ overflowX: "auto" }}>
            <div className="card__header">
              <div className="card__title">Full Model Metrics</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1</th>
                  <th>ROC-AUC</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(({ modelName, result }) => {
                  const isSelectedBest = modelName === bestModelName;

                  return (
                    <tr key={modelName} style={isSelectedBest ? { background: "rgba(16,185,129,0.05)" } : {}}>
                      <td style={{ fontWeight: 600 }}>
                        {modelName} {isSelectedBest && <span style={{ color: "var(--accent-green)", fontSize: 11 }}>Best Model</span>}
                      </td>
                      <td>{formatPercent(result.metrics.accuracy)}</td>
                      <td>{formatPercent(result.metrics.precision)}</td>
                      <td>{formatPercent(result.metrics.recall)}</td>
                      <td>{formatPercent(result.metrics.f1)}</td>
                      <td style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>{formatPercent(result.metrics.roc_auc)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: 24 }}>
          <ChartCard title="Feature Importance Share (Base vs Engineered)" height={320}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", padding: "20px" }}>
              <div style={{ width: "240px" }}>
                <Doughnut
                  data={{
                    labels: baseVsFeData.labels,
                    datasets: [{
                      data: baseVsFeData.values,
                      backgroundColor: baseVsFeData.colors,
                      hoverOffset: 4,
                      borderWidth: 0,
                    }],
                  }}
                  options={{
                    cutout: "75%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { padding: 16, color: "#475569", font: { family: "'Inter', sans-serif", weight: "bold", size: 12 } }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) { return ` ${context.label}: ${context.raw}%`; }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </ChartCard>

          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="card__header">
              <div className="card__title">Insights Card</div>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Leading Model</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-green)" }}>{data.best_model?.display_name || bestModelName || "N/A"}</div>
              </div>
              {/* <div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Winning Dataset</div>
                <div style={{ fontWeight: 600 }}>{data.best_model?.dataset_label || activeDs}</div>
              </div> */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <div style={{ padding: 12, borderRadius: 12, background: "rgba(21,101,192,0.08)" }}>
                  <div className="text-muted" style={{ fontSize: 11 }}>Accuracy</div>
                  <div style={{ fontWeight: 700, color: COLORS.blue }}>{bestMetrics ? formatPercent(bestMetrics.accuracy) : "N/A"}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 12, background: "rgba(16,163,74,0.08)" }}>
                  <div className="text-muted" style={{ fontSize: 11 }}>F1 Score</div>
                  <div style={{ fontWeight: 700, color: COLORS.green }}>{bestMetrics ? formatPercent(bestMetrics.f1) : "N/A"}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 12, background: "rgba(8,145,178,0.08)" }}>
                  <div className="text-muted" style={{ fontSize: 11 }}>Precision</div>
                  <div style={{ fontWeight: 700, color: COLORS.cyan }}>{bestMetrics ? formatPercent(bestMetrics.precision) : "N/A"}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 12, background: "rgba(124,58,237,0.08)" }}>
                  <div className="text-muted" style={{ fontSize: 11 }}>Recall</div>
                  <div style={{ fontWeight: 700, color: COLORS.purple }}>{bestMetrics ? formatPercent(bestMetrics.recall) : "N/A"}</div>
                </div>
              </div>
              <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                Best ROC-AUC is <span style={{ fontWeight: 700, color: COLORS.cyan }}>{bestMetrics ? formatPercent(bestMetrics.roc_auc) : "N/A"}</span>, with {data.best_model?.hyperparameters.max_depth ?? "N/A"} depth and {data.best_model?.hyperparameters.n_estimators ?? "N/A"} estimators.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <SectionTitle title="Feature Intelligence" description="Base and engineered feature importance overview" color="blue" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }} className="max-lg:grid-cols-1">
        <ChartCard title="Base Features" height={baseChartHeight}>
          <Bar
            data={{
              labels: baseFeaturesData.labels,
              datasets: [{
                label: "Importance %",
                data: baseFeaturesData.values,
                backgroundColor: "#4a78bd",
                borderColor: COLORS.blue,
                borderWidth: 1,
                borderRadius: 0,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
              }],
            }}
            options={horizontalBarOptions}
          />
        </ChartCard>

        <ChartCard title="Engineered Features" height={feChartHeight}>
          <Bar
            data={{
              labels: feFeaturesData.labels,
              datasets: [{
                label: "Importance %",
                data: feFeaturesData.values,
                backgroundColor: "#4a78bd",
                borderColor: COLORS.cyan,
                borderWidth: 1,
                borderRadius: 0,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
              }],
            }}
            options={horizontalBarOptions}
          />
        </ChartCard>
      </div>
    </div>
  );
}
