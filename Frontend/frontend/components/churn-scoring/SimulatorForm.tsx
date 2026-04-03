"use client";
import { useState } from "react";

interface FormData {
  Gender: string; SeniorCitizen: boolean; Partner: boolean; Dependents: boolean;
  TenureMonths: number; PhoneService: boolean; MultipleLines: boolean; InternetService: string;
  OnlineSecurity: boolean; OnlineBackup: boolean; DeviceProtection: boolean; TechSupport: boolean;
  StreamingTV: boolean; StreamingMovies: boolean; Contract: string; PaperlessBilling: boolean;
  PaymentMethod: string; MonthlyCharges: number; TotalCharges: number;
  Latitude: number; Longitude: number;
}

interface Props {
  onPredict: (data: FormData) => void;
  onReset: () => void;
  loading: boolean;
  result: any;
}

const SECTION = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
    {children}
  </div>
);

export default function SimulatorForm({ onPredict, onReset, loading, result }: Props) {
  const [form, setForm] = useState<FormData>({
    Gender: "Male", SeniorCitizen: false, Partner: true, Dependents: false,
    TenureMonths: 6, PhoneService: true, MultipleLines: false, InternetService: "Fiber optic",
    OnlineSecurity: false, OnlineBackup: false, DeviceProtection: false, TechSupport: false,
    StreamingTV: false, StreamingMovies: false, Contract: "Month-to-month", PaperlessBilling: true,
    PaymentMethod: "Electronic check", MonthlyCharges: 75, TotalCharges: 450,
    Latitude: 13.0827, Longitude: 80.2707,
  });

  const set = (key: string, val: any) => {
    setForm((p) => {
      const next = { ...p, [key]: val };
      if (key === "TenureMonths" || key === "MonthlyCharges") {
        next.TotalCharges = parseFloat((next.TenureMonths * next.MonthlyCharges).toFixed(2));
      }
      return next;
    });
  };

  const Toggle = ({ label, field }: { label: string; field: keyof FormData }) => {
    const isOn = !!form[field];
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, background: isOn ? "#eff6ff" : "#f8fafc", border: `1px solid ${isOn ? "#bfdbfe" : "#f1f5f9"}`, transition: "all 0.15s" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: isOn ? "#1d4ed8" : "#64748b" }}>{label}</span>
        <button
          type="button"
          onClick={() => set(field, !isOn)}
          style={{ position: "relative", width: 38, height: 21, borderRadius: 999, border: "none", cursor: "pointer", background: isOn ? "#2563eb" : "#cbd5e1", transition: "background 0.2s", flexShrink: 0 }}
        >
          <span style={{ position: "absolute", top: 2, left: isOn ? 18 : 2, width: 17, height: 17, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.18s" }} />
        </button>
      </div>
    );
  };

  const SelectField = ({ field, options }: { field: keyof FormData; options: string[] }) => (
    <select className="sim-field__select" value={form[field] as string} onChange={(e) => set(field, e.target.value)}
      style={{ borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#0f172a", border: "1.5px solid #e2e8f0", background: "#fff", padding: "10px 12px" }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  const prob = result?.churn_probability ?? 0;
  const pct = (prob * 100).toFixed(1);
  const risk = result?.risk_level;
  const riskTheme = prob > 0.7
    ? { bg: "#fff1f2", border: "#fecdd3", text: "#dc2626", badge: "#fee2e2", label: "#991b1b" }
    : prob > 0.4
    ? { bg: "#fffbeb", border: "#fde68a", text: "#d97706", badge: "#fef3c7", label: "#92400e" }
    : { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", badge: "#dcfce7", label: "#14532d" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24, alignItems: "stretch", minHeight: 660 }}
      className="max-lg:grid-cols-1">

      {/* ── LEFT: Inputs ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Row 1: Profile + Services side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="max-md:grid-cols-1">

          {/* Subscriber Profile */}
          <div className="card" style={{ padding: 24 }}>
            <SECTION icon="👤" title="Subscriber Profile">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Gender">
                    <SelectField field="Gender" options={["Male", "Female"]} />
                  </Field>
                  <Field label="Contract">
                    <SelectField field="Contract" options={["Month-to-month", "One year", "Two year"]} />
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Toggle label="Senior" field="SeniorCitizen" />
                  <Toggle label="Partner" field="Partner" />
                  <Toggle label="Dependents" field="Dependents" />
                  <Toggle label="Paperless" field="PaperlessBilling" />
                </div>
              </div>
            </SECTION>
          </div>

          {/* Service Selection */}
          <div className="card" style={{ padding: 24 }}>
            <SECTION icon="⚙️" title="Service Selection">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Internet">
                    <SelectField field="InternetService" options={["DSL", "Fiber optic", "No"]} />
                  </Field>
                  <Field label="Payment">
                    <SelectField field="PaymentMethod" options={["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"]} />
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Toggle label="Phone" field="PhoneService" />
                  <Toggle label="Multi-Line" field="MultipleLines" />
                  <Toggle label="Security" field="OnlineSecurity" />
                  <Toggle label="Backup" field="OnlineBackup" />
                  <Toggle label="Tech Support" field="TechSupport" />
                  <Toggle label="Protection" field="DeviceProtection" />
                  <Toggle label="Streaming TV" field="StreamingTV" />
                  <Toggle label="Movies" field="StreamingMovies" />
                </div>
              </div>
            </SECTION>
          </div>
        </div>

        {/* Row 2: Usage & Location Intelligence */}
        <div className="card" style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
          <SECTION icon="📍" title="Usage & Location Intelligence">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, flex: 1 }} className="max-md:grid-cols-1">

              {/* Sliders */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "center" }}>
                {[
                  { label: "Tenure (Months)", field: "TenureMonths" as keyof FormData, min: 0, max: 72, unit: "mo", color: "#2563eb" },
                  { label: "Monthly Charge ($)", field: "MonthlyCharges" as keyof FormData, min: 18, max: 120, unit: "$", color: "#2563eb" },
                ].map(({ label, field, min, max, unit, color }) => (
                  <div key={field}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color, background: "#eff6ff", border: "1.5px solid #bfdbfe", padding: "2px 12px", borderRadius: 8 }}>
                        {unit === "$" ? `$${form[field]}` : `${form[field]} ${unit}`}
                      </span>
                    </div>
                    <input type="range" min={min} max={max} value={form[field] as number} onChange={(e) => set(field, +e.target.value)}
                      style={{ width: "100%", accentColor: color, height: 6, cursor: "pointer" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 600 }}>{unit === "$" ? `$${min}` : `${min} ${unit}`}</span>
                      <span style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 600 }}>{unit === "$" ? `$${max}` : `${max} ${unit}`}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Location + Revenue */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Latitude">
                    <input type="number" step="0.0001" value={form.Latitude} onChange={(e) => set("Latitude", +e.target.value)}
                      style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#0f172a", background: "#fff", width: "100%" }} />
                  </Field>
                  <Field label="Longitude">
                    <input type="number" step="0.0001" value={form.Longitude} onChange={(e) => set("Longitude", +e.target.value)}
                      style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#0f172a", background: "#fff", width: "100%" }} />
                  </Field>
                </div>

                {/* Total Charges */}
                <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Lifetime Revenue</div>
                      <div style={{ fontSize: 10, color: "#cbd5e1", fontStyle: "italic" }}>Auto-calculated from tenure × monthly</div>
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#2563eb" }}>${form.TotalCharges.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((form.TotalCharges / (72 * 120)) * 100, 100)}%`, background: "linear-gradient(90deg, #3b82f6, #2563eb)", borderRadius: 999, transition: "width 0.3s" }} />
                  </div>
                </div>
              </div>

            </div>
          </SECTION>
        </div>
      </div>

      {/* ── RIGHT: Outcome Panel ── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderRadius: 28, border: "1.5px solid #e2e8f0", boxShadow: "0 10px 45px rgba(0,0,0,0.07)", padding: "28px 30px", display: "flex", flexDirection: "column", flex: 1 }}>

          {/* Panel Header */}
          <div style={{ textAlign: "center", paddingBottom: 22, marginBottom: 22, borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 8 }}>AI Prediction Engine</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em" }}>Outcome Intelligence</div>
          </div>

          {/* Content Area: same height both states */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {!result ? (
              /* ── Empty State ── */
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", border: "1.5px dashed #e2e8f0", borderRadius: 24, padding: "40px 28px", background: "#fcfdfe" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, border: "1.5px dashed #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>🔭</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#64748b", marginBottom: 8 }}>Awaiting Simulation Data</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>Adjust the subscriber parameters and click <strong style={{ color: "#2563eb" }}>Generate Prediction</strong> to begin real-time risk analysis.</div>
                </div>
                {/* Ghost Result Placeholders to lock height visually */}
                <div style={{ width: "100%", marginTop: 24, display: "flex", flexDirection: "column", gap: 14, opacity: 0.08, pointerEvents: "none" }}>
                  <div style={{ height: 110, background: "#94a3b8", borderRadius: 20 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ height: 70, background: "#94a3b8", borderRadius: 16 }} />
                    <div style={{ height: 70, background: "#94a3b8", borderRadius: 16 }} />
                  </div>
                  <div style={{ height: 100, background: "#94a3b8", borderRadius: 20 }} />
                </div>
              </div>
            ) : (
              /* ── Result State ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>

                {/* Score Card */}
                <div style={{ background: riskTheme.bg, border: `2px solid ${riskTheme.border}`, borderRadius: 26, padding: "26px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: riskTheme.label, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Churn Probability</div>
                    <div style={{ fontSize: 56, fontWeight: 900, color: riskTheme.text, lineHeight: 1, letterSpacing: "-0.05em" }}>{pct}<span style={{ fontSize: 24, opacity: 0.5, marginLeft: 2 }}>%</span></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ background: riskTheme.badge, border: `1.5px solid ${riskTheme.border}`, borderRadius: 999, padding: "7px 18px", fontSize: 11, fontWeight: 800, color: riskTheme.label, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{risk} Risk</div>
                    <div style={{ fontSize: 11, color: riskTheme.label, fontWeight: 700, opacity: 0.65 }}>AI Context Validated</div>
                  </div>
                </div>

                {/* Category Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Main Category", value: result.churn_reason?.main_category, color: "#0f172a" },
                    { label: "Sub Category", value: result.churn_reason?.sub_category, color: "#2563eb" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: "16px 18px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color, lineHeight: 1.3 }}>{value ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {/* AI Reasoning */}
                <div style={{ flex: 1, background: "linear-gradient(145deg, #1e40af, #2563eb)", borderRadius: 26, padding: "26px 28px", position: "relative", overflow: "hidden", minHeight: 160, display: "flex", alignItems: "center" }}>
                  <div style={{ position: "absolute", top: -15, right: -5, fontSize: 120, color: "rgba(255,255,255,0.07)", fontFamily: "serif", lineHeight: 1, userSelect: "none" }}>"</div>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 12 }}>AI Diagnosis Insight</div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,1)", fontStyle: "italic", lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                      "{result.churn_reason?.reason}"
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Action Buttons — always at bottom */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => onPredict(form)}
              disabled={loading}
              className="hover-lift"
              style={{ 
                width: "100%", 
                padding: "18px 0", 
                borderRadius: 20, 
                border: "none", 
                background: loading ? "#93c5fd" : "linear-gradient(90deg, #3b82f6, #2563eb)", 
                color: "#fff", 
                fontWeight: 800, 
                fontSize: 14, 
                letterSpacing: "0.1em", 
                textTransform: "uppercase", 
                cursor: loading ? "not-allowed" : "pointer", 
                boxShadow: "0 8px 30px rgba(37,99,235,0.35)", 
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" 
              }}>
              {loading ? "⚙️ Calculating Probabilities..." : "🔥 Generate AI Prediction"}
            </button>
            <button
              onClick={onReset}
              style={{ width: "100%", padding: "14px 0", borderRadius: 20, border: "1.5px dashed #e2e8f0", background: "transparent", color: "#94a3b8", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s" }}>
              Reset Simulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
