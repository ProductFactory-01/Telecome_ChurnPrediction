"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import SectionTitle from "../shared/SectionTitle";
import SimulatorForm from "./SimulatorForm";
import SubscriberTable from "./SubscriberTable";

export default function ChurnScoringTab() {
  const [activeTab, setActiveTab] = useState<"simulator" | "intelligence">("simulator");
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (formData: any) => {
    setLoading(true);
    try {
      const r = await api.post("/predict", formData);
      setPrediction(r.data);
    } catch (e: any) {
      alert("Prediction failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setPrediction(null);

  return (
    <div className="dashboard-content">
      <AgentHeader
        number="2"
        title="Churn Propensity Scoring Agent"
        subtitle="Daily churn risk scoring using gradient boosting — producing actionable churn risk ranks"
        color="amber"
        statusLabel="Scoring Live"
        statusType="scoring"
      />

      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-1">
        <button
          className={`pb-2 px-4 font-semibold text-sm transition-all ${activeTab === "simulator" ? "border-b-2 border-amber-500 text-amber-600" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("simulator")}
        >
          Simulator Prediction
        </button>
        <button
          className={`pb-2 px-4 font-semibold text-sm transition-all ${activeTab === "intelligence" ? "border-b-2 border-amber-500 text-amber-600" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("intelligence")}
        >
          Customer 360
        </button>
      </div>

      {activeTab === "simulator" ? (
        <SimulatorForm onPredict={handlePredict} onReset={handleReset} loading={loading} result={prediction} />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionTitle title="Subscriber Intelligence Database" color="blue" />
          <SubscriberTable />
        </div>
      )}
    </div>
  );
}
