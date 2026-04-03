"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import SectionTitle from "../shared/SectionTitle";
import KpiCard from "../shared/KpiCard";
import ChartCard from "../shared/ChartCard";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

/* ───── helpers ───── */
function fmtCurrency(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}

/* ───── doughnut options (no grid/scales) ───── */
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { color: COLORS.textColor, font: { size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 },
    },
    tooltip: defaultOptions.plugins.tooltip,
  },
};

/* ───── palette for doughnut segments ───── */
const DOUGHNUT_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.cyan, COLORS.red];
const DOUGHNUT_ALPHAS = [COLORS.blueAlpha, COLORS.greenAlpha, COLORS.amberAlpha, COLORS.purpleAlpha, COLORS.cyanAlpha, COLORS.redAlpha];

/* ═══════════════════════════════════════════ */
export default function LiveImpactTab() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/impact")
      .then((r) => setData(r.data))
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="dashboard-content text-muted">Failed to load impact data.</div>;
  if (!data) return <div className="dashboard-content text-muted">Loading…</div>;

  const es = data.executive_summary;
  const m = data.meters;
  const ch = data.charts;
  const log = data.campaign_log || [];

  return (
    <div className="dashboard-content">
      {/* ── Section 1: Executive Summary ── */}
      <SectionTitle title="Live Impact Dashboard" description="Measuring the real-world impact of AI-driven retention campaigns" color="green" />

      <div className="panel-grid panel-grid--3 mb-6">
        <KpiCard label="Customers Retained" value={es.customers_retained} sub={`${fmtPct(m.retention_rate.value)} retention rate`} color="green" />
        <KpiCard label="Revenue Protected" value={fmtCurrency(es.revenue_protected)} sub={`from ${es.customers_retained} retained subscribers`} color="blue" />
        <KpiCard label="Campaign ROI" value={es.campaign_roi > 0 ? `${es.campaign_roi.toLocaleString()}%` : "—"} sub={`${fmtCurrency(es.total_spend)} total spend`} color="purple" />
      </div>

      {/* ── Section 2: Performance Meters ── */}
      <SectionTitle title="Performance Meters" color="cyan" />
      <div className="card mb-6" style={{ padding: 24 }}>
        {[
          { label: "Retention Rate", val: m.retention_rate.value, color: "green" },
          { label: "Offer Delivery Rate", val: m.delivery_rate.value, color: "blue" },
          { label: "Budget Utilization", val: m.budget_utilization.value, color: "amber" },
        ].map((meter) => (
          <div key={meter.label} className="meter">
            <div className="meter__label">
              <span>{meter.label}</span>
              <span>{fmtPct(meter.val)}</span>
            </div>
            <div className="meter__bar">
              <div className={`meter__fill meter__fill--${meter.color}`} style={{ width: `${Math.min(meter.val, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 3: Retention & Churn Impact ── */}
      <SectionTitle title="Retention & Churn Impact" color="green" />
      <div className="panel-grid panel-grid--2 mb-6">
        <ChartCard title="Retention by Risk Level" icon="🛡️">
          <Bar
            data={{
              labels: ch.retention_by_risk.labels,
              datasets: [
                {
                  label: "Targeted",
                  data: ch.retention_by_risk.targeted,
                  backgroundColor: COLORS.redAlpha,
                  borderColor: COLORS.red,
                  borderWidth: 1,
                  borderRadius: 4,
                },
                {
                  label: "Retained",
                  data: ch.retention_by_risk.retained,
                  backgroundColor: COLORS.greenAlpha,
                  borderColor: COLORS.green,
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              ...defaultOptions,
              indexAxis: "y" as const,
            }}
          />
        </ChartCard>

        <ChartCard title="Churn Score Shift" icon="📉">
          <Bar
            data={{
              labels: ch.churn_score_shift.labels,
              datasets: [
                {
                  label: "At Campaign",
                  data: ch.churn_score_shift.at_campaign,
                  backgroundColor: COLORS.amberAlpha,
                  borderColor: COLORS.amber,
                  borderWidth: 1,
                  borderRadius: 4,
                },
                {
                  label: "Current",
                  data: ch.churn_score_shift.current,
                  backgroundColor: COLORS.cyanAlpha,
                  borderColor: COLORS.cyan,
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ],
            }}
            options={defaultOptions}
          />
        </ChartCard>
      </div>

      {/* ── Section 4: Financial ROI ── */}
      <SectionTitle title="Financial ROI" color="amber" />
      <div className="panel-grid panel-grid--2 mb-6">
        <ChartCard title="Spend vs Revenue Protected" icon="💰">
          <Line
            data={{
              labels: ch.spend_vs_revenue.labels,
              datasets: [
                {
                  label: "Cumulative Spend",
                  data: ch.spend_vs_revenue.cumulative_spend,
                  borderColor: COLORS.red,
                  backgroundColor: "rgba(239,68,68,0.08)",
                  tension: 0.3,
                  fill: true,
                  pointRadius: 4,
                  pointBackgroundColor: COLORS.red,
                },
                {
                  label: "Revenue Protected",
                  data: ch.spend_vs_revenue.cumulative_revenue_protected,
                  borderColor: COLORS.green,
                  backgroundColor: "rgba(22,163,74,0.08)",
                  tension: 0.3,
                  fill: true,
                  pointRadius: 4,
                  pointBackgroundColor: COLORS.green,
                },
              ],
            }}
            options={defaultOptions}
          />
        </ChartCard>

        <ChartCard title="Cost by Channel" icon="📊">
          <Doughnut
            data={{
              labels: ch.cost_by_channel.labels,
              datasets: [
                {
                  data: ch.cost_by_channel.values,
                  backgroundColor: DOUGHNUT_COLORS.slice(0, ch.cost_by_channel.labels.length),
                  borderColor: "rgba(15,23,42,0.8)",
                  borderWidth: 2,
                  hoverOffset: 8,
                },
              ],
            }}
            options={doughnutOptions}
          />
        </ChartCard>
      </div>

      {/* ── Section 5: Offer Effectiveness ── */}
      <SectionTitle title="Offer Effectiveness" color="purple" />
      <div className="panel-grid panel-grid--2 mb-6">
        <ChartCard title="Offer Type Distribution" icon="🎯">
          <Doughnut
            data={{
              labels: ch.offer_type_distribution.labels,
              datasets: [
                {
                  data: ch.offer_type_distribution.values,
                  backgroundColor: DOUGHNUT_COLORS.slice(0, ch.offer_type_distribution.labels.length),
                  borderColor: "rgba(15,23,42,0.8)",
                  borderWidth: 2,
                  hoverOffset: 8,
                },
              ],
            }}
            options={doughnutOptions}
          />
        </ChartCard>

        <ChartCard title="Retention by Offer Type" icon="✅">
          <Bar
            data={{
              labels: ch.retention_by_offer_type.labels,
              datasets: [
                {
                  label: "Targeted",
                  data: ch.retention_by_offer_type.targeted,
                  backgroundColor: COLORS.purpleAlpha,
                  borderColor: COLORS.purple,
                  borderWidth: 1,
                  borderRadius: 4,
                },
                {
                  label: "Retained",
                  data: ch.retention_by_offer_type.retained,
                  backgroundColor: COLORS.greenAlpha,
                  borderColor: COLORS.green,
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ],
            }}
            options={defaultOptions}
          />
        </ChartCard>
      </div>

      {/* ── Section 6: Campaign Activity Log ── */}
      <SectionTitle title="Campaign Activity Log" color="blue" />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="impact-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Risk</th>
                <th>Category</th>
                <th>Offer Type</th>
                <th>Customers</th>
                <th>Channel</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Triggered</th>
              </tr>
            </thead>
            <tbody>
              {log.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "32px 16px", color: "#64748b" }}>
                    No campaigns executed yet
                  </td>
                </tr>
              ) : (
                log.map((row: any, i: number) => (
                  <tr key={i}>
                    <td className="impact-table__name">{row.document_name || "—"}</td>
                    <td>
                      <span className={`risk-badge risk-badge--${row.risk_level?.replace(/\s/g, "").toLowerCase()}`}>
                        {row.risk_level}
                      </span>
                    </td>
                    <td>{row.main_category}</td>
                    <td>{row.offer_type}</td>
                    <td style={{ textAlign: "center" }}>{row.customer_count}</td>
                    <td style={{ textTransform: "capitalize" }}>{row.channel}</td>
                    <td>{fmtCurrency(row.cost || 0)}</td>
                    <td>
                      <span className={`status-pill status-pill--${row.status}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="impact-table__date">
                      {row.triggered_at ? new Date(row.triggered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
