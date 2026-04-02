"use client";

interface Props {
  result: {
    churn_probability: number;
    churn_prediction: number;
    risk_level: string;
    churn_reason: { main_category: string; sub_category: string; reason: string } | null;
  } | null;
}

export default function PredictionResult({ result }: Props) {
  if (!result) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
        <div style={{ color: "var(--text-muted)" }}>Run the simulator to see churn prediction</div>
      </div>
    );
  }

  const prob = result.churn_probability;
  const variant = prob > 0.7 ? "high" : prob > 0.4 ? "medium" : "low";
  const color = prob > 0.7 ? "var(--accent-red)" : prob > 0.4 ? "var(--accent-amber)" : "var(--accent-green)";

  return (
    <div className={`prediction-result prediction-result--${variant}`}>
      <div className="prediction-result__prob" style={{ color }}>{(prob * 100).toFixed(1)}%</div>
      <div className="prediction-result__label" style={{ color }}>{result.risk_level} Risk</div>

      {result.churn_reason && (
        <div style={{ marginTop: 20, textAlign: "left", fontSize: 13, color: "var(--text-secondary)" }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Category:</span> {result.churn_reason.main_category} → {result.churn_reason.sub_category}
          </div>
          <div>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Reason:</span> {result.churn_reason.reason}
          </div>
        </div>
      )}
    </div>
  );
}
