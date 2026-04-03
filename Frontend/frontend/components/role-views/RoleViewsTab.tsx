"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Loading from "../shared/Loading";
import SectionTitle from "../shared/SectionTitle";
import KpiCard from "../shared/KpiCard";
import ChartCard from "../shared/ChartCard";
import { Bar } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

const ROLE_TABS = [
  { key: "ops", label: "🖥️ AI & Data Ops" },
  { key: "retention", label: "🎯 Retention Team" },
  { key: "strategy", label: "💰 Executive Strategy" },
];

export default function RoleViewsTab() {
  const [data, setData] = useState<any>(null);
  const [activeRole, setActiveRole] = useState("ops");

  useEffect(() => {
    api.get("/role-views").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <Loading message="Generating Role-Based Insights..." />;

  const roleData = data[activeRole];
  if (!roleData) return null;

  const kpiColors: Record<string, "blue" | "green" | "amber" | "red" | "purple"> = {
    red: "red", green: "green", amber: "amber", default: "blue", purple: "purple",
  };

  return (
    <div className="dashboard-content">
      <SectionTitle title="Role-Based Views" description="Tailored dashboards for different teams" color="amber" />

      <div className="sub-tabs mb-6">
        {ROLE_TABS.map((t) => (
          <button key={t.key} className={`sub-tabs__btn ${activeRole === t.key ? "sub-tabs__btn--active" : ""}`} onClick={() => setActiveRole(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel-grid panel-grid--4 mb-6">
        {roleData.kpis.map((kpi: any, i: number) => (
          <KpiCard key={i} label={kpi.label} value={kpi.value} color={kpiColors[kpi.variant] || "blue"} />
        ))}
      </div>

      {roleData.alerts && (
        <div className="mb-6">
          <SectionTitle title="Active Alerts" color="red" />
          {roleData.alerts.map((alert: any, i: number) => (
            <div key={i} className={`alert-card alert-card--${alert.type}`}>
              <div className="alert-card__icon">{alert.icon}</div>
              <div>
                <div className="alert-card__title">{alert.title}</div>
                <div className="alert-card__desc">{alert.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {roleData.charts && (
        <div className="panel-grid panel-grid--2">
          {Object.entries(roleData.charts).map(([key, chart]: [string, any]) => (
            <ChartCard key={key} title={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} icon="📊">
              <Bar data={{
                labels: chart.labels,
                datasets: Object.entries(chart)
                  .filter(([k]) => k !== "labels")
                  .map(([label, values], di) => ({
                    label: label.replace(/_/g, " "),
                    data: values as number[],
                    backgroundColor: [COLORS.blueAlpha, COLORS.greenAlpha, COLORS.amberAlpha, COLORS.redAlpha][di % 4],
                    borderColor: [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red][di % 4],
                    borderWidth: 1,
                    borderRadius: 4,
                  })),
              }} options={defaultOptions} />
            </ChartCard>
          ))}
        </div>
      )}
    </div>
  );
}
