"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import KpiCard from "../shared/KpiCard";
import SectionTitle from "../shared/SectionTitle";
import AgentLog from "../shared/AgentLog";
import PipelineFlow from "./PipelineFlow";
import OverviewCharts from "./OverviewCharts";

import Loading from "../shared/Loading";

export default function OverviewTab() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/overview").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return (
    <div className="dashboard-content min-h-[400px] flex items-center justify-center">
      <Loading message="Assembling Dashboard..." />
    </div>
  );

  const k = data.kpis;
  return (
    <div className="dashboard-content">
      <PipelineFlow steps={data.pipeline} />

      <div className="panel-grid panel-grid--5 mb-6 mt-4">
        <KpiCard label="Total Subscribers" value={k.subscribers_unified.toLocaleString()} sub="Joined Customer360 Base" color="blue" />
        <KpiCard label="Current Churn Rate" value={`${k.current_churn_rate}%`} sub="Active Portfolio Risk Score" color="red" />
        <KpiCard label="High-Risk Flagged" value={k.high_risk_flagged.toLocaleString()} sub="Scored > 70 by Model" color="amber" />
        <KpiCard label="Retention Offers Sent" value={k.retention_offers_sent.toLocaleString()} sub="Through offers and Campaigns" color="green" />
        {/* <KpiCard label="Subscribers Saved" value={k.subscribers_saved.toLocaleString()} sub="Through AI intervention" color="purple" /> */}
        <KpiCard 
          label="Total Revenue" 
          value={(k.total_revenue || 0) > 1000000 
            ? `$${((k.total_revenue || 0) / 1000000).toFixed(2)}M` 
            : `$${(k.total_revenue ?? 0).toLocaleString()}`
          } 
          sub="Cumulative Portfolio Value" 
          color="cyan" 
        />
      </div>

      <div className="mb-6">
        <AgentLog entries={[]} />
      </div>

      <OverviewCharts churnTrend={data.churn_trend} riskDistribution={data.risk_distribution} />
    </div>
  );
}
