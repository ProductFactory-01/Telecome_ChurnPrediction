"use client";
import { useState, useEffect } from "react";
import * as h3 from "h3-js";

interface FormData {
  Gender: string; SeniorCitizen: boolean; Partner: boolean; Dependents: boolean;
  TenureMonths: number; PhoneService: boolean; MultipleLines: boolean; InternetService: string;
  OnlineSecurity: boolean; OnlineBackup: boolean; DeviceProtection: boolean; TechSupport: boolean;
  StreamingTV: boolean; StreamingMovies: boolean; Contract: string; PaperlessBilling: boolean;
  PaymentMethod: string; MonthlyCharges: number; TotalCharges: number;
  Latitude: number; Longitude: number;
  // Core GenAI Fields
  Age: number; Married: boolean; NumberOfDependents: number; Under30: boolean;
  InternetType: string; AvgMonthlyGBDownload: number; UnlimitedData: boolean;
  SatisfactionScore: number; DroppedCalls: number; Latency: number; SignalStrength: number;
  StreamingMusic: boolean; Jitter: number; PacketLoss: number; Throughput: number;
  Complaint: string; ComplaintType: string; ComplaintFrequency: number;
  PaymentDelay: number; DeviceCapability: string; PlanChangeTracking: number;
  HexId: string;
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
    Age: 35, Married: false, NumberOfDependents: 0, Under30: false, InternetType: "Fiber optic",
    AvgMonthlyGBDownload: 21.0, UnlimitedData: true, SatisfactionScore: 3,
    DroppedCalls: 0, Latency: 45, SignalStrength: 65, StreamingMusic: false,
    Jitter: 5.0, PacketLoss: 0.0, Throughput: 100.0, Complaint: "None",
    ComplaintType: "None", ComplaintFrequency: 0, PaymentDelay: 0,
    DeviceCapability: "4G", PlanChangeTracking: 0, HexId: h3.latLngToCell(13.0827, 80.2707, 5)
  });

  const set = (key: string, val: any) => {
    setForm((p) => {
      const next = { ...p, [key]: val };
      if (key === "TenureMonths" || key === "MonthlyCharges") {
        next.TotalCharges = parseFloat((next.TenureMonths * next.MonthlyCharges).toFixed(2));
      }
      if (key === "Latitude" || key === "Longitude") {
        try {
          next.HexId = h3.latLngToCell(Number(next.Latitude) || 0, Number(next.Longitude) || 0, 5);
        } catch {
          next.HexId = "Invalid";
        }
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
  const pct = prob.toFixed(1);
  const risk = result?.risk_level;
  const riskTheme = prob > 70
    ? { bg: "#fff1f2", border: "#fecdd3", text: "#dc2626", badge: "#fee2e2", label: "#991b1b" }
    : prob > 40
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
                  <Toggle label="Under 30" field="Under30" />
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Field label="Internet">
                    <SelectField field="InternetService" options={["DSL", "Fiber optic", "No"]} />
                  </Field>
                  <Field label="Type">
                    <SelectField field="InternetType" options={["Cable", "Fiber optic", "DSL"]} />
                  </Field>
                  <Field label="Payment">
                    <SelectField field="PaymentMethod" options={["Electronic check", "Mailed check", "Bank transfer", "Credit card"]} />
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
                  <Toggle label="Music" field="StreamingMusic" />
                </div>
              </div>
            </SECTION>
          </div>
        </div>

        {/* Row 2: Usage & Location Intelligence */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <SECTION icon="📍" title="Usage & Location Intelligence">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="max-md:grid-cols-1">

              {/* Sliders */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24, justifyContent: "center" }}>
                {[
                  { label: "Tenure (Months)", field: "TenureMonths" as keyof FormData, min: 0, max: 72, unit: "mo", color: "#2563eb" },
                  { label: "Monthly Charge ($)", field: "MonthlyCharges" as keyof FormData, min: 18, max: 120, unit: "$", color: "#2563eb" },
                  { label: "Avg Data Usage (GB)", field: "AvgMonthlyGBDownload" as keyof FormData, min: 0, max: 150, unit: "GB", color: "#10b981" },
                ].map(({ label, field, min, max, unit, color }) => (
                  <div key={field}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color, background: "#eff6ff", border: `1.5px solid ${color}40`, padding: "2px 12px", borderRadius: 8 }}>
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
                
                {/* Hex ID Preview */}
                <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Calculated Hex ID</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>{form.HexId}</span>
                </div>

                {/* Total Charges */}
                <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Lifetime Revenue</div>
                      <div style={{ fontSize: 10, color: "#cbd5e1", fontStyle: "italic" }}>Auto-calculated</div>
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

        {/* Row 3: Live Network & Engagement Metrics */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <SECTION icon="📶" title="Network Health & Engagement (Real-Time)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="max-md:grid-cols-1">
              
              {/* Sliders: Network & Sat */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Satisfaction Score", field: "SatisfactionScore" as keyof FormData, min: 1, max: 5, unit: "⭐", color: "#f59e0b" },
                  { label: "Latency (ms)", field: "Latency" as keyof FormData, min: 10, max: 200, unit: "ms", color: "#ef4444" },
                  { label: "Jitter (ms)", field: "Jitter" as keyof FormData, min: 0, max: 100, unit: "ms", color: "#f97316" },
                  { label: "Packet Loss (%)", field: "PacketLoss" as keyof FormData, min: 0, max: 20, unit: "%", color: "#eab308" },
                  { label: "Signal Strength", field: "SignalStrength" as keyof FormData, min: 20, max: 100, unit: "%", color: "#10b981" },
                  { label: "Throughput (Mbps)", field: "Throughput" as keyof FormData, min: 0, max: 1000, unit: "Mbps", color: "#3b82f6" },
                ].map(({ label, field, min, max, unit, color }) => (
                  <div key={field}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color, background: `${color}15`, padding: "2px 10px", borderRadius: 6 }}>
                        {form[field]} {unit}
                      </span>
                    </div>
                    <input type="range" min={min} max={max} value={form[field] as number} onChange={(e) => set(field, +e.target.value)}
                      style={{ width: "100%", accentColor: color, height: 6, cursor: "pointer" }} />
                  </div>
                ))}
              </div>

              {/* Extra Counters and Support Logic */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Age">
                    <input type="number" value={form.Age} onChange={(e) => set("Age", +e.target.value)}
                      style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#0f172a", width: "100%" }} />
                  </Field>
                  <Field label="Dependents">
                    <input type="number" min={0} value={form.NumberOfDependents} onChange={(e) => set("NumberOfDependents", +e.target.value)}
                      style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#0f172a", width: "100%" }} />
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Toggle label="Married" field="Married" />
                  <Toggle label="Unlimited Data" field="UnlimitedData" />
                </div>
                
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Device & Support History</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Device Capability">
                      <SelectField field="DeviceCapability" options={["3G", "4G", "5G", "VoLTE"]} />
                    </Field>
                    <Field label="Complaint Type">
                      <SelectField field="ComplaintType" options={["None", "Network", "Billing", "Customer Service", "Other"]} />
                    </Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Complaint Freq.">
                      <input type="number" min={0} value={form.ComplaintFrequency} onChange={(e) => set("ComplaintFrequency", +e.target.value)}
                        style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#0f172a", width: "100%" }} />
                    </Field>
                    <Field label="Payment Delay (Days)">
                      <input type="number" min={0} value={form.PaymentDelay} onChange={(e) => set("PaymentDelay", +e.target.value)}
                        style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#0f172a", width: "100%" }} />
                    </Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Dropped Calls">
                      <input type="number" min={0} value={form.DroppedCalls} onChange={(e) => set("DroppedCalls", +e.target.value)}
                        style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#0f172a", width: "100%" }} />
                    </Field>
                    <Field label="Plan Changes">
                      <input type="number" min={0} value={form.PlanChangeTracking} onChange={(e) => set("PlanChangeTracking", +e.target.value)}
                        style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#0f172a", width: "100%" }} />
                    </Field>
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
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, textAlign: "center", border: "1.5px dashed #e2e8f0", borderRadius: 24, padding: "48px 32px", background: "#fcfdfe" }}>
                <div style={{ 
                  width: 100, height: 100, borderRadius: "50%", 
                  background: "linear-gradient(135deg, #fff, #f8fafc)", 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  fontSize: 44, border: "2px dashed #bfdbfe", 
                  boxShadow: "0 10px 40px rgba(59,130,246,0.06)",
                  animation: "pulse 3s infinite ease-in-out"
                }}>🔭</div>
                <div style={{ maxWidth: 280 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", marginBottom: 12, letterSpacing: "-0.02em" }}>Simulator Ready</div>
                  <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.7, fontWeight: 500 }}>
                    Adjust the subscriber parameters and click <strong style={{ color: "#2563eb" }}>Generate Prediction</strong> to begin real-time risk analysis.
                  </div>
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

                {/* AI Reasoning - Optimized flex to fill space */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ 
                    flex: 1, background: "linear-gradient(145deg, #1e40af, #2563eb)", 
                    borderRadius: 26, padding: "26px 28px", position: "relative", 
                    overflow: "hidden", display: "flex", alignItems: "center",
                    boxShadow: "0 10px 30px rgba(37,99,235,0.15)"
                  }}>
                    <div style={{ position: "absolute", top: -15, right: -5, fontSize: 120, color: "rgba(255,255,255,0.07)", fontFamily: "serif", lineHeight: 1, userSelect: "none" }}>"</div>
                    <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 14 }}>AI Diagnosis Insight</div>
                      <p style={{ fontSize: 14.5, color: "rgba(255,255,255,1)", fontStyle: "italic", lineHeight: 1.75, margin: 0, fontWeight: 500 }}>
                        "{result.churn_reason?.reason}"
                      </p>
                    </div>
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
