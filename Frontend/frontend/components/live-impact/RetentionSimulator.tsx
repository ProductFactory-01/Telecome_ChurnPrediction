"use client";
import { useState, useMemo, useEffect } from "react";
import ChartCard from "../shared/ChartCard";
import { Bar, Line } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

/* ── helpers ── */
function fmtCurrency(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${v < 0 ? "-" : ""}$${(Math.abs(v) / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${v < 0 ? "-" : ""}$${(Math.abs(v) / 1_000).toFixed(1)}K`;
  return `${v < 0 ? "-" : ""}$${Math.abs(v).toFixed(0)}`;
}

interface BucketData {
  customer_count: number;
  avg_monthly_charge: number;
  avg_cltv: number;
  avg_churn_score: number;
  total_revenue_at_risk: number;
  avg_total_revenue: number;
  retention_probability: number;
}

interface SimulatorData {
  risk_buckets: Record<string, BucketData>;
  avg_campaign_cost_per_customer: number;
  historical_retention_rate: number;
  total_at_risk_customers: number;
  total_revenue_at_risk: number;
}

const RISK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Critical (>80)": { bg: "rgba(220,38,38,0.06)", border: "var(--accent-red)", text: "var(--accent-red)" },
  "High (60-80)": { bg: "rgba(217,119,6,0.06)", border: "var(--accent-amber)", text: "var(--accent-amber)" },
  "Medium (40-60)": { bg: "rgba(0,102,204,0.06)", border: "var(--accent-blue)", text: "var(--accent-blue)" },
  "Low (20-40)": { bg: "rgba(5,150,105,0.06)", border: "var(--accent-green)", text: "var(--accent-green)" },
};

const RISK_ICONS: Record<string, string> = {
  "Critical (>80)": "🔴",
  "High (60-80)": "🟠",
  "Medium (40-60)": "🔵",
  "Low (20-40)": "🟢",
};

/* ── Investment strategy presets ── */
const STRATEGIES = [
  { id: "email", label: "📧 Email Only", costPerCustomer: 5, retBoost: 0, desc: "Basic email outreach" },
  { id: "multi", label: "📱 Multi-Channel", costPerCustomer: 25, retBoost: 0.10, desc: "Email + SMS + push" },
  { id: "offers", label: "🎁 With Offers", costPerCustomer: 80, retBoost: 0.20, desc: "Discounts & credits" },
  { id: "premium", label: "🏆 Premium Retention", costPerCustomer: 200, retBoost: 0.35, desc: "Full white-glove" },
];

export default function RetentionSimulator({
  data,
  onSimulate,
}: {
  data: SimulatorData;
  onSimulate?: (simState: any) => void;
}) {
  const bucketLabels = Object.keys(data.risk_buckets);
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [strategyIdx, setStrategyIdx] = useState(1); // default: multi-channel
  const [customCostPerCustomer, setCustomCostPerCustomer] = useState(25);
  const [useCustomCost, setUseCustomCost] = useState(false);

  const strategy = STRATEGIES[strategyIdx];
  const costPerCustomer = useCustomCost ? customCostPerCustomer : strategy.costPerCustomer;
  const retBoost = useCustomCost
    ? Math.min(0.05 + (customCostPerCustomer / 300) * 0.35, 0.40) // diminishing returns
    : strategy.retBoost;

  useEffect(() => {
    if (bucketLabels.length > 0) {
      setSelectedLevels(new Set(bucketLabels));
    }
  }, [bucketLabels.join(",")]);

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  // ── Aggregate selected buckets ──
  const selectedBuckets = useMemo(() => {
    const selected = bucketLabels.filter((l) => selectedLevels.has(l));
    let totalCustomers = 0, totalRevAtRisk = 0, weightedRetention = 0, weightedCltv = 0, weightedMonthly = 0;

    for (const label of selected) {
      const b = data.risk_buckets[label];
      totalCustomers += b.customer_count;
      totalRevAtRisk += b.total_revenue_at_risk;
      weightedRetention += b.retention_probability * b.customer_count;
      weightedCltv += b.avg_cltv * b.customer_count;
      weightedMonthly += b.avg_monthly_charge * b.customer_count;
    }

    const baseRetention = totalCustomers > 0 ? weightedRetention / totalCustomers : 0;
    const avgCltv = totalCustomers > 0 ? weightedCltv / totalCustomers : 0;
    const avgMonthly = totalCustomers > 0 ? weightedMonthly / totalCustomers : 0;

    return { totalCustomers, totalRevAtRisk, baseRetention, avgCltv, avgMonthly };
  }, [selectedLevels, data, bucketLabels]);

  // ── Core calculation for a given costPerCustomer ──
  function calcProjection(cpc: number, boost: number) {
    const { totalCustomers, totalRevAtRisk, baseRetention, avgCltv } = selectedBuckets;
    if (totalCustomers === 0) return { customersSaved: 0, revenueRetained: 0, totalInvestment: 0, profit: 0, roi: 0 };

    const totalInvestment = totalCustomers * cpc;
    // Adjusted retention: base + boost from investment, capped at 95%
    const adjustedRetention = Math.min(baseRetention + boost, 0.95);
    const customersSaved = Math.round(totalCustomers * adjustedRetention);
    const revenueRetained = customersSaved * avgCltv;
    const profit = revenueRetained - totalInvestment;
    const roi = totalInvestment > 0 ? revenueRetained / totalInvestment : 0;

    return { customersSaved, revenueRetained, totalInvestment, profit, roi };
  }

  const projections = useMemo(() => {
    return calcProjection(costPerCustomer, retBoost);
  }, [costPerCustomer, retBoost, selectedBuckets]);

  // ── Profit/Loss curve data (how profit changes as cost-per-customer increases) ──
  const profitCurve = useMemo(() => {
    const points: { cost: number; profit: number; revenue: number; investment: number }[] = [];
    const costs = [0, 2, 5, 10, 15, 25, 40, 60, 80, 100, 125, 150, 200, 250, 300, 400, 500, 600, 800, 1000];
    for (const cpc of costs) {
      const boost = Math.min(0.05 + (cpc / 300) * 0.35, 0.40);
      const p = calcProjection(cpc, boost);
      points.push({ cost: cpc, profit: p.profit, revenue: p.revenueRetained, investment: p.totalInvestment });
    }
    return points;
  }, [selectedBuckets]);

  // Find breakeven point
  const breakevenCost = useMemo(() => {
    for (let i = 1; i < profitCurve.length; i++) {
      if (profitCurve[i - 1].profit >= 0 && profitCurve[i].profit < 0) {
        // Linear interpolation
        const p1 = profitCurve[i - 1], p2 = profitCurve[i];
        const ratio = p1.profit / (p1.profit - p2.profit);
        return Math.round(p1.cost + ratio * (p2.cost - p1.cost));
      }
    }
    return profitCurve[profitCurve.length - 1]?.cost || 0;
  }, [profitCurve]);

  // Find optimal cost (peak profit)
  const optimalPoint = useMemo(() => {
    let best = profitCurve[0];
    for (const p of profitCurve) {
      if (p.profit > best.profit) best = p;
    }
    return best;
  }, [profitCurve]);

  const chartLabels = bucketLabels.filter((l) => selectedLevels.has(l));
  const chartDataAtRisk = chartLabels.map((l) => data.risk_buckets[l].total_revenue_at_risk);
  const chartDataRetained = chartLabels.map((l) => {
    const b = data.risk_buckets[l];
    const adjRet = Math.min(b.retention_probability + retBoost, 0.95);
    return Math.round(b.customer_count * adjRet * b.avg_cltv);
  });
  const chartDataCustomersRetained = chartLabels.map((l) => {
    const b = data.risk_buckets[l];
    const adjRet = Math.min(b.retention_probability + retBoost, 0.95);
    return Math.round(b.customer_count * adjRet);
  });

  const isProfit = projections.profit >= 0;

  // ── Emit state upward so LiveImpactTab can sync downstream charts ──
  useEffect(() => {
    if (onSimulate) {
      onSimulate({
        selectedLevels,
        strategy,
        profitCurve,
        projections,
        chartLabels,
        chartDataAtRisk,
        chartDataRetained,
        chartDataCustomersRetained,
        totalCustomers: selectedBuckets.totalCustomers,
      });
    }
  }, [
    selectedLevels,
    strategy,
    profitCurve,
    projections,
    chartLabels,
    chartDataAtRisk,
    chartDataRetained,
    chartDataCustomersRetained,
    selectedBuckets.totalCustomers,
  ]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", border: "1.5px solid var(--accent-blue)", boxShadow: "0 0 0 3px rgba(0,102,204,0.06)" }}>
      {/* Header */}
      <div style={{
        padding: "20px 28px",
        background: "linear-gradient(135deg, rgba(0,102,204,0.04), rgba(5,150,105,0.04))",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>🎯</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Retention Simulator
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
              Select risk segments → Choose investment strategy → See profit or loss projections
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>

        {/* ── Step 1: Risk Level Selection ── */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px",
            color: "var(--text-muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ background: "var(--accent-blue)", color: "#fff", width: "20px", height: "20px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>1</span>
            Target Risk Segments
            <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "none" as const }}>(click to toggle)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {bucketLabels.map((label) => {
              const b = data.risk_buckets[label];
              const isActive = selectedLevels.has(label);
              const colors = RISK_COLORS[label] || RISK_COLORS["Medium (40-60)"];
              return (
                <button
                  key={label}
                  onClick={() => toggleLevel(label)}
                  style={{
                    padding: "14px 16px", border: `2px solid ${isActive ? colors.border : "var(--border)"}`,
                    borderRadius: "var(--radius-lg)", background: isActive ? colors.bg : "var(--bg-card)",
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                    position: "relative", fontFamily: "inherit",
                  }}
                >
                  {isActive && (
                    <span style={{
                      position: "absolute", top: "8px", right: "8px", width: "20px", height: "20px", borderRadius: "50%",
                      background: colors.border, color: "#fff", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "11px", fontWeight: 700,
                    }}>✓</span>
                  )}
                  <div style={{ fontSize: "13px", fontWeight: 700, color: isActive ? colors.text : "var(--text-primary)", marginBottom: "4px" }}>
                    {RISK_ICONS[label]} {label.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Score: {label.match(/\(([^)]+)\)/)?.[1]} • Ret: {(b.retention_probability * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: isActive ? colors.text : "var(--text-primary)" }}>
                    {b.customer_count.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>customers at risk</div>
                </button>
              );
            })}
          </div>

          <div style={{
            marginTop: "12px", padding: "10px 14px", background: "var(--accent-blue-light)",
            borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)",
            display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" as const,
          }}>
            <span>📊 <strong style={{ color: "var(--text-primary)" }}>{selectedBuckets.totalCustomers.toLocaleString()}</strong> customers</span>
            <span>•</span>
            <span>💰 <strong style={{ color: "var(--accent-red)" }}>{fmtCurrency(selectedBuckets.totalRevAtRisk)}</strong> revenue at risk</span>
            <span>•</span>
            <span>📈 Avg CLTV: <strong style={{ color: "var(--accent-blue)" }}>{fmtCurrency(selectedBuckets.avgCltv)}</strong></span>
          </div>
        </div>

        {/* ── Step 2: Investment Strategy ── */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px",
            color: "var(--text-muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ background: "var(--accent-amber)", color: "#fff", width: "20px", height: "20px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>2</span>
            Investment Strategy
          </div>

          {/* Strategy Presets */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
            {STRATEGIES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setStrategyIdx(i); setUseCustomCost(false); }}
                style={{
                  padding: "12px 14px", border: `2px solid ${!useCustomCost && strategyIdx === i ? "var(--accent-blue)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
                  background: !useCustomCost && strategyIdx === i ? "var(--accent-blue-light)" : "var(--bg-card)",
                  fontFamily: "inherit", transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: !useCustomCost && strategyIdx === i ? "var(--accent-blue)" : "var(--text-primary)", marginBottom: "2px" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.desc}</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: !useCustomCost && strategyIdx === i ? "var(--accent-blue)" : "var(--text-primary)", marginTop: "6px" }}>
                  ${s.costPerCustomer}/customer
                </div>
              </button>
            ))}
          </div>

          {/* Custom slider */}
          <div style={{ padding: "14px 18px", background: "var(--bg-input)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                Or set custom investment per customer:
              </span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: useCustomCost ? "var(--accent-blue)" : "var(--text-muted)" }}>
                ${customCostPerCustomer}/customer
              </span>
            </div>
            <input
              type="range"
              className="sim-slider__input"
              min={1}
              max={500}
              step={1}
              value={customCostPerCustomer}
              onChange={(e) => { setCustomCostPerCustomer(Number(e.target.value)); setUseCustomCost(true); }}
              style={{ background: `linear-gradient(to right, var(--accent-blue) ${(customCostPerCustomer / 500) * 100}%, #e2e8f0 ${(customCostPerCustomer / 500) * 100}%)` }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
              <span>$1</span>
              <span>
                Total Investment: <strong style={{ color: "var(--text-primary)" }}>{fmtCurrency(selectedBuckets.totalCustomers * costPerCustomer)}</strong>
                {" "}for {selectedBuckets.totalCustomers.toLocaleString()} customers
              </span>
              <span>$500</span>
            </div>
          </div>
        </div>

        {/* ── Step 3: Projected Outcomes ── */}
        <div style={{
          fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px",
          color: "var(--text-muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ background: isProfit ? "var(--accent-green)" : "var(--accent-red)", color: "#fff", width: "20px", height: "20px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>3</span>
          Projected Outcomes
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)",
            background: isProfit ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)",
            color: isProfit ? "var(--accent-green)" : "var(--accent-red)",
            textTransform: "uppercase" as const,
          }}>
            {isProfit ? "✓ Profitable" : "⚠ Loss"}
          </span>
        </div>

        <div className="panel-grid panel-grid--4" style={{ marginBottom: "16px" }}>
          <div className="kpi-card kpi-card--green">
            <div className="kpi-card__label">CUSTOMERS SAVED</div>
            <div className="kpi-card__value" style={{ fontSize: "28px" }}>{projections.customersSaved.toLocaleString()}</div>
            <div className="kpi-card__sub">
              {selectedBuckets.totalCustomers > 0 ? `${((projections.customersSaved / selectedBuckets.totalCustomers) * 100).toFixed(0)}% retention rate` : "—"}
            </div>
          </div>
          <div className="kpi-card kpi-card--blue">
            <div className="kpi-card__label">REVENUE RETAINED</div>
            <div className="kpi-card__value" style={{ fontSize: "28px" }}>{fmtCurrency(projections.revenueRetained)}</div>
            <div className="kpi-card__sub">gross value from saved customers</div>
          </div>
          <div className="kpi-card kpi-card--amber">
            <div className="kpi-card__label">TOTAL INVESTMENT</div>
            <div className="kpi-card__value" style={{ fontSize: "28px" }}>{fmtCurrency(projections.totalInvestment)}</div>
            <div className="kpi-card__sub">${costPerCustomer} × {selectedBuckets.totalCustomers.toLocaleString()} customers</div>
          </div>
          <div className={`kpi-card ${isProfit ? "kpi-card--green" : "kpi-card--red"}`}>
            <div className="kpi-card__label">NET {isProfit ? "PROFIT" : "LOSS"}</div>
            <div className="kpi-card__value" style={{ fontSize: "28px", color: isProfit ? "var(--accent-green)" : "var(--accent-red)" }}>
              {fmtCurrency(projections.profit)}
            </div>
            <div className="kpi-card__sub">{projections.roi > 0 ? `${projections.roi.toFixed(1)}x ROI` : "—"}</div>
          </div>
        </div>

        {/* ── Profit/Loss indicator bar ── */}
        <div style={{
          padding: "14px 18px", borderRadius: "var(--radius-md)", marginBottom: "24px",
          background: isProfit
            ? "linear-gradient(135deg, rgba(5,150,105,0.06), rgba(16,185,129,0.06))"
            : "linear-gradient(135deg, rgba(220,38,38,0.06), rgba(239,68,68,0.06))",
          border: `1.5px solid ${isProfit ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
            <span style={{ fontSize: "20px" }}>{isProfit ? "📈" : "📉"}</span>
            <div>
              <div style={{ fontWeight: 700, color: isProfit ? "var(--accent-green)" : "var(--accent-red)", marginBottom: "2px" }}>
                {isProfit
                  ? `Profitable — Every $1 invested returns $${projections.roi.toFixed(1)} in retained revenue`
                  : `Loss — Investment ($${costPerCustomer}/customer) exceeds customer lifetime value`
                }
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Breakeven point: <strong>${breakevenCost}/customer</strong> — Beyond this, retention spend exceeds revenue gained.
                Optimal investment: <strong>${optimalPoint.cost}/customer</strong> (peak profit: {fmtCurrency(optimalPoint.profit)})
              </div>
            </div>
          </div>
        </div>

        {/* ── Profit vs Loss Curve ── */}
        <div style={{ marginBottom: "24px" }}>
          <ChartCard title="Profit vs Loss Curve — As Investment Increases" icon={isProfit ? "📈" : "📉"}>
            <Line
              data={{
                labels: profitCurve.map((p) => `$${p.cost}`),
                datasets: [
                  {
                    label: "Revenue Retained",
                    data: profitCurve.map((p) => p.revenue),
                    borderColor: COLORS.green,
                    backgroundColor: "rgba(22,163,74,0.08)",
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: COLORS.green,
                    borderWidth: 2,
                  },
                  {
                    label: "Total Investment",
                    data: profitCurve.map((p) => p.investment),
                    borderColor: COLORS.red,
                    backgroundColor: "rgba(239,68,68,0.08)",
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: COLORS.red,
                    borderWidth: 2,
                    borderDash: [5, 5],
                  },
                  {
                    label: "Net Profit / Loss",
                    data: profitCurve.map((p) => p.profit),
                    borderColor: COLORS.blue,
                    backgroundColor: profitCurve.map((p) => p.profit >= 0 ? "rgba(22,163,74,0.15)" : "rgba(239,68,68,0.15)"),
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: profitCurve.map((p) => p.profit >= 0 ? COLORS.green : COLORS.red),
                    borderWidth: 2.5,
                    segment: {
                      borderColor: (ctx: any) => {
                        const val = ctx.p1?.parsed?.y;
                        return val !== undefined && val < 0 ? COLORS.red : COLORS.green;
                      },
                    },
                  },
                ],
              }}
              options={{
                ...defaultOptions,
                scales: {
                  ...defaultOptions.scales,
                  x: {
                    ...defaultOptions.scales?.x,
                    title: { display: true, text: "Investment per Customer", color: "#64748b", font: { size: 11 } },
                  },
                  y: {
                    ...defaultOptions.scales?.y,
                    title: { display: true, text: "Amount ($)", color: "#64748b", font: { size: 11 } },
                  },
                },
                plugins: {
                  ...defaultOptions.plugins,
                  tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                      label: (ctx: any) => `${ctx.dataset.label}: ${fmtCurrency(ctx.raw)}`,
                    },
                  },
                  annotation: {
                    annotations: {
                      zeroLine: {
                        type: "line",
                        yMin: 0, yMax: 0,
                        borderColor: "#94a3b8",
                        borderWidth: 1,
                        borderDash: [3, 3],
                      },
                    },
                  },
                },
              }}
            />
            <div style={{
              display: "flex", gap: "20px", justifyContent: "center", marginTop: "12px",
              fontSize: "11px", color: "var(--text-muted)",
            }}>
              <span>🟢 Above zero = <strong style={{ color: "var(--accent-green)" }}>Profit</strong></span>
              <span>🔴 Below zero = <strong style={{ color: "var(--accent-red)" }}>Loss</strong></span>
              <span>📍 Your position: <strong style={{ color: isProfit ? "var(--accent-green)" : "var(--accent-red)" }}>${costPerCustomer}/customer</strong></span>
            </div>
          </ChartCard>
        </div>

        {/* ── Revenue Comparison by Bucket ── */}
        {chartLabels.length > 0 && (
          <ChartCard title="Revenue at Risk vs Projected Retained by Segment" icon="📊">
            <Bar
              data={{
                labels: chartLabels.map((l) => l.split(" ")[0]),
                datasets: [
                  {
                    label: "Revenue at Risk",
                    data: chartDataAtRisk,
                    backgroundColor: COLORS.redAlpha,
                    borderColor: COLORS.red,
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                  {
                    label: "Projected Retained",
                    data: chartDataRetained,
                    backgroundColor: COLORS.greenAlpha,
                    borderColor: COLORS.green,
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                ...defaultOptions,
                plugins: {
                  ...defaultOptions.plugins,
                  tooltip: {
                    ...defaultOptions.plugins.tooltip,
                    callbacks: {
                      label: (ctx: any) => `${ctx.dataset.label}: ${fmtCurrency(ctx.raw)}`,
                    },
                  },
                },
              }}
            />
          </ChartCard>
        )}
      </div>
    </div>
  );
}
