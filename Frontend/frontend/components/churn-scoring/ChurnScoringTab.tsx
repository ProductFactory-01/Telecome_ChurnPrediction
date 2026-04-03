import { useEffect, useState } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import SectionTitle from "../shared/SectionTitle";
import SimulatorForm from "./SimulatorForm";
import SubscriberTable from "./SubscriberTable";
import CustomerDetails from "./CustomerDetails";

export default function ChurnScoringTab() {
  const [activeTab, setActiveTab] = useState<"simulator" | "intelligence">("simulator");
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

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

  // If a customer is selected, show the details view instead of the tabs
  if (selectedCustomerId) {
    return (
      <div className="dashboard-content">
        <CustomerDetails 
          customerId={selectedCustomerId} 
          onBack={() => setSelectedCustomerId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="dashboard-content space-y-6">
      <AgentHeader
        number="2"
        title="Churn Propensity Scoring Agent"
        subtitle="Daily churn risk scoring using gradient boosting — producing actionable churn risk ranks"
        color="amber"
        statusLabel="Scoring Live"
        statusType="scoring"
      />

      <div className="flex gap-4 border-b border-slate-100 pb-1">
        <button
          className={`pb-3 px-6 text-[13px] font-bold transition-all relative ${activeTab === "simulator" ? "text-amber-600" : "text-slate-400 hover:text-slate-600"}`}
          onClick={() => setActiveTab("simulator")}
        >
          Simulator Prediction
          {activeTab === "simulator" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-full animate-in fade-in zoom-in duration-300"></div>}
        </button>
        <button
          className={`pb-3 px-6 text-[13px] font-bold transition-all relative ${activeTab === "intelligence" ? "text-amber-600" : "text-slate-400 hover:text-slate-600"}`}
          onClick={() => setActiveTab("intelligence")}
        >
          Customer 360
          {activeTab === "intelligence" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-full animate-in fade-in zoom-in duration-300"></div>}
        </button>
      </div>

      <div className="animate-in fade-in-50 duration-500">
        {activeTab === "simulator" ? (
          <SimulatorForm onPredict={handlePredict} onReset={handleReset} loading={loading} result={prediction} />
        ) : (
          <div className="space-y-4">
            <SubscriberTable onViewDetail={(id) => setSelectedCustomerId(id)} />
          </div>
        )}
      </div>
    </div>
  );
}
