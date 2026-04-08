"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import KpiCard from "../shared/KpiCard";
import PipelineFlow from "./PipelineFlow";
import OverviewCharts from "./OverviewCharts";
import Loading from "../shared/Loading";

export default function OverviewTab() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/overview")
      .then((r) => setData(r.data))
      .catch(console.error);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Loading message="Assembling Dashboard..." />
    </div>
  );

  const k = data.kpis;
  
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 mt-6 lg:mt-10">
      
      {/* 1. Agent Instrumentation Flow */}
      <PipelineFlow steps={data.pipeline} />

      {/* 2. Intelligence Metrics (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <KpiCard 
          label="Total Subscribers" 
          value={k.subscribers_unified.toLocaleString()} 
          sub="Joined Customer360 Base" 
          color="blue" 
        />
        <KpiCard 
          label="Current Churn Rate" 
          value={`${k.current_churn_rate}%`} 
          sub="Active Portfolio Risk Score" 
          color="red" 
        />
        <KpiCard 
          label="High-Risk Flagged" 
          value={k.high_risk_flagged.toLocaleString()} 
          sub="Scored Above 70 Threshold" 
          color="amber" 
        />
        <KpiCard 
          label="Retention Offers Sent" 
          value={k.retention_offers_sent.toLocaleString()} 
          sub="Through offers and Campaigns" 
          color="green" 
        />
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

      {/* 3. Deep Analytics Visualizer */}
      <div className="pt-2">
        <OverviewCharts churnTrend={data.churn_trend} riskDistribution={data.risk_distribution} />
      </div>
      
    </div>
  );
}
