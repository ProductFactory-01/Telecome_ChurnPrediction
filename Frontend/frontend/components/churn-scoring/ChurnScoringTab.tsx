"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import SectionTitle from "../shared/SectionTitle";
import SimulatorForm from "./SimulatorForm";
import SubscriberTable from "./SubscriberTable";

interface Props {
  onViewCustomer?: (id: string) => void;
}

export default function ChurnScoringTab({ onViewCustomer }: Props) {
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

      <SimulatorForm onPredict={handlePredict} onReset={handleReset} loading={loading} result={prediction} />

      <div className="mt-6">
        <SectionTitle title="Subscriber Intelligence" color="blue" />
        <SubscriberTable onViewCustomer={onViewCustomer} />
      </div>
    </div>
  );
}
