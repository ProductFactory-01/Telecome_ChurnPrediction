"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import SectionTitle from "../shared/SectionTitle";
import KpiCard from "../shared/KpiCard";
import ChartCard from "../shared/ChartCard";
import { Bar } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

export default function OfferEngineTab() {
  const [data, setData] = useState<any>(null);
  const [mainCat, setMainCat] = useState("");
  const [subCat, setSubCat] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedRec, setSelectedRec] = useState<number | null>(null);

  useEffect(() => {
    api.get("/offer-engine").then((r) => {
      setData(r.data);
      if (r.data.taxonomy?.length) {
        setMainCat(r.data.taxonomy[0].main_category);
        setSubCat(r.data.taxonomy[0].sub_drivers?.[0] || "");
      }
      if (r.data.risk_levels?.length) setRiskLevel(r.data.risk_levels[0]);
    }).catch(console.error);
  }, []);

  const fetchRecommendations = async () => {
    try {
      const r = await api.post("/offer-engine/recommendations", {
        selected_main_category: mainCat, selected_sub_category: subCat,
        selected_risk_level: riskLevel, customers: [], taxonomy: [],
      });
      setRecommendations(r.data.recommendations);
      setSelectedRec(null);
    } catch (e) { console.error(e); }
  };

  if (!data) return <div className="dashboard-content text-muted">Loading…</div>;

  const currentTax = data.taxonomy?.find((t: any) => t.main_category === mainCat);

  return (
    <div className="dashboard-content">
      <AgentHeader icon="🎁" title="Agent 3 — AI Offer Engine" subtitle="Personalised retention offers based on churn risk taxonomy" color="green" />

      <SectionTitle title="Cohort Selection" description="Select target segment" color="green" />

      <div className="taxonomy-row mb-6">
        <div className="taxonomy-field">
          <div className="taxonomy-field__label">Main Category</div>
          <select className="taxonomy-field__select" value={mainCat} onChange={(e) => {
            setMainCat(e.target.value);
            const tax = data.taxonomy?.find((t: any) => t.main_category === e.target.value);
            setSubCat(tax?.sub_drivers?.[0] || "");
          }}>
            {data.taxonomy?.map((t: any) => <option key={t.main_category} value={t.main_category}>{t.main_category}</option>)}
          </select>
        </div>
        <div className="taxonomy-field">
          <div className="taxonomy-field__label">Sub Category</div>
          <select className="taxonomy-field__select" value={subCat} onChange={(e) => setSubCat(e.target.value)}>
            {currentTax?.sub_drivers?.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="taxonomy-field">
          <div className="taxonomy-field__label">Risk Level</div>
          <select className="taxonomy-field__select" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            {data.risk_levels?.map((l: string) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button className="btn btn--primary" onClick={fetchRecommendations}>🤖 Generate Offers</button>
      </div>

      {recommendations.length > 0 && (
        <>
          <SectionTitle title="AI Recommendations" color="purple" />
          <div className="panel-grid panel-grid--3 mb-6">
            {recommendations.map((rec, i) => (
              <div key={i} className={`rec-card ${selectedRec === i ? "rec-card--selected" : ""}`} onClick={() => setSelectedRec(i)}>
                <div className="rec-card__title">
                  {rec.offer_type === "Discount" ? "💰" : rec.offer_type === "Custom Bundle" ? "📦" : "⬆️"}
                  {rec.title}
                </div>
                <div className="rec-card__summary">{rec.offer_summary}</div>
                <div className="rec-card__impact">-{rec.projected_reduction_pct}%</div>
                <div className="rec-card__target">Target: {rec.projected_target_level}</div>
                <div className="rec-card__reason">{rec.why_it_fits}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="panel-grid panel-grid--2 mt-6">
        <ChartCard title="Offer Effectiveness (%)" icon="📊">
          <Bar data={{
            labels: data.charts.effectiveness.labels,
            datasets: [{
              label: "Acceptance Rate", data: data.charts.effectiveness.values,
              backgroundColor: [COLORS.blueAlpha, COLORS.cyanAlpha, COLORS.greenAlpha, COLORS.purpleAlpha, COLORS.amberAlpha],
              borderColor: [COLORS.blue, COLORS.cyan, COLORS.green, COLORS.purple, COLORS.amber],
              borderWidth: 1, borderRadius: 6,
            }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
        <ChartCard title="Acceptance by Risk Level" icon="📈">
          <Bar data={{
            labels: data.charts.acceptance_by_risk.labels,
            datasets: [
              { label: "Generic", data: data.charts.acceptance_by_risk.generic, backgroundColor: COLORS.redAlpha, borderColor: COLORS.red, borderWidth: 1, borderRadius: 4 },
              { label: "AI Personalised", data: data.charts.acceptance_by_risk.ai_personalised, backgroundColor: COLORS.greenAlpha, borderColor: COLORS.green, borderWidth: 1, borderRadius: 4 },
            ],
          }} options={defaultOptions} />
        </ChartCard>
      </div>
    </div>
  );
}
