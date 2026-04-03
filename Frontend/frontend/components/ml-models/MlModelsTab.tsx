"use client";

import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";

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

  return (
    <div className="dashboard-content">
      <SectionTitle title="ML Model Comparison" description="Performance across datasets and algorithms" color="purple" />

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

      <div className="card mb-6" style={{ overflowX: "auto", marginTop: 24 }}>
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

      <div className="panel-grid panel-grid--2">
        <ChartCard title="Top 15 Feature Importances (Best Model)" height={420}>
          {bestModel?.feature_importances ? (
            <Bar
              data={{
                labels: bestModel.feature_importances.labels,
                datasets: [
                  {
                    label: "Importance",
                    data: bestModel.feature_importances.values,
                    backgroundColor: COLORS.cyanAlpha,
                    borderColor: COLORS.cyan,
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                ...defaultOptions,
                indexAxis: "y" as const,
                plugins: { ...defaultOptions.plugins, legend: { display: false } },
              }}
            />
          ) : (
            <div className="text-muted">Feature importance data is not available for this model.</div>
          )}
        </ChartCard>

        <ChartCard title="Model Accuracy Comparison" height={420}>
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
  );
}
