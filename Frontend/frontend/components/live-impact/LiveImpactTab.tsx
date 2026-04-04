"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Loading from "../shared/Loading";
import SectionTitle from "../shared/SectionTitle";
import ChartCard from "../shared/ChartCard";
import RetentionSimulator from "./RetentionSimulator";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

/* ───── helpers ───── */
function fmtCurrency(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}
function fmtPct(v: number) { return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`; }
function fmtPctPlain(v: number) { return `${v.toFixed(1)}%`; }

/* ───── doughnut options ───── */
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: {
    legend: { position: "bottom" as const, labels: { color: COLORS.textColor, font: { size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 } },
    tooltip: defaultOptions.plugins.tooltip,
  },
};

const DOUGHNUT_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.cyan, COLORS.red];

/* ═══════════════════════════════════════════ */
export default function LiveImpactTab() {
  const [data, setData] = useState<any>(null);
  const [simulatorData, setSimulatorData] = useState<any>(null);
  const [simState, setSimState] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get("/impact").then((r) => setData(r.data)).catch(() => setError(true));
    api.get("/impact/simulator-data").then((r) => setSimulatorData(r.data)).catch((e) => console.warn("Simulator data unavailable:", e));
  }, []);

  if (error) return <div className="dashboard-content text-muted">Failed to load impact data.</div>;
  if (!data) return <Loading message="Analyzing Live Retention Impact..." />;

  const hero = data.hero_kpis || { churn_rate_reduction: 0, offer_acceptance_rate: 0, clv_increase: 0, outreach_cost_reduction: 0 };
  const sec = data.secondary_kpis || {
    churn_identification_rate: { value: 0, min: 60, stretch: 75 },
    offer_uplift: { value: 0, min: 20, stretch: 35 },
    revenue_protected: { value: 0, target: 2400000 },
    subscribers_retained: { value: 0, target: 1761 },
  };
  const roi = data.roi_summary || { revenue_protected: 0, subscribers_retained: 0, detection_accuracy: 91, signal_to_action: null };
  const ch = data.charts || {};
  const log = data.campaign_log || [];

  const emptyArr = { labels: [], targeted: [], retained: [], at_campaign: [], current: [], cumulative_spend: [], cumulative_revenue_protected: [], values: [] };

  // ── Make charts responsive to the Simulator ──
  let displayCh = { ...ch };
  if (simState && simState.chartLabels?.length > 0) {
    displayCh.retention_by_risk = {
      labels: simState.chartLabels.map((l: string) => l.split(" ")[0] + " (Simulated)"),
      targeted: simState.chartLabels.map((l: string) => simulatorData.risk_buckets[l].customer_count),
      retained: simState.chartDataCustomersRetained,
    };
    
    if (simState.profitCurve?.length > 0) {
      displayCh.spend_vs_revenue = {
        labels: simState.profitCurve.map((p: any) => "$" + p.cost),
        cumulative_spend: simState.profitCurve.map((p: any) => p.investment),
        cumulative_revenue_protected: simState.profitCurve.map((p: any) => p.revenue),
      };
    }

    if (simState.strategy) {
      displayCh.retention_by_offer_type = {
        labels: [simState.strategy.label + " (Sim)"],
        targeted: [simState.totalCustomers],
        retained: [simState.projections.customersSaved],
      };
      
      displayCh.cost_by_channel = {
        labels: [simState.strategy.label + " (Sim)"],
        values: [simState.projections.totalInvestment],
      };
    }
  }

  return (
    <div className="dashboard-content">
      {/* ── Header ── */}
      {/* <SectionTitle
        title="Live Impact Dashboard"
        description="Measuring the real-world impact of AI-driven retention campaigns"
        color="green"
      /> */}

      {/* ── Top Hero Cards ── */}
      {/* <div className="panel-grid panel-grid--3 mb-6 animate-in">
        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__label">CUSTOMERS RETAINED</div>
          <div className="kpi-card__value">{roi.subscribers_retained.toLocaleString()}</div>
          <div className="kpi-card__sub">{fmtPctPlain(hero.churn_rate_reduction)} retention rate</div>
        </div>

        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__label">REVENUE PROTECTED</div>
          <div className="kpi-card__value">{fmtCurrency(roi.revenue_protected)}</div>
          <div className="kpi-card__sub">from {roi.subscribers_retained.toLocaleString()} retained subscribers</div>
        </div>

        <div className="kpi-card kpi-card--purple">
          <div className="kpi-card__label">CAMPAIGN ROI</div>
          <div className="kpi-card__value">—</div>
          <div className="kpi-card__sub">{fmtCurrency(roi.total_spend || 0)} total spend</div>
        </div>
      </div> */}

      {/* ── Performance Meters ── */}
      {/* <SectionTitle title="Performance Meters" color="blue" /> */}
      {/* <div className="card mb-6 animate-in" style={{ padding: '24px 32px' }}>
        <div className="meter">
          <div className="meter__label">
            <span>Retention Rate</span>
            <span>{fmtPctPlain(hero.churn_rate_reduction)}</span>
          </div>
          <div className="meter__bar">
            <div className="meter__fill meter__fill--green" style={{ width: `${Math.min(hero.churn_rate_reduction, 100)}%` }} />
          </div>
        </div>

        <div className="meter">
          <div className="meter__label">
            <span>Offer Delivery Rate</span>
            <span>{fmtPctPlain(hero.offer_acceptance_rate)}</span>
          </div>
          <div className="meter__bar">
            <div className="meter__fill meter__fill--blue" style={{ width: `${Math.min(hero.offer_acceptance_rate, 100)}%` }} />
          </div>
        </div>

        <div className="meter" style={{ marginBottom: 0 }}>
          <div className="meter__label">
            <span>Budget Utilization</span>
            <span>{fmtPctPlain(0)}</span>
          </div>
          <div className="meter__bar">
            <div className="meter__fill meter__fill--amber" style={{ width: '0%' }} />
          </div>
        </div>
      </div> */}

      {/* ══════════════════════════════════════════════════════ */}
      {/* Section 3: Retention Simulator                        */}
      {/* ══════════════════════════════════════════════════════ */}
      <SectionTitle title="Retention Simulator" description="Adjust budget & segments to project retention outcomes" color="cyan" />
      <div className="mb-6 animate-in">
        {simulatorData && Object.keys(simulatorData.risk_buckets || {}).length > 0 ? (
          <RetentionSimulator data={simulatorData} onSimulate={setSimState} />
        ) : (
          <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            {simulatorData ? "No at-risk customers found for simulation" : "Loading simulator data..."}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* Section 4: Retention & Churn Impact                   */}
      {/* ══════════════════════════════════════════════════════ */}
      <SectionTitle title="Retention & Churn Impact" color="green" />
      <div className="panel-grid panel-grid--2 mb-6">
        <ChartCard title={simState ? "Simulated Retention Target by Risk" : "Retention by Risk Level"} icon="🛡️">
          <Bar
            data={{
              labels: (displayCh.retention_by_risk || emptyArr).labels,
              datasets: [
                { label: "Targeted", data: (displayCh.retention_by_risk || emptyArr).targeted, backgroundColor: COLORS.redAlpha, borderColor: COLORS.red, borderWidth: 1, borderRadius: 4 },
                { label: "Retained", data: (displayCh.retention_by_risk || emptyArr).retained, backgroundColor: COLORS.greenAlpha, borderColor: COLORS.green, borderWidth: 1, borderRadius: 4 },
              ],
            }}
            options={{ ...defaultOptions, indexAxis: "y" as const }}
          />
        </ChartCard>

        <ChartCard title="Churn Score Shift" icon="📉">
          <Bar
            data={{
              labels: (displayCh.churn_score_shift || emptyArr).labels,
              datasets: [
                { label: "At Campaign", data: (displayCh.churn_score_shift || emptyArr).at_campaign, backgroundColor: COLORS.amberAlpha, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4 },
                { label: "Current", data: (displayCh.churn_score_shift || emptyArr).current, backgroundColor: COLORS.cyanAlpha, borderColor: COLORS.cyan, borderWidth: 1, borderRadius: 4 },
              ],
            }}
            options={defaultOptions}
          />
        </ChartCard>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* Section 4: Financial ROI                              */}
      {/* ══════════════════════════════════════════════════════ */}
      <SectionTitle title="Financial ROI" color="amber" />
      <div className="panel-grid panel-grid--2 mb-6">
        <ChartCard title={simState ? "Simulated Spend vs Protected" : "Spend vs Revenue Protected"} icon="💰">
          <Line
            data={{
              labels: (displayCh.spend_vs_revenue || emptyArr).labels,
              datasets: [
                { label: "Cumulative Spend", data: (displayCh.spend_vs_revenue || emptyArr).cumulative_spend, borderColor: COLORS.red, backgroundColor: "rgba(239,68,68,0.08)", tension: 0.3, fill: true, pointRadius: 4, pointBackgroundColor: COLORS.red },
                { label: "Revenue Protected", data: (displayCh.spend_vs_revenue || emptyArr).cumulative_revenue_protected, borderColor: COLORS.green, backgroundColor: "rgba(22,163,74,0.08)", tension: 0.3, fill: true, pointRadius: 4, pointBackgroundColor: COLORS.green },
              ],
            }}
            options={defaultOptions}
          />
        </ChartCard>

        <ChartCard title={simState ? "Cost by Strategy (Simulated)" : "Cost by Channel"} icon="📊">
          <Doughnut
            data={{
              labels: (displayCh.cost_by_channel || emptyArr).labels,
              datasets: [{ data: (displayCh.cost_by_channel || emptyArr).values, backgroundColor: [...DOUGHNUT_COLORS, ...DOUGHNUT_COLORS].slice(0, (displayCh.cost_by_channel || emptyArr).labels.length), borderColor: "rgba(15,23,42,0.8)", borderWidth: 2, hoverOffset: 8 }],
            }}
            options={doughnutOptions}
          />
        </ChartCard>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* Section 5: Offer Effectiveness (single chart)         */}
      {/* ══════════════════════════════════════════════════════ */}
      <SectionTitle title="Offer Effectiveness" color="purple" />
      <div className="mb-6">
        <ChartCard title={simState ? "Simulated Strategy Retention" : "Retention by Offer Type"} icon="✅">
          <Bar
            data={{
              labels: (displayCh.retention_by_offer_type || emptyArr).labels,
              datasets: [
                { label: "Targeted", data: (displayCh.retention_by_offer_type || emptyArr).targeted, backgroundColor: COLORS.purpleAlpha, borderColor: COLORS.purple, borderWidth: 1, borderRadius: 4 },
                { label: "Retained", data: (displayCh.retention_by_offer_type || emptyArr).retained, backgroundColor: COLORS.greenAlpha, borderColor: COLORS.green, borderWidth: 1, borderRadius: 4 },
              ],
            }}
            options={defaultOptions}
          />
        </ChartCard>
      </div>



      {/* ══════════════════════════════════════════════════════ */}
      {/* Section 7: Campaign Activity Log                      */}
      {/* ══════════════════════════════════════════════════════ */}
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
                      {row.triggered_at
                        ? new Date(row.triggered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
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
