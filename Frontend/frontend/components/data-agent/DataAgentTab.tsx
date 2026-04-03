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
import UploadWizard from "./UploadWizard";

import Loading from "../shared/Loading";

interface Source {
  key: string; icon: string; title: string; description: string; records: number; completeness: number; active: boolean;
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

  if (!data) return (
    <div className="dashboard-content min-h-[400px] flex items-center justify-center">
      <Loading message="Synchronizing Data Source Intelligence..." />
    </div>
  );

  const k = data.kpis;
  const activeCount = sources.filter((s) => s.active).length;
  const totalRecords = sources.filter((s) => s.active).reduce((sum, s) => sum + s.records, 0);

  return (
    <div className="dashboard-content">
      <AgentHeader
        number="1"
        title="Customer360 Data Agent"
        subtitle="Unify demographics, location, services, and AI scoring into a single subscriber intelligence view"
        color="blue"
        statusLabel="Active"
        statusType="active"
      />

      <SectionTitle title="Connected Data Sources" color="blue" />

      <div className="panel-grid panel-grid--6 mb-6">
        {sources.map((s) => (
          <div key={s.key} className={`source-card ${s.active ? "source-card--active" : ""}`} onClick={() => toggleSource(s.key)}>
            {s.active && <div className="source-card__check">✓</div>}
            <div className="source-card__icon">{s.icon}</div>
            <div className="source-card__title">{s.title}</div>
            <div className="source-card__desc">{s.description}</div>
            <div className="source-card__records">{s.records.toLocaleString()} records</div>
            <div className="mt-2 text-xs font-semibold text-blue-600">{s.completeness}% Complete</div>
          </div>
        ))}
      </div>

      <SectionTitle title="AI Subscriber Ingestion Pipeline" color="purple" />
      <div className="mb-8">
        <UploadWizard />
      </div>

      <div className="panel-grid panel-grid--4 mb-6">
        <KpiCard label="Sources Connected" value={activeCount} color="green" />
        <KpiCard label="Total Source Records" value={totalRecords.toLocaleString()} color="blue" />
        <KpiCard label="Merge Completeness" value={`${k.merge_completeness}%`} color="amber" />
        <KpiCard label="Unique Subscribers" value={k.unique_subscribers.toLocaleString()} color="purple" />
      </div>

      <div className="panel-grid panel-grid--2">
        <ChartCard title="Source Data Distribution" icon="📊">
          <Doughnut data={{
            labels: sources.map(s => s.title),
            datasets: [{
              data: sources.map(s => s.records),
              backgroundColor: [COLORS.blue, COLORS.cyan, COLORS.green, COLORS.amber, COLORS.purple, COLORS.red],
              borderWidth: 2,
              borderColor: "#ffffff",
            }],
          }} options={{ ...defaultOptions, scales: undefined }} />
        </ChartCard>
        <ChartCard title="Data Quality by Source" icon="📋">
          <Bar data={{
            labels: sources.map(s => s.title),
            datasets: [{
              label: "Completeness %",
              data: sources.map(s => s.completeness),
              backgroundColor: sources.map(s => s.active ? COLORS.blueAlpha : "rgba(203,213,225,0.3)"),
              borderColor: COLORS.blue,
              borderWidth: 1,
              borderRadius: 6,
            }],
          }} options={{ 
            ...defaultOptions, 
            indexAxis: 'y' as const,
            plugins: { ...defaultOptions.plugins, legend: { display: false } },
            scales: {
                x: { min: 0, max: 100, title: { display: true, text: "Completeness Percentage" } }
            }
          }} />
        </ChartCard>
      </div>
    </div>
  );
}
