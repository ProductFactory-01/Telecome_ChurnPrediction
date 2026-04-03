"use client";
import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import OfferKPIs from "./OfferKPIs";
import OfferCharts from "./OfferCharts";
import OfferTaxonomy, { TAXONOMY, RISK_LEVELS } from "./OfferTaxonomy";
import OfferRecommendations, { Recommendation } from "./OfferRecommendations";
import OfferCohortTable from "./OfferCohortTable";
import styles from "./OfferEngine.module.css";

export default function OfferEngineTab() {
  // --- State ---
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [matchedCustomers, setMatchedCustomers] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  const [mainCat, setMainCat] = useState(TAXONOMY[0].main_category);
  const [subCat, setSubCat] = useState(TAXONOMY[0].sub_drivers[0]);
  const [riskLevel, setRiskLevel] = useState(RISK_LEVELS[0]);
  const [selectedRecId, setSelectedRecId] = useState("");
  
  const [statusMsg, setStatusMsg] = useState("Select a main category, one sub category, and a risk level to view the matching customer cohort.");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canGenerateAI, setCanGenerateAI] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // --- KPI Derived State ---
  const getRiskWeight = (level: string) => {
    const normalized = (level || "").toLowerCase();
    const weights: Record<string, number> = {
      "level 1": 0.28,
      "level 2": 0.23,
      "level 3": 0.18,
      "level 4": 0.12,
      "level 5": 0.07,
    };
    return weights[normalized] || 0.12;
  };

  const avgAcceptance = matchedCustomers.length > 0 
    ? (matchedCustomers.reduce((sum, c) => sum + getRiskWeight(c.risk_level || riskLevel), 0) / matchedCustomers.length) * 100
    : 0;
    
  const revenueProtected = Math.round(
    matchedCustomers.reduce((sum, c) => sum + (getRiskWeight(c.risk_level || riskLevel) * 650), 0)
  );

  const selectedRec = recommendations.find(r => r.plan_id === selectedRecId);
  const gamificationActive = (selectedRec?.offer_type || "").toLowerCase() === "gamification";

  // --- API Actions ---

  const loadInitialData = useCallback(async () => {
    try {
      const resp = await api.get("/offer-engine/customers");
      setAllCustomers(resp.data || []);
      // If we have customers, we could trigger a match automatically
    } catch (e) {
      console.error("Failed to load initial customers", e);
      setFetchError("Customer data fetch failed. Check backend connection.");
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleViewCustomers = async () => {
    setIsLoading(true);
    setStatusMsg("Matching customers to selected criteria...");
    setFetchError("");
    setMatchedCustomers([]);
    setRecommendations([]);
    setSelectedRecId("");
    setCanGenerateAI(false);

    try {
      const resp = await api.post("/offer-engine/match-customers", {
        customers: allCustomers,
        taxonomy: TAXONOMY,
        selected_main_category: mainCat,
        selected_sub_category: subCat,
        selected_risk_level: riskLevel,
      });

      const rows = resp.data.offers || [];
      setMatchedCustomers(rows);
      
      if (rows.length > 0) {
        setStatusMsg(`Matched ${rows.length} customers. You can now click "Generate Offer" to run AI strategy analysis.`);
        setCanGenerateAI(true);
      } else {
        setStatusMsg("No customers matched for the selected criteria.");
      }
    } catch (e: any) {
      setFetchError(e.response?.data?.detail || "Customer matching failed.");
      setStatusMsg("Matching failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (matchedCustomers.length === 0) return;
    setIsLoading(true);
    setStatusMsg("Generating AI-suggested offers and rationales for the cohort...");
    
    try {
      await generatePerCustomerOffers(matchedCustomers);
    } catch (e: any) {
      setFetchError(e.response?.data?.detail || "AI generation failed.");
      setIsLoading(false);
    }
  };

  const generatePerCustomerOffers = async (rows: any[]) => {
    try {
      const resp = await api.post("/offer-engine/generate-offers", {
        customers: rows,
        selected_main_category: mainCat,
        selected_sub_category: subCat,
        selected_risk_level: riskLevel,
      });

      const enrichedRows = resp.data.offers || [];
      setMatchedCustomers(enrichedRows);
      
      // After per-customer, get cohort recommendations
      await fetchRecommendations(enrichedRows);
    } catch (e: any) {
      console.error("Per-customer generation failed", e);
      // Continue to recommendations even if individual generation fails
      await fetchRecommendations(rows);
    }
  };

  const fetchRecommendations = async (rows: any[]) => {
    setStatusMsg("Analyzing cohort to generate 3 strategic retention plan recommendations...");
    try {
      const resp = await api.post("/offer-engine/recommendations", {
        customers: rows,
        taxonomy: TAXONOMY,
        selected_main_category: mainCat,
        selected_sub_category: subCat,
        selected_risk_level: riskLevel,
      });

      const recs = resp.data.recommendations || [];
      setRecommendations(recs.sort((a: any, b: any) => 
        (Number(b.projected_reduction_pct) || 0) - (Number(a.projected_reduction_pct) || 0)
      ));
      setStatusMsg(`Success! Generated ${recs.length} plan recommendations. Select a strategy to finalize the campaign.`);
    } catch (e: any) {
      setFetchError(e.response?.data?.detail || "Recommendation fetch failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveOffer = async () => {
    if (!selectedRec) return;
    setIsSaving(true);
    setStatusMsg("Saving finalized offer cohort and campaign strategy...");
    try {
      const resp = await api.post("/offer-engine/save-offer", {
        customers: matchedCustomers,
        selected_main_category: mainCat,
        selected_sub_category: subCat,
        selected_risk_level: riskLevel,
        selected_recommendation: selectedRec,
      });
      setStatusMsg(`Cohort successfully persisted! Campaign: ${resp.data.document_name || "N/A"}.`);
    } catch (e: any) {
      setStatusMsg(`Campaign save failed: ${e.response?.data?.detail || "Error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- UI Handlers ---
  const handleMainChange = (val: string) => {
    setMainCat(val);
    const firstSub = TAXONOMY.find(t => t.main_category === val)?.sub_drivers[0] || "";
    setSubCat(firstSub);
    setMatchedCustomers([]);
    setRecommendations([]);
    setSelectedRecId("");
    setCanGenerateAI(false);
    setStatusMsg("Criteria changed. Please click 'View Customers' to refresh the cohort.");
  };

  const handleSubChange = (val: string) => {
    setSubCat(val);
    setMatchedCustomers([]);
    setRecommendations([]);
    setSelectedRecId("");
    setCanGenerateAI(false);
    setStatusMsg("Criteria changed. Please click 'View Customers' to refresh the cohort.");
  };

  const handleRiskChange = (val: string) => {
    setRiskLevel(val);
    setMatchedCustomers([]);
    setRecommendations([]);
    setSelectedRecId("");
    setCanGenerateAI(false);
    setStatusMsg("Criteria changed. Please click 'View Customers' to refresh the cohort.");
  };

  const handleRecSelect = (id: string) => {
    setSelectedRecId(id);
    const rec = recommendations.find(r => r.plan_id === id);
    setStatusMsg(`Selected "${rec?.offer_type || rec?.title}". You can now generate and save the offer cohort document.`);
  };

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

      <div className={styles.offerBuilder}>
        <OfferTaxonomy
          selectedMain={mainCat}
          selectedSub={subCat}
          selectedRisk={riskLevel}
          onMainChange={handleMainChange}
          onSubChange={handleSubChange}
          onRiskChange={handleRiskChange}
          onViewCustomers={handleViewCustomers}
          onGenerateAI={handleGenerateAI}
          status={statusMsg}
          isLoading={isLoading}
          canGenerateAI={canGenerateAI}
          canViewCustomers={allCustomers.length > 0}
        />

        <OfferRecommendations
          recommendations={recommendations}
          selectedId={selectedRecId}
          onSelect={handleRecSelect}
          isLoading={isLoading}
        />
      </div>

      {selectedRecId && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
          <button 
            className="btn btn--primary" 
            onClick={saveOffer}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Offer Cohort"}
          </button>
        </div>
      )}

      {fetchError && (
        <div className="alert alert--error mb-4">
          {fetchError}
        </div>
      )}

      <OfferCohortTable customers={matchedCustomers} />

      <div className="mt-8">
        <OfferKPIs
          generatedCount={matchedCustomers.length}
          avgAcceptance={avgAcceptance}
          gamificationActive={gamificationActive}
          revenueProtected={revenueProtected}
        />

        <OfferCharts />
      </div>
    </div>
  );
}
