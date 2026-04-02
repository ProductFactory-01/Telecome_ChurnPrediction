"use client";
import { useState } from "react";

interface FormData {
  Gender: string; SeniorCitizen: boolean; Partner: boolean; Dependents: boolean;
  TenureMonths: number; PhoneService: boolean; MultipleLines: boolean; InternetService: string;
  OnlineSecurity: boolean; OnlineBackup: boolean; DeviceProtection: boolean; TechSupport: boolean;
  StreamingTV: boolean; StreamingMovies: boolean; Contract: string; PaperlessBilling: boolean;
  PaymentMethod: string; MonthlyCharges: number; TotalCharges: number;
}

interface Props {
  onPredict: (data: FormData) => void;
  loading: boolean;
}

export default function SimulatorForm({ onPredict, loading }: Props) {
  const [form, setForm] = useState<FormData>({
    Gender: "Male", SeniorCitizen: false, Partner: false, Dependents: false,
    TenureMonths: 12, PhoneService: true, MultipleLines: false, InternetService: "Fiber optic",
    OnlineSecurity: false, OnlineBackup: false, DeviceProtection: false, TechSupport: false,
    StreamingTV: false, StreamingMovies: false, Contract: "Month-to-month", PaperlessBilling: true,
    PaymentMethod: "Electronic check", MonthlyCharges: 70, TotalCharges: 840,
  });

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__title">🧪 Churn Simulator</div>
      </div>
      <div className="sim-form">
        <div className="sim-field">
          <label className="sim-field__label">Gender</label>
          <select className="sim-field__select" value={form.Gender} onChange={(e) => set("Gender", e.target.value)}>
            <option>Male</option><option>Female</option>
          </select>
        </div>
        <div className="sim-field">
          <label className="sim-field__label">Internet Service</label>
          <select className="sim-field__select" value={form.InternetService} onChange={(e) => set("InternetService", e.target.value)}>
            <option>DSL</option><option>Fiber optic</option><option>No</option>
          </select>
        </div>
        <div className="sim-field">
          <label className="sim-field__label">Contract</label>
          <select className="sim-field__select" value={form.Contract} onChange={(e) => set("Contract", e.target.value)}>
            <option>Month-to-month</option><option>One year</option><option>Two year</option>
          </select>
        </div>
        <div className="sim-field">
          <label className="sim-field__label">Payment Method</label>
          <select className="sim-field__select" value={form.PaymentMethod} onChange={(e) => set("PaymentMethod", e.target.value)}>
            <option>Electronic check</option><option>Mailed check</option>
            <option>Bank transfer (automatic)</option><option>Credit card (automatic)</option>
          </select>
        </div>
        <div className="sim-field">
          <label className="sim-field__label">Tenure (months)</label>
          <input className="sim-field__input" type="number" min={0} max={72} value={form.TenureMonths} onChange={(e) => set("TenureMonths", +e.target.value)} />
        </div>
        <div className="sim-field">
          <label className="sim-field__label">Monthly Charges ($)</label>
          <input className="sim-field__input" type="number" min={0} step={0.1} value={form.MonthlyCharges} onChange={(e) => set("MonthlyCharges", +e.target.value)} />
        </div>
        <div className="sim-field">
          <label className="sim-field__label">Total Charges ($)</label>
          <input className="sim-field__input" type="number" min={0} step={0.1} value={form.TotalCharges} onChange={(e) => set("TotalCharges", +e.target.value)} />
        </div>

        {(["SeniorCitizen", "Partner", "Dependents", "PhoneService", "MultipleLines", "OnlineSecurity", "OnlineBackup", "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies", "PaperlessBilling"] as const).map((key) => (
          <div key={key} className="sim-field">
            <div className="sim-field__checkbox">
              <input type="checkbox" checked={form[key] as boolean} onChange={(e) => set(key, e.target.checked)} id={`sim-${key}`} />
              <label htmlFor={`sim-${key}`} style={{ fontSize: 13, color: "var(--text-secondary)" }}>{key.replace(/([A-Z])/g, " $1").trim()}</label>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn--primary" onClick={() => onPredict(form)} disabled={loading}>
          {loading ? "⏳ Predicting…" : "🚀 Run Prediction"}
        </button>
      </div>
    </div>
  );
}
