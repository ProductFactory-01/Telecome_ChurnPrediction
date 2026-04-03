"use client";
import React, { useState, useRef, useEffect } from "react";
import api from "../../lib/api";
import MappingEditor from "./MappingEditor";
import AgentLog from "../shared/AgentLog";
import SectionTitle from "../shared/SectionTitle";
import KpiCard from "../shared/KpiCard";

const TARGET_SCHEMA_COLUMNS = [
  "Customer ID", "Gender", "Age", "Under 30", "Senior Citizen", "Married", "Dependents", 
  "Number of Dependents", "Name", "email", "mobile_number", "Location ID", "Country", 
  "State", "City", "Zip Code", "Lat Long", "Latitude", "Longitude", "Service ID", 
  "Quarter", "Referred a Friend", "Number of Referrals", "Tenure in Months", "Offer", 
  "Phone Service", "Avg Monthly Long Distance Charges", "Multiple Lines", "Internet Service", 
  "Internet Type", "Avg Monthly GB Download", "Online Security", "Online Backup", 
  "Device Protection Plan", "Premium Tech Support", "Streaming TV", "Streaming Movies", 
  "Streaming Music", "Unlimited Data", "Contract", "Paperless Billing", "Payment Method", 
  "Monthly Charge", "Total Charges", "Total Refunds", "Total Extra Data Charges", 
  "Total Long Distance Charges", "Total Revenue", "Status ID", "Satisfaction Score", 
  "Customer Status", "Churn Label", "Churn Value", "Churn Score", "CLTV", 
  "Churn Category", "Churn Reason"
];

type Step = "idle" | "mapping" | "processing" | "success";

export default function UploadWizard() {
  const [step, setStep] = useState<Step>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<any>(null);
  const [confirmedMapping, setConfirmedMapping] = useState<Record<string, string>>({});
  const [ingestResult, setIngestResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/data-agent/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadData(res.data);
      setConfirmedMapping(res.data.mapping);
      setStep("mapping");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please check the file format.");
    } finally {
      setIsUploading(false);
    }
  };

  const ingestData = async () => {
    if (!uploadData?.session_id) return;
    setStep("processing");

    try {
      const res = await api.post("/data-agent/confirm-ingest", {
        session_id: uploadData.session_id,
        mapping: confirmedMapping,
      });
      setIngestResult(res.data);
      setStep("success");
    } catch (err) {
      console.error(err);
      alert("Ingestion failed.");
      setStep("mapping");
    }
  };

  const reset = () => {
    setFile(null);
    setUploadData(null);
    setIngestResult(null);
    setStep("idle");
  };

  return (
    <div className="upload-wizard space-y-6">
      {/* Wizard Steps Indicator */}
      <div className="wizard-steps-container">
        {[0, 1, 2, 3].map((s, idx) => {
          const isActive = ["idle", "mapping", "processing", "success"].indexOf(step) >= s;
          const stepLabels = ["Upload", "Mapping", "Processing", "Complete"];
          return (
            <div key={s} className="wizard-step-item">
              <div className={`wizard-step-dot ${isActive ? "active" : ""}`}>
                {isActive && ["idle", "mapping", "processing", "success"].indexOf(step) > s ? (
                  <span className="check-icon">✓</span>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="wizard-step-label">{stepLabels[idx]}</span>
              {idx < 3 && <div className={`wizard-step-connector ${isActive ? "active" : ""}`} />}
            </div>
          );
        })}
      </div>

      {step === "idle" && (
        <div 
          className="upload-file-container"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept=".csv" 
            onChange={handleFileChange} 
          />
          <div className="upload-animation">
            <span className="file-upload-icon">{file ? "📄" : "📁"}</span>
          </div>
          
          <div className="upload-content">
            {file ? (
              <>
                <h3 className="upload-title">Ready to Process</h3>
                <p className="upload-hint">
                  File: <span className="file-name">{file.name}</span>
                </p>
              </>
            ) : (
              <>
                <h3 className="upload-title">Select or Drop CSV File</h3>
                <p className="upload-hint">
                  <span className="click-here">Click here</span> or drag & drop your CSV file
                </p>
                <p className="upload-hint" style={{ marginTop: "8px", fontSize: "11px" }}>
                  Supports CRM exports, billing dumps, network logs, and NPS data
                </p>
              </>
            )}
          </div>
          
          {file && (
            <button 
              className="button button-primary mt-6"
              onClick={(e) => { e.stopPropagation(); uploadFile(); }}
              disabled={isUploading}
              style={{
                padding: "10px 24px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {isUploading ? "⚙️ AI Processing..." : "✨ Process with Agent"}
            </button>
          )}
        </div>
      )}

      {step === "mapping" && uploadData && (
        <div className="mapping-view card">
          <div className="mapping-header">
            <div className="mapping-title-section">
              <span className="mapping-icon">🔗</span>
              <div>
                <h2 className="mapping-title">Mapping & Review</h2>
                <p className="mapping-subtitle">{uploadData.filename}</p>
              </div>
            </div>
            <div className="mapping-status">
              <span className="status-badge">Step 2/3</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Left: CSV Preview */}
            <div className="preview-container">
                <div className="preview-header">
                  <span className="preview-title">📊 CSV Preview (First 5 records)</span>
                  <span className="preview-badge">Read-Only</span>
                </div>
                <div className="preview-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                {uploadData.columns.map((col: string) => (
                                    <th key={col}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {uploadData.preview.map((row: any, i: number) => (
                                <React.Fragment key={i}>
                                    <tr className={!row.is_valid ? 'invalid-row' : row.is_duplicate ? "duplicate-row" : ""}>
                                        {uploadData.columns.map((col: string, j: number) => (
                                            <td key={j}>
                                                {j === 0 && !row.is_valid && <span style={{ color: "var(--accent-red)", marginRight: "4px", fontWeight: 700 }}>⚠</span>}
                                                {row.row_data[col] || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>null</span>}
                                            </td>
                                        ))}
                                    </tr>
                                    {!row.is_valid && (
                                        <tr style={{ background: "rgba(220, 38, 38, 0.05)" }}>
                                            <td colSpan={uploadData.columns.length} style={{ padding: "8px 12px", color: "var(--accent-red)", fontSize: "11px", fontWeight: 600, fontStyle: "italic" }}>
                                                Unable to store: {row.rejection_reason}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="validation-messages">
                  {uploadData.preview.some((r: any) => !r.is_valid) && (
                    <div className="alert alert--warning">
                      <span className="alert-icon">⚠</span>
                      <div className="alert-text">Some rows are missing mandatory fields for churn prediction and will be <strong>rejected</strong> during ingestion.</div>
                    </div>
                  )}
                  {uploadData.validation_logs.map((log: any, i: number) => (
                    <div key={i} className={`alert ${log.tag === 'warn' ? 'alert--warning' : 'alert--success'}`}>
                      <span className="alert-icon">{log.tag === 'warn' ? '⚠' : '✓'}</span>
                      <div className="alert-text">{log.message}</div>
                    </div>
                  ))}
                </div>
            </div>

            {/* Right: Mapping Editor */}
            <MappingEditor 
              csvColumns={uploadData.columns}
              initialMapping={uploadData.mapping}
              targetColumns={TARGET_SCHEMA_COLUMNS}
              onChange={(m) => setConfirmedMapping(m)}
            />
          </div>

          <div className="mapping-actions">
            <button className="button button-secondary" onClick={reset}>Cancel</button>
            <button className="button button-primary" onClick={ingestData}>✨ Confirm & Ingest</button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(0, 102, 204, 0.02), rgba(5, 150, 105, 0.02))" }}>
          <div className="processing-view">
            <div className="processing-content">
              <div className="processing-spinner">
                <div className="spinner-circle"></div>
              </div>
              <h2 className="processing-title">⚙️ Processing Data</h2>
              <p className="processing-subtitle">Agent Ingestion Protocol Initialized</p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                Updating demographics, services, and running churn predictions...
              </p>
              
              <div className="processing-log" style={{ maxWidth: "600px" }}>
                <AgentLog entries={[
                  {time: "SYS", tag: "info", message: "Synchronizing database shards..."}, 
                  {time: "SYS", tag: "info", message: "Initializing LLM reasoning engine..."},
                  {time: "SYS", tag: "info", message: "Mapping customer demographics..."}
                ]} />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "success" && ingestResult && (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(5, 150, 105, 0.03), rgba(16, 185, 129, 0.03))" }}>
          <div className="success-header">
            <div className="success-icon-container">
              <div className="success-icon">✓</div>
            </div>
            <div className="success-text">
              <h2 className="success-title">Data Agent Protocol Complete</h2>
              <p className="success-subtitle">Successfully integrated {ingestResult.summary.inserted} subscribers into intelligence view</p>
            </div>
          </div>

          <div className="panel-grid panel-grid--4 mb-6" style={{ marginTop: "28px" }}>
            <KpiCard label="Records Unified" value={ingestResult.summary.inserted} color="blue" />
            <KpiCard label="High Risk Flagged" value={ingestResult.summary.risk_breakdown.high} color="red" />
            <KpiCard label="Rejected (Incomplete)" value={ingestResult.summary.rejected} color="amber" />
            <KpiCard label="Low Risk/Stable" value={ingestResult.summary.risk_breakdown.low} color="green" />
          </div>

          <div className="success-logs">
            <AgentLog entries={ingestResult.agent_logs} />
          </div>

          <div className="success-actions">
            <button 
              className="button button-primary"
              onClick={reset}
              style={{
                padding: "12px 28px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              🔄 Process Another Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
