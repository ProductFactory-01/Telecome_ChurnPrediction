"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import KpiCard from "../shared/KpiCard";
import SectionTitle from "../shared/SectionTitle";
import AgentHeader from "../shared/AgentHeader";
import ChartCard from "../shared/ChartCard";
import { Doughnut } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import UploadWizard from "./UploadWizard";
import Loading from "../shared/Loading";

interface Source {
  key: string;
  icon: string;
  title: string;
  description: string;
  records: number;
  completeness: number;
  active: boolean;
}

export default function DataAgentTab() {
  const [data, setData] = useState<any>(null);
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    api.get("/data-agent")
      .then((r) => {
        setData(r.data);
        setSources(r.data.sources);
      })
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="dashboard-content min-h-[400px] flex items-center justify-center">
        <Loading message="Synchronizing Data Sources..." />
      </div>
    );
  }

  const k = data.kpis;
  const activeCount = sources.filter((s) => s.active).length;
  const totalRecords = sources.filter((s) => s.active).reduce((sum, s) => sum + s.records, 0);

  return (
    <div className="dashboard-content">
      <AgentHeader
        number="1"
        title="Customer360 Data Agent"
        subtitle="Unified subscriber intelligence view"
        color="blue"
        statusLabel="Active"
        statusType="active"
      />

      <SectionTitle title="Connected Data Sources" color="blue" />

      <div className="panel-grid panel-grid--5 mb-6">
        {sources.map((s) => (
          <div
            key={s.key}
            className="source-card source-card--active"
            style={{ cursor: "default" }}
          >
            <div className="source-card__icon">{s.icon}</div>
            <div className="source-card__title">{s.title}</div>
            <div className="source-card__desc">{s.description}</div>
            <div className="source-card__records">{s.records.toLocaleString()} records</div>
            {/* <div className="mt-2 text-xs font-semibold text-blue-600">{s.completeness}% Complete</div> */}
          </div>
        ))}
      </div>

      <div className="panel-grid panel-grid--3 mb-6">
        <KpiCard label="Sources Connected" value={activeCount} color="green" />
        <KpiCard label="Total Source Records" value={totalRecords.toLocaleString()} color="blue" />
        <KpiCard label="Unique Subscribers" value={k.unique_subscribers.toLocaleString()} color="purple" />
      </div>

      <SectionTitle title="AI Subscriber Ingestion Pipeline" color="purple" />
      <div className="mb-8">
        <UploadWizard />
      </div>
    </div>
  );
}
