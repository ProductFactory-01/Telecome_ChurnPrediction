"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import KpiCard from "../shared/KpiCard";
import SectionTitle from "../shared/SectionTitle";
import AgentHeader from "../shared/AgentHeader";
import ChartCard from "../shared/ChartCard";
import { Bar, Doughnut } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

interface Source {
  key: string; icon: string; title: string; description: string; records: number; active: boolean;
}

export default function DataAgentTab() {
  const [data, setData] = useState<any>(null);
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    api.get("/data-agent").then((r) => {
      setData(r.data);
      setSources(r.data.sources);
    }).catch(console.error);
  }, []);

  const toggleSource = (key: string) => {
    setSources((prev) => prev.map((s) => s.key === key ? { ...s, active: !s.active } : s));
  };

  if (!data) return <div className="dashboard-content text-muted">Loading…</div>;

  const k = data.kpis;
  const activeCount = sources.filter((s) => s.active).length;
  const totalRecords = sources.filter((s) => s.active).reduce((sum, s) => sum + s.records, 0);

  return (
    <div className="dashboard-content">
      <AgentHeader
        number="1"
        title="Customer360 Data Agent"
        subtitle="Unify CRM, billing, network quality, social sentiment, and call centre data into a single subscriber intelligence view"
        color="blue"
        statusLabel="Active"
        statusType="active"
      />

      <SectionTitle title="Data Sources — Toggle to Connect" color="blue" />

      <div className="panel-grid panel-grid--6 mb-6">
        {sources.map((s) => (
          <div key={s.key} className={`source-card ${s.active ? "source-card--active" : ""}`} onClick={() => toggleSource(s.key)}>
            {s.active && <div className="source-card__check">✓</div>}
            <div className="source-card__icon">{s.icon}</div>
            <div className="source-card__title">{s.title}</div>
            <div className="source-card__desc">{s.description}</div>
            <div className="source-card__records">{s.records.toLocaleString()} records</div>
          </div>
        ))}
      </div>

      <div className="file-upload mb-6">
        <div className="file-upload__icon">📁</div>
        <div className="file-upload__text"><b>Drag &amp; drop CSV files</b> or click to upload additional data sources</div>
        <div className="file-upload__hint">Supports CRM exports, billing dumps, network logs, NPS data</div>
      </div>

      <div className="panel-grid panel-grid--4 mb-6">
        <KpiCard label="Sources Connected" value={activeCount} color="green" />
        <KpiCard label="Records Unified" value={totalRecords.toLocaleString()} color="blue" />
        <KpiCard label="Merge Completeness" value={`${k.merge_completeness}%`} color="amber" />
        <KpiCard label="Unique Subscribers" value={k.unique_subscribers.toLocaleString()} color="purple" />
      </div>

      <div className="panel-grid panel-grid--2">
        <ChartCard title="Data Source Coverage" icon="📊">
          <Doughnut data={{
            labels: sources.map(s => s.title),
            datasets: [{
              data: sources.map(s => s.records),
              backgroundColor: ["#3b82f6", "#22d3ee", "#f59e0b", "#a855f7", "#10b981", "#ef4444"],
              borderWidth: 2,
              borderColor: "#ffffff",
            }],
          }} options={{ ...defaultOptions, scales: undefined }} />
        </ChartCard>
        <ChartCard title="Records by Source" icon="📋">
          <Bar data={{
            labels: sources.map(s => s.title),
            datasets: [{
              label: "Records",
              data: sources.map(s => s.records),
              backgroundColor: sources.map(s => s.active ? "rgba(59,130,246,0.7)" : "rgba(203,213,225,0.5)"),
              borderRadius: 6,
            }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
      </div>
    </div>
  );
}
