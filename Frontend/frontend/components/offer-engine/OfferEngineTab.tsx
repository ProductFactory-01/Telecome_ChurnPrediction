"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import SectionTitle from "../shared/SectionTitle";

export default function OfferEngineTab() {
  const [data, setData] = useState<any>(null);
  const [mainCat, setMainCat] = useState("");
  const [subCat, setSubCat] = useState("");
  const [riskLevel, setRiskLevel] = useState("Level 1");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedRec, setSelectedRec] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    api.get("/offer-engine").then((r) => {
      setData(r.data);
      if (r.data.taxonomy?.length) {
        setMainCat(r.data.taxonomy[0].main_category);
        setSubCat(r.data.taxonomy[0].sub_drivers?.[0] || "");
      }
    }).catch(console.error);
  }, []);

  const currentTax = data?.taxonomy?.find((t: any) => t.main_category === mainCat);

  const fetchRecommendations = async () => {
    setFetchError("");
    try {
      const r = await api.post("/offer-engine/recommendations", {
        selected_main_category: mainCat, selected_sub_category: subCat,
        selected_risk_level: riskLevel, customers: [], taxonomy: [],
      });
      setRecommendations(r.data.recommendations || []);
      setSelectedRec(null);
    } catch (e: any) {
      setFetchError(e.response?.data?.detail || "Customer data fetch failed. No data returned.");
    }
  };

  if (!data) return <div className="dashboard-content text-muted">Loading…</div>;

  const riskLevels = data.risk_levels || ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];

  return (
    <div className="dashboard-content">
      <AgentHeader
        number="3"
        title="Personalised Offer Generation Agent"
        subtitle="Craft tailored retention offers through discounts, upgrades, loyalty rewards, gamification, and bundles"
        color="green"
        statusLabel="Generating"
        statusType="generating"
      />

      <div className="panel-grid panel-grid--sidebar">
        {/* Left — Taxonomy selectors */}
        <div className="card">
          <div className="card__title" style={{ marginBottom: 16 }}>Offer Intelligence Taxonomy</div>

          <div className="pill-group">
            <span className="pill-group__label">Main Category</span>
            {data.taxonomy?.map((t: any) => (
              <button key={t.main_category}
                className={`pill-btn ${mainCat === t.main_category ? "pill-btn--active" : ""}`}
                onClick={() => { setMainCat(t.main_category); setSubCat(t.sub_drivers?.[0] || ""); }}
              >
                {t.main_category}
              </button>
            ))}
          </div>

          {currentTax?.sub_drivers?.length > 0 && (
            <div className="pill-group">
              <span className="pill-group__label">Sub Category</span>
              {currentTax.sub_drivers.map((s: string) => (
                <button key={s}
                  className={`pill-btn ${subCat === s ? "pill-btn--active" : ""}`}
                  onClick={() => setSubCat(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="pill-group">
            <span className="pill-group__label">Risk Level</span>
            {riskLevels.map((l: string) => (
              <button key={l}
                className={`pill-btn ${riskLevel === l ? "pill-btn--active-green" : ""}`}
                onClick={() => setRiskLevel(l)}
              >
                {l}
              </button>
            ))}
          </div>

          <button className="btn btn--primary" onClick={fetchRecommendations}>🤖 Generate Offer</button>

          {fetchError && <div style={{ marginTop: 12, fontSize: 12, color: "var(--accent-red)" }}>{fetchError}</div>}
        </div>

        {/* Right — Recommendations */}
        <div className="card">
          <div className="card__title" style={{ marginBottom: 16 }}>AI Offer Recommendations</div>

          {recommendations.length === 0 ? (
            <div style={{ padding: 24, background: "#f8fafc", borderRadius: 8, color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
              No recommendations yet. Select filters and wait for the AI recommendations to load.
            </div>
          ) : (
            recommendations.map((rec, i) => (
              <div key={i} className={`rec-card ${selectedRec === i ? "rec-card--selected" : ""}`} onClick={() => setSelectedRec(i)}>
                <div className="rec-card__title">{rec.title}</div>
                <div className="rec-card__summary">{rec.offer_summary}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="rec-card__impact">-{rec.projected_reduction_pct}%</div>
                  <div className="rec-card__target">{rec.projected_target_level}</div>
                </div>
                {rec.why_it_fits && <div className="rec-card__reason">{rec.why_it_fits}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle title="Matched Customer Cohort" description="This table shows only the customers matched for the currently selected main category, sub category, and risk level" color="green" />
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th><th>Country</th><th>State</th><th>City</th><th>Zip Code</th>
                <th>Gender</th><th>Senior Citizen</th><th>Partner</th><th>Dependents</th>
                <th>Tenure Months</th><th>Internet Service</th><th>Contract</th>
                <th>Payment Method</th><th>Monthly Charges</th><th>Total Charges</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={15} style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
                Generate an offer to see matched customers
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
