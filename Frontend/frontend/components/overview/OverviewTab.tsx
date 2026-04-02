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
      <PipelineFlow steps={data.pipeline} />

      <div className="panel-grid panel-grid--6 mb-6 mt-4">
        <KpiCard label="Subscribers Unified" value={k.subscribers_unified.toLocaleString()} sub="Customer360 Intelligence layer" color="blue" />
        <KpiCard label="Current Churn Rate" value={`${k.current_churn_rate}%`} sub={`Target: ${k.target_churn_rate}% with AI agents`} color="red" />
        <KpiCard label="High-Risk Flagged" value={k.high_risk_flagged.toLocaleString()} sub="Scored daily by Agent 2" color="amber" />
        <KpiCard label="Retention Offers Sent" value={k.retention_offers_sent.toLocaleString()} sub="Via Agent 3 + Agent 4" color="green" />
        <KpiCard label="Subscribers Saved" value={k.subscribers_saved.toLocaleString()} sub="Through AI intervention" color="purple" />
        <KpiCard label="Model ROC-AUC" value={`${k.model_roc_auc}%`} sub="Gradient Boosting — validated" color="cyan" />
      </div>

      <div className="mb-6">
        <AgentLog entries={[]} />
      </div>

      <OverviewCharts churnTrend={data.churn_trend} agentActivity={data.agent_activity} />
    </div>
  );
}
