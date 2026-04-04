"use client";
import { useState, useMemo, useEffect, ReactNode } from "react";
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
  children,
}: {
  data: SimulatorData;
  onSimulate?: (simState: any) => void;
  children?: ReactNode;
}) {
  const bucketLabels = Object.keys(data.risk_buckets);
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<Set<string>>(new Set(["multi"])); 
  const [customCostPerCustomer, setCustomCostPerCustomer] = useState(25);
  const [useCustomCost, setUseCustomCost] = useState(false);
  const [manualRetainedCount, setManualRetainedCount] = useState(0);
  const [isManualRetention, setIsManualRetention] = useState(false);

  const selectedStrategies = STRATEGIES.filter(s => selectedStrategyIds.has(s.id));
  
  const costPerCustomer = useCustomCost 
    ? customCostPerCustomer 
    : selectedStrategies.reduce((sum, s) => sum + s.costPerCustomer, 0);

  const retBoost = useCustomCost
    ? Math.min(0.05 + (customCostPerCustomer / 300) * 0.35, 0.40) 
    : Math.min(0.45, selectedStrategies.reduce((sum, s) => sum + s.retBoost, 0));

  const strategyLabel = selectedStrategies.length > 0 
    ? selectedStrategies.map(s => s.label.split(" ").slice(1).join(" ")).join(" + ")
    : "No Strategy Selected";

  const toggleStrategy = (id: string) => {
    setSelectedStrategyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setUseCustomCost(false);
  };

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

  const automaticProjections = useMemo(() => {
    return calcProjection(costPerCustomer, retBoost);
  }, [costPerCustomer, retBoost, selectedBuckets]);

  // Sync manual count to automatic projection when it changes, unless user is manually overriding
  useEffect(() => {
    if (!isManualRetention) {
      setManualRetainedCount(automaticProjections.customersSaved);
    }
  }, [automaticProjections.customersSaved, isManualRetention]);

  // Final projections based on manual override if active
  const projections = useMemo(() => {
    const { totalCustomers, totalRevAtRisk, avgCltv } = selectedBuckets;
    if (totalCustomers === 0) return { ...automaticProjections, customersSaved: 0, revenueRetained: 0, profit: 0, roi: 0 };

    const customersSaved = manualRetainedCount;
    const revenueRetained = customersSaved * avgCltv;
    const totalInvestment = totalCustomers * costPerCustomer;
    const profit = revenueRetained - totalInvestment;
    const roi = totalInvestment > 0 ? revenueRetained / totalInvestment : 0;

    return {
      ...automaticProjections,
      customersSaved,
      revenueRetained,
      totalInvestment,
      profit,
      roi
    };
  }, [manualRetainedCount, selectedBuckets, costPerCustomer, automaticProjections]);

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

  const chartLabels = useMemo(() => bucketLabels.filter((l) => selectedLevels.has(l)), [bucketLabels, selectedLevels]);
  const chartDataAtRisk = useMemo(() => chartLabels.map((l) => data.risk_buckets[l].total_revenue_at_risk), [chartLabels, data]);
  const chartDataRetained = useMemo(() => chartLabels.map((l) => {
    const b = data.risk_buckets[l];
    const adjRet = Math.min(b.retention_probability + retBoost, 0.95);
    return Math.round(b.customer_count * adjRet * b.avg_cltv);
  }), [chartLabels, data, retBoost]);
  const chartDataCustomersRetained = useMemo(() => chartLabels.map((l) => {
    const b = data.risk_buckets[l];
    const adjRet = Math.min(b.retention_probability + retBoost, 0.95);
    return Math.round(b.customer_count * adjRet);
  }), [chartLabels, data, retBoost]);

  const isProfit = projections.profit >= 0;

  // ── Emit state upward so LiveImpactTab can sync downstream charts ──
  useEffect(() => {
    if (onSimulate) {
      onSimulate({
        selectedLevels,
        strategy: { label: strategyLabel, costPerCustomer },
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
    strategyLabel,
    costPerCustomer,
    profitCurve,
    projections,
    chartLabels,
    chartDataAtRisk,
    chartDataRetained,
    chartDataCustomersRetained,
    selectedBuckets.totalCustomers,
  ]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "24px", alignItems: "start" }}>
      
      {/* ── LEFT COLUMN: Outcomes, Charts & Downstream Children ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
        
        {/* Header */}
        <div className="card" style={{ padding: "20px 28px", border: "1.5px solid var(--accent-blue)", background: "linear-gradient(135deg, rgba(0,102,204,0.04), rgba(5,150,105,0.04))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🎯</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Retention Simulator
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                Adjust risk segments on the right and investments below to dynamically project retention outcomes.
              </p>
            </div>
          </div>
        </div>

        {/* ── Step 2: Investment Strategy ── */}
        <div className="card" style={{ padding: "24px 28px", border: "1px solid var(--border)" }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px",
            color: "var(--text-muted)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ background: "var(--accent-amber)", color: "#fff", width: "20px", height: "20px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>2</span>
            Investment Strategy
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {STRATEGIES.map((s) => {
              const isActive = selectedStrategyIds.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStrategy(s.id)}
                  style={{
                    padding: "16px 20px", border: `2px solid ${!useCustomCost && isActive ? "var(--accent-blue)" : "var(--border)"}`,
                    borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
                    background: !useCustomCost && isActive ? "var(--accent-blue-light)" : "var(--bg-card)",
                    fontFamily: "inherit", transition: "all 0.2s ease",
                    display: "flex", flexDirection: "column", gap: "4px", position: "relative"
                  }}
                >
                  {isActive && (
                    <span style={{
                      position: "absolute", top: "10px", right: "12px", width: "16px", height: "16px", borderRadius: "50%",
                      background: "var(--accent-blue)", color: "#fff", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "9px", fontWeight: 800,
                    }}>✓</span>
                  )}
                  <div style={{ fontSize: "14px", fontWeight: 700, color: !useCustomCost && isActive ? "var(--accent-blue)" : "var(--text-primary)" }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.desc}</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: !useCustomCost && isActive ? "var(--accent-blue)" : "var(--text-primary)", marginTop: "8px" }}>
                    ${s.costPerCustomer} / user
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Budget Slider */}
          <div style={{ padding: "18px 24px", background: "var(--bg-input)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
                Budget per User:
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: useCustomCost ? "var(--accent-blue)" : "var(--text-muted)" }}>
                ${costPerCustomer}/user
              </span>
            </div>
            <input
              type="range"
              className="sim-slider__input"
              min={1}
              max={500}
              step={1}
              value={costPerCustomer}
              onChange={(e) => { setCustomCostPerCustomer(Number(e.target.value)); setUseCustomCost(true); }}
              style={{ background: `linear-gradient(to right, var(--accent-blue) ${(costPerCustomer / 500) * 100}%, #e2e8f0 ${(costPerCustomer / 500) * 100}%)`, marginBottom: "12px" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
              <span>$1</span>
              <span>$500</span>
            </div>
          </div>

          {/* Manual Retention Slider */}
          <div style={{ padding: "18px 24px", background: "var(--bg-input)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
                Customers Fixed to Retain:
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: isManualRetention ? "var(--accent-green)" : "var(--text-muted)" }}>
                {manualRetainedCount.toLocaleString()} users
              </span>
            </div>
            <input
              type="range"
              className="sim-slider__input sim-slider__input--green"
              min={0}
              max={selectedBuckets.totalCustomers}
              step={1}
              value={manualRetainedCount}
              onChange={(e) => { setManualRetainedCount(Number(e.target.value)); setIsManualRetention(true); }}
              style={{ 
                background: `linear-gradient(to right, var(--accent-green) ${(manualRetainedCount / Math.max(1, selectedBuckets.totalCustomers)) * 100}%, #e2e8f0 ${(manualRetainedCount / Math.max(1, selectedBuckets.totalCustomers)) * 100}%)`, 
                marginBottom: "12px" 
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
              <span>0</span>
              <span>{selectedBuckets.totalCustomers.toLocaleString()} (Total)</span>
            </div>
            {isManualRetention && (
              <button 
                onClick={() => setIsManualRetention(false)}
                style={{ 
                  marginTop: "8px", background: "none", border: "none", color: "var(--accent-blue)", 
                  fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 
                }}
              >
                ↺ Reset to AI Projection
              </button>
            )}
          </div>
        </div>

        {/* ── Projected Outcomes ── */}
        <div className="card" style={{ padding: "24px 28px", border: "1px solid var(--border)" }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px",
            color: "var(--text-muted)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ background: isProfit ? "var(--accent-green)" : "var(--accent-red)", color: "#fff", width: "20px", height: "20px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>✓</span>
            Projected Outcomes
            <span style={{
              fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)",
              background: isProfit ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)",
              color: isProfit ? "var(--accent-green)" : "var(--accent-red)",
              textTransform: "uppercase" as const,
              marginLeft: "auto"
            }}>
              {isProfit ? "✓ Profitable Scenario" : "⚠ Loss Scenario"}
            </span>
          </div>

          <div className="panel-grid panel-grid--4" style={{ marginBottom: "20px" }}>
            <div className="kpi-card kpi-card--green">
              <div className="kpi-card__label">RETENTION RATE %</div>
              <div className="kpi-card__value" style={{ fontSize: "28px" }}>
                {selectedBuckets.totalCustomers > 0 ? `${((projections.customersSaved / selectedBuckets.totalCustomers) * 100).toFixed(0)}%` : "0%"}
              </div>
              <div className="kpi-card__sub">
                {projections.customersSaved.toLocaleString()} customers saved
              </div>
            </div>
            <div className="kpi-card kpi-card--blue">
              <div className="kpi-card__label">REVENUE RETAINED</div>
              <div className="kpi-card__value" style={{ fontSize: "28px" }}>{fmtCurrency(projections.revenueRetained)}</div>
              <div className="kpi-card__sub">gross value from saved</div>
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
            padding: "14px 18px", borderRadius: "var(--radius-md)", marginBottom: 0,
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
        </div>

        {/* ── Profit vs Loss Curve ── */}
        <div>
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

        {/* ── DOWNSTREAM CHARTS (Children) ── */}
        {children && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {children}
          </div>
        )}

      </div>

      {/* ── RIGHT COLUMN: Inputs (Fixed Sidebar) ── */}
      <div style={{ position: "sticky", top: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div className="card" style={{ padding: "24px 28px", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          
          {/* ── Step 1: Risk Level Selection ── */}
          <div>
            <div style={{
              fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px",
              color: "var(--text-muted)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{ background: "var(--accent-blue)", color: "#fff", width: "20px", height: "20px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>1</span>
              Target Risk Segments
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                      borderRadius: "var(--radius-md)", background: isActive ? colors.bg : "var(--bg-card)",
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                      position: "relative", fontFamily: "inherit",
                    }}
                  >
                    {isActive && (
                      <span style={{
                        position: "absolute", top: "50%", transform: "translateY(-50%)", right: "16px", width: "20px", height: "20px", borderRadius: "50%",
                        background: colors.border, color: "#fff", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "11px", fontWeight: 700,
                      }}>✓</span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: isActive ? colors.text : "var(--text-primary)" }}>
                        {RISK_ICONS[label]} {label.split(" ")[0]}
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: isActive ? colors.text : "var(--text-primary)", marginRight: isActive ? "32px" : "0" }}>
                        {b.customer_count.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                      <span>Score: {label.match(/\(([^)]+)\)/)?.[1]}</span>
                      <span style={{ marginRight: isActive ? "32px" : "0" }}>Ret: {(b.retention_probability * 100).toFixed(0)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{
              marginTop: "16px", padding: "16px", background: "var(--accent-blue-light)",
              borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)",
              display: "flex", flexDirection: "column", gap: "10px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🎯 Targeted:</span>
                <strong style={{ color: "var(--text-primary)" }}>{selectedBuckets.totalCustomers.toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>💰 Risk Value:</span>
                <strong style={{ color: "var(--accent-red)" }}>{fmtCurrency(selectedBuckets.totalRevAtRisk)}</strong>
              </div>
              {/* <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>📈 Avg CLTV:</span>
                <strong style={{ color: "var(--accent-blue)" }}>{fmtCurrency(selectedBuckets.avgCltv)}</strong>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
