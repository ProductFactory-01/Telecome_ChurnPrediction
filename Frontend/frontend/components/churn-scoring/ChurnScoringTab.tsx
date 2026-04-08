"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
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

  if (selectedCustomerId) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 mt-6 lg:mt-10">
        <CustomerDetails 
          customerId={selectedCustomerId} 
          onBack={() => setSelectedCustomerId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 mt-6 lg:mt-10">
      
      {/* 1. Agent Branding */}
      <AgentHeader
        number="2"
        title="Predictive Churn Scoring Agent"
        subtitle="Ranked propensity scoring engine"
        color="amber"
      />

      {/* 2. Management Switcher - Segmented Control */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100/80 backdrop-blur-md rounded-[20px] shadow-sm border border-slate-200/50">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300
              ${activeTab === "simulator" 
                ? "bg-white text-amber-600 shadow-xl shadow-amber-600/10" 
                : "text-slate-400 hover:text-slate-600"}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "simulator" ? "bg-amber-500 animate-pulse" : "bg-slate-300"}`} />
            Simulator Prediction
          </button>
          
          <button
            onClick={() => setActiveTab("intelligence")}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300
              ${activeTab === "intelligence" 
                ? "bg-white text-indigo-600 shadow-xl shadow-indigo-600/10" 
                : "text-slate-400 hover:text-slate-600"}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "intelligence" ? "bg-indigo-500 animate-pulse" : "bg-slate-300"}`} />
            Customer 360 Intel
          </button>
        </div>
      </div>

      {/* 3. Main Workspace */}
      <div className="animate-in fade-in zoom-in-95 duration-500 pt-2">
        {activeTab === "simulator" ? (
          <SimulatorForm onPredict={handlePredict} onReset={handleReset} loading={loading} result={prediction} />
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-200/60 p-1 shadow-sm overflow-hidden">
            <SubscriberTable onViewDetail={(id) => setSelectedCustomerId(id)} />
          </div>
        )}
      </div>
    </div>
  );
}
