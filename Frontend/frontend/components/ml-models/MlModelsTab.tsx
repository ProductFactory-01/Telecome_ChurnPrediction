"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import SectionTitle from "../shared/SectionTitle";
import ChartCard from "../shared/ChartCard";
import { Bar, Line } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

export default function MlModelsTab() {
  const [data, setData] = useState<any>(null);
  const [selectedDs, setSelectedDs] = useState("multi_table");

  useEffect(() => {
    api.get("/models").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <div className="dashboard-content text-muted">Loading…</div>;

  const dsModels = data.models[selectedDs] || {};
  const modelNames = Object.keys(dsModels);

  const bestModel = modelNames.reduce((best, name) => {
    const m = dsModels[name];
    return m.metrics.roc_auc > (dsModels[best]?.metrics?.roc_auc || 0) ? name : best;
  }, modelNames[0]);

  return (
    <div className="dashboard-content">
      <SectionTitle title="ML Model Comparison" description="Performance across datasets and algorithms" color="purple" />

      <div className="sub-tabs mb-6">
        {data.ds_names.map((ds: string, i: number) => (
          <button key={ds} className={`sub-tabs__btn ${selectedDs === ds ? "sub-tabs__btn--active" : ""}`} onClick={() => setSelectedDs(ds)}>
            {data.ds_labels[i]}
          </button>
        ))}
      </div>

      <div className="card mb-6" style={{ overflowX: "auto" }}>
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
            {modelNames.map((name) => {
              const m = dsModels[name].metrics;
              return (
                <tr key={name} style={name === bestModel ? { background: "rgba(16,185,129,0.05)" } : {}}>
                  <td style={{ fontWeight: 600 }}>
                    {name} {name === bestModel && <span style={{ color: "var(--accent-green)", fontSize: 11 }}>★ Best</span>}
                  </td>
                  <td>{m.accuracy}%</td>
                  <td>{m.precision}%</td>
                  <td>{m.recall}%</td>
                  <td>{m.f1}%</td>
                  <td style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>{m.roc_auc}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="panel-grid panel-grid--2">
        <ChartCard title="ROC-AUC Comparison" icon="📊">
          <Bar data={{
            labels: modelNames,
            datasets: [{
              label: "ROC-AUC %",
              data: modelNames.map((n) => dsModels[n].metrics.roc_auc),
              backgroundColor: [COLORS.blueAlpha, COLORS.amberAlpha, COLORS.greenAlpha],
              borderColor: [COLORS.blue, COLORS.amber, COLORS.green],
              borderWidth: 1,
              borderRadius: 6,
            }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>

        {dsModels[bestModel]?.feature_importances && (
          <ChartCard title={`Feature Importance — ${bestModel}`} icon="🔬">
            <Bar data={{
              labels: dsModels[bestModel].feature_importances.labels,
              datasets: [{
                label: "Importance",
                data: dsModels[bestModel].feature_importances.values,
                backgroundColor: COLORS.cyanAlpha,
                borderColor: COLORS.cyan,
                borderWidth: 1,
                borderRadius: 4,
              }],
            }} options={{ ...defaultOptions, indexAxis: "y" as const, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
          </ChartCard>
        )}
      </div>
    </div>
  );
}
