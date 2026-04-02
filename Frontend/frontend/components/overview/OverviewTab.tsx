"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import KpiCard from "../shared/KpiCard";
import SectionTitle from "../shared/SectionTitle";
import AgentLog from "../shared/AgentLog";
import PipelineFlow from "./PipelineFlow";
import OverviewCharts from "./OverviewCharts";

export default function OverviewTab() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/overview").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <div className="dashboard-content text-muted">Loading overview…</div>;

  const k = data.kpis;
  return (
    <div className="dashboard-content">
      <SectionTitle title="System Overview" description="AI-Powered Churn Prevention Pipeline" color="blue" />

      <div className="panel-grid panel-grid--4 mb-6">
        <KpiCard label="Subscribers Unified" value={k.subscribers_unified.toLocaleString()} color="blue" />
        <KpiCard label="Current Churn Rate" value={`${k.current_churn_rate}%`} sub={`Target: ${k.target_churn_rate}%`} color="red" />
        <KpiCard label="High-Risk Flagged" value={k.high_risk_flagged.toLocaleString()} color="amber" />
        <KpiCard label="Model ROC-AUC" value={`${k.model_roc_auc}%`} color="green" />
      </div>

      <div className="mb-6">
        <PipelineFlow steps={data.pipeline} />
      </div>

      <OverviewCharts churnTrend={data.churn_trend} agentActivity={data.agent_activity} />

      <div className="mt-6">
        <SectionTitle title="Agent Activity Log" color="cyan" />
        <AgentLog entries={[]} />
      </div>
    </div>
  );
}
