"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import SectionTitle from "../shared/SectionTitle";
import KpiCard from "../shared/KpiCard";
import ChartCard from "../shared/ChartCard";
import { Line, Bar } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

export default function LiveImpactTab() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/impact").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <div className="dashboard-content text-muted">Loading…</div>;

  const o = data.outcomes;
  const m = data.meters;

  return (
    <div className="dashboard-content">
      <SectionTitle title="Live Impact Dashboard" description="Real-time tracking of retention outcomes" color="green" />

      <div className="panel-grid panel-grid--4 mb-6">
        <KpiCard label="Churn Reduction" value={o.churn_reduction} color="green" />
        <KpiCard label="Offer Acceptance" value={o.offer_acceptance_rate} color="blue" />
        <KpiCard label="CLV Increase" value={o.clv_increase} color="purple" />
        <KpiCard label="Cost Saving" value={o.cost_saving} color="amber" />
      </div>

      <SectionTitle title="Performance Meters" color="cyan" />
      <div className="card mb-6" style={{ padding: 24 }}>
        {[
          { label: "Identification Rate", val: m.identification_rate.value, max: 100, color: "green" },
          { label: "Offer Uplift", val: m.offer_uplift.value, max: 100, color: "blue" },
          { label: "Revenue Protected", val: (m.revenue_protected.value / m.revenue_protected.target) * 100, max: 100, color: "amber" },
        ].map((meter) => (
          <div key={meter.label} className="meter">
            <div className="meter__label">
              <span>{meter.label}</span>
              <span>{meter.val.toFixed(0)}%</span>
            </div>
            <div className="meter__bar">
              <div className={`meter__fill meter__fill--${meter.color}`} style={{ width: `${Math.min(meter.val, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="panel-grid panel-grid--2">
        <ChartCard title="Churn Over Time" icon="📉">
          <Line data={{
            labels: data.charts.churn_over_time.labels,
            datasets: [
              { label: "Baseline", data: data.charts.churn_over_time.baseline, borderColor: COLORS.red, borderDash: [6, 3], tension: 0.3, fill: false },
              { label: "With AI", data: data.charts.churn_over_time.with_ai, borderColor: COLORS.green, backgroundColor: "rgba(16,185,129,0.1)", tension: 0.3, fill: true },
            ],
          }} options={defaultOptions} />
        </ChartCard>
        <ChartCard title="A/B Test Results" icon="🧪">
          <Bar data={{
            labels: data.charts.ab_test.labels,
            datasets: [
              { label: "Control", data: data.charts.ab_test.control, backgroundColor: COLORS.redAlpha, borderColor: COLORS.red, borderWidth: 1, borderRadius: 4 },
              { label: "AI Group",  data: data.charts.ab_test.ai_group, backgroundColor: COLORS.greenAlpha, borderColor: COLORS.green, borderWidth: 1, borderRadius: 4 },
            ],
          }} options={defaultOptions} />
        </ChartCard>
      </div>

      <div className="card mt-6" style={{ padding: 20 }}>
        <div className="card__title" style={{ marginBottom: 16 }}>💰 ROI Summary</div>
        <div className="panel-grid panel-grid--4">
          <div><div className="kpi-card__label">Revenue Protected</div><div className="kpi-card__value text-green">{data.roi.revenue_protected}</div></div>
          <div><div className="kpi-card__label">Subscribers Retained</div><div className="kpi-card__value text-blue">{data.roi.subscribers_retained}</div></div>
          <div><div className="kpi-card__label">Detection Accuracy</div><div className="kpi-card__value text-purple">{data.roi.detection_accuracy}</div></div>
          <div><div className="kpi-card__label">Signal → Action</div><div className="kpi-card__value text-amber">{data.roi.signal_to_action}</div></div>
        </div>
      </div>
    </div>
  );
}
