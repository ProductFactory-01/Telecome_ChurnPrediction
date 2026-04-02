"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import SectionTitle from "../shared/SectionTitle";
import KpiCard from "../shared/KpiCard";
import SimulatorForm from "./SimulatorForm";
import PredictionResult from "./PredictionResult";
import SubscriberTable from "./SubscriberTable";
import { Bar } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import ChartCard from "../shared/ChartCard";

interface Props {
  onViewCustomer?: (id: string) => void;
}

export default function ChurnScoringTab({ onViewCustomer }: Props) {
  const [scoringData, setScoringData] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/churn-scoring").then((r) => setScoringData(r.data)).catch(console.error);
  }, []);

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

  return (
    <div className="dashboard-content">
      <AgentHeader icon="🎯" title="Agent 2 — Churn Scoring Engine" subtitle="ML-powered propensity scoring with real-time prediction" color="amber" />

      {scoringData && (
        <div className="panel-grid panel-grid--4 mb-6">
          <KpiCard label="Live Score" value={scoringData.live_score} color="amber" />
          <KpiCard label="Risk Rank" value={scoringData.risk_rank} color="red" />
          <KpiCard label="Risk Percentile" value={scoringData.risk_percent} color="purple" />
          <KpiCard label="Primary Driver" value={scoringData.primary_driver} color="blue" />
        </div>
      )}

      <SectionTitle title="Interactive Simulator" description="Test churn probability with custom inputs" color="amber" />

      <div className="panel-grid panel-grid--2 mb-6">
        <SimulatorForm onPredict={handlePredict} loading={loading} />
        <PredictionResult result={prediction} />
      </div>

      <SectionTitle title="Subscriber Intelligence" color="blue" />
      <SubscriberTable onViewCustomer={onViewCustomer} />

      {scoringData && (
        <div className="panel-grid panel-grid--2 mt-6">
          <ChartCard title="Risk Distribution" icon="📊">
            <Bar
              data={{
                labels: scoringData.risk_distribution.labels,
                datasets: [{
                  label: "Subscribers",
                  data: scoringData.risk_distribution.values,
                  backgroundColor: [COLORS.redAlpha, COLORS.amberAlpha, COLORS.greenAlpha],
                  borderColor: [COLORS.red, COLORS.amber, COLORS.green],
                  borderWidth: 1,
                  borderRadius: 6,
                }],
              }}
              options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }}
            />
          </ChartCard>
          <ChartCard title="Feature Importance" icon="🔬">
            <Bar
              data={{
                labels: scoringData.feature_importance.labels,
                datasets: [{
                  label: "Importance",
                  data: scoringData.feature_importance.values,
                  backgroundColor: COLORS.blueAlpha,
                  borderColor: COLORS.blue,
                  borderWidth: 1,
                  borderRadius: 4,
                }],
              }}
              options={{
                ...defaultOptions,
                indexAxis: "y" as const,
                plugins: { ...defaultOptions.plugins, legend: { display: false } },
              }}
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
