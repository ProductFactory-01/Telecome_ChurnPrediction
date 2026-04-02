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
  onReset: () => void;
  loading: boolean;
  result: any;
}

export default function SimulatorForm({ onPredict, onReset, loading, result }: Props) {
  const [form, setForm] = useState<FormData>({
    Gender: "Male", SeniorCitizen: false, Partner: true, Dependents: false,
    TenureMonths: 6, PhoneService: true, MultipleLines: false, InternetService: "Fiber optic",
    OnlineSecurity: false, OnlineBackup: false, DeviceProtection: false, TechSupport: false,
    StreamingTV: false, StreamingMovies: false, Contract: "Month-to-month", PaperlessBilling: true,
    PaymentMethod: "Electronic check", MonthlyCharges: 75, TotalCharges: 450,
  });

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const Toggle = ({ label, field }: { label: string; field: keyof FormData }) => (
    <div className="toggle-row">
      <span className="toggle-row__label">{label}</span>
      <button
        type="button"
        className={`toggle-switch ${form[field] ? "toggle-switch--on" : ""}`}
        onClick={() => set(field, !form[field])}
      />
    </div>
  );

  const prob = result?.churn_probability ?? 0;
  const riskLevel = result?.risk_level || null;
  const badgeClass = !result ? "none" : prob > 0.7 ? "high" : prob > 0.4 ? "medium" : "low";

  return (
    <div className="panel-grid panel-grid--sidebar">
      {/* Left — Simulator form */}
      <div>
        {/* Demographics & Contract */}
        <div className="sim-section">
          <div className="sim-section__title">Demographics &amp; Contract</div>

          <div className="sim-row">
            <div className="sim-field">
              <label className="sim-field__label">Gender</label>
              <select className="sim-field__select" value={form.Gender} onChange={(e) => set("Gender", e.target.value)}>
                <option>Male</option><option>Female</option>
              </select>
            </div>
            <div className="sim-field">
              <label className="sim-field__label">Contract Type</label>
              <select className="sim-field__select" value={form.Contract} onChange={(e) => set("Contract", e.target.value)}>
                <option>Month-to-month</option><option>One year</option><option>Two year</option>
              </select>
            </div>
          </div>

          <Toggle label="Senior Citizen" field="SeniorCitizen" />
          <Toggle label="Partner" field="Partner" />
          <Toggle label="Dependents" field="Dependents" />
          <Toggle label="Paperless Billing" field="PaperlessBilling" />
        </div>

        {/* Services & Internet */}
        <div className="sim-section">
          <div className="sim-section__title">Services &amp; Internet</div>

          <div className="sim-row">
            <div className="sim-field">
              <label className="sim-field__label">Internet Service</label>
              <select className="sim-field__select" value={form.InternetService} onChange={(e) => set("InternetService", e.target.value)}>
                <option>DSL</option><option>Fiber optic</option><option>No</option>
              </select>
            </div>
            <div className="sim-field">
              <label className="sim-field__label">Payment Method</label>
              <select className="sim-field__select" value={form.PaymentMethod} onChange={(e) => set("PaymentMethod", e.target.value)}>
                <option>Electronic check</option><option>Mailed check</option>
                <option>Bank transfer (automatic)</option><option>Credit card (automatic)</option>
              </select>
            </div>
          </div>

          <div className="sim-row--4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            <Toggle label="Phone Service" field="PhoneService" />
            <Toggle label="Multiple Lines" field="MultipleLines" />
            <Toggle label="Online Security" field="OnlineSecurity" />
            <Toggle label="Online Backup" field="OnlineBackup" />
          </div>
          <div className="sim-row--4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            <Toggle label="Device Protection" field="DeviceProtection" />
            <Toggle label="Tech Support" field="TechSupport" />
            <Toggle label="Streaming TV" field="StreamingTV" />
            <Toggle label="Streaming Movies" field="StreamingMovies" />
          </div>
        </div>

        {/* Usage & Geography */}
        <div className="sim-section">
          <div className="sim-section__title">Usage &amp; Geography</div>

          <div className="sim-slider" style={{ marginBottom: 16 }}>
            <div className="sim-slider__header">
              <span className="sim-slider__label">Tenure (Months)</span>
              <span className="sim-slider__value">{form.TenureMonths}</span>
            </div>
            <input type="range" className="sim-slider__input" min={0} max={72} value={form.TenureMonths}
              onChange={(e) => set("TenureMonths", +e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="sim-slider">
              <div className="sim-slider__header">
                <span className="sim-slider__label">Monthly Charges ($)</span>
                <span className="sim-slider__value">{form.MonthlyCharges}</span>
              </div>
              <input type="range" className="sim-slider__input" min={18} max={120} value={form.MonthlyCharges}
                onChange={(e) => set("MonthlyCharges", +e.target.value)} />
            </div>
            <div className="sim-slider">
              <div className="sim-slider__header">
                <span className="sim-slider__label">Total Charges ($)</span>
                <span className="sim-slider__value">{form.TotalCharges}</span>
              </div>
              <input type="range" className="sim-slider__input" min={0} max={9000} step={10} value={form.TotalCharges}
                onChange={(e) => set("TotalCharges", +e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Right — Prediction Result */}
      <div>
        <div className="prediction-card">
          <div className="prediction-card__title">PREDICTION RESULT</div>
          <div className="prediction-card__sub">Churn Probability</div>
          <div className="prediction-card__prob">{(prob * 100).toFixed(2) }</div>
          <div className={`prediction-card__badge prediction-card__badge--${badgeClass}`}>
            {!result ? "NO PREDICTION YET" : `${riskLevel} RISK`}
          </div>

          {result?.churn_reason && (
            <div style={{ textAlign: "left", fontSize: 12, marginBottom: 16, opacity: 0.9, lineHeight: 1.5 }}>
              <div><strong>Category:</strong> {result.churn_reason.main_category}</div>
              <div><strong>Reason:</strong> {result.churn_reason.reason}</div>
            </div>
          )}

          <button className="prediction-card__btn prediction-card__btn--primary" onClick={() => onPredict(form)} disabled={loading}>
            {loading ? "⏳ PREDICTING…" : "PREDICT CHURN"}
          </button>
          <button className="prediction-card__btn prediction-card__btn--outline" onClick={onReset}>
            RESET SIMULATOR
          </button>
        </div>
      </div>
    </div>
  );
}
