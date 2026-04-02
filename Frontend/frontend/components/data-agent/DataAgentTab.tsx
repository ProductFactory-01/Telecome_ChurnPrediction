"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import KpiCard from "../shared/KpiCard";
import SectionTitle from "../shared/SectionTitle";
import AgentHeader from "../shared/AgentHeader";

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
      <AgentHeader icon="📊" title="Agent 1 — Data Ingestion & Unification" subtitle="Consolidates multi-source subscriber data into Customer360 view" color="blue" />

      <div className="panel-grid panel-grid--4 mb-6">
        <KpiCard label="Sources Connected" value={activeCount} color="blue" />
        <KpiCard label="Records Unified" value={totalRecords.toLocaleString()} color="cyan" />
        <KpiCard label="Merge Completeness" value={`${k.merge_completeness}%`} color="green" />
        <KpiCard label="Unique Subscribers" value={k.unique_subscribers.toLocaleString()} color="purple" />
      </div>

      <SectionTitle title="Data Sources" description="Toggle to connect/disconnect sources" color="blue" />

      <div className="panel-grid panel-grid--3 mb-6">
        {sources.map((s) => (
          <div key={s.key} className={`source-card ${s.active ? "source-card--active" : ""}`} onClick={() => toggleSource(s.key)}>
            <div className="source-card__icon">{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="source-card__title">{s.title}</div>
              <div className="source-card__desc">{s.description}</div>
              <div className="source-card__records">{s.records.toLocaleString()} records</div>
            </div>
            <button className={`source-card__toggle ${s.active ? "source-card__toggle--on" : ""}`} onClick={(e) => { e.stopPropagation(); toggleSource(s.key); }} />
          </div>
        ))}
      </div>

      <SectionTitle title="Upload Additional Data" color="cyan" />
      <div className="file-upload">
        <div className="file-upload__icon">📁</div>
        <div className="file-upload__text">Drag &amp; drop files here, or click to browse</div>
        <div className="file-upload__hint">Supports CSV, JSON, XLSX (max 50MB)</div>
      </div>
    </div>
  );
}
