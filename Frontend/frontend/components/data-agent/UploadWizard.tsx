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
      {/* Wizard Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {[0, 1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={`w-3 h-3 rounded-full transition-all ${
              ["idle", "mapping", "processing", "success"].indexOf(step) >= s 
                ? "bg-blue-600 scale-125" 
                : "bg-gray-300"
            }`}
          ></div>
        ))}
      </div>

      {step === "idle" && (
        <div 
          className={`file-upload ${file ? "border-blue-500 bg-blue-50" : ""}`}
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
          <div className="file-upload__icon">{file ? "📄" : "📁"}</div>
          <div className="file-upload__text">
            {file ? (
              <span><b>{file.name}</b> selected</span>
            ) : (
              <span><b>Drag & drop CSV files</b> or click to upload additional data sources</span>
            )}
          </div>
          <div className="file-upload__hint">Supports CRM exports, billing dumps, network logs, and NPS data</div>
          
          {file && (
            <button 
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold shadow-lg hover:bg-blue-700 transition"
              onClick={(e) => { e.stopPropagation(); uploadFile(); }}
              disabled={isUploading}
            >
              {isUploading ? "AI Processing..." : "Process with Agent"}
            </button>
          )}
        </div>
      )}

      {step === "mapping" && uploadData && (
        <div className="mapping-view card">
          <SectionTitle title={`Mapping & Review — ${uploadData.filename}`} color="blue" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Left: CSV Preview */}
            <div className="preview-container">
                <div className="text-sm font-bold text-gray-700 mb-2">CSV Preview (First 5 records)</div>
                <div className="overflow-x-auto border rounded-md max-h-[400px]">
                    <table className="w-full text-xs text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 bg-gray-50 z-10 border-b">
                            <tr>
                                {uploadData.columns.map((col: string) => (
                                    <th key={col} className="p-2 truncate font-semibold border-r bg-gray-50">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {uploadData.preview.map((row: any, i: number) => (
                                <React.Fragment key={i}>
                                    <tr className={`border-b ${!row.is_valid ? 'bg-red-50' : row.is_duplicate ? "bg-amber-50" : ""}`}>
                                        {uploadData.columns.map((col: string, j: number) => (
                                            <td key={j} className="p-2 border-r whitespace-nowrap">
                                                {j === 0 && !row.is_valid && <span className="text-red-500 mr-1">⚠</span>}
                                                {row.row_data[col] || <span className="text-gray-300 italic">null</span>}
                                            </td>
                                        ))}
                                    </tr>
                                    {!row.is_valid && (
                                        <tr className="bg-red-100/50">
                                            <td colSpan={uploadData.columns.length} className="p-2 text-red-700 text-[10px] font-medium italic border-b">
                                                Unable to store: {row.rejection_reason}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {uploadData.preview.some((r: any) => !r.is_valid) && (
                    <div className="mt-2 p-2 rounded text-xs bg-red-100 text-red-800">
                        ⚠ Some rows are missing mandatory fields for churn prediction and will be <b>rejected</b> during ingestion.
                    </div>
                )}
                {uploadData.validation_logs.map((log: any, i: number) => (
                    <div key={i} className={`mt-2 p-2 rounded text-xs ${log.tag === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {log.tag === 'warn' ? '⚠ ' : '✓ '} {log.message}
                    </div>
                ))}
            </div>

            {/* Right: Mapping Editor */}
            <MappingEditor 
              csvColumns={uploadData.columns}
              initialMapping={uploadData.mapping}
              targetColumns={TARGET_SCHEMA_COLUMNS}
              onChange={(m) => setConfirmedMapping(m)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-md" onClick={reset}>Cancel</button>
            <button className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md font-bold shadow-lg" onClick={ingestData}>Confirm & Ingest</button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="processing-view card text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-bold text-gray-800">Agent Ingestion Protocol Initialized</div>
            <div className="text-sm text-gray-500 mt-2">Updating demographics, services, and running churn predictions...</div>
            <div className="max-w-xl mx-auto mt-8">
                <AgentLog entries={[{time: "SYS", tag: "info", message: "Synchronizing database shards..."}, {time: "SYS", tag: "info", message: "Initializing LLM reasoning engine..."}]} />
            </div>
        </div>
      )}

      {step === "success" && ingestResult && (
        <div className="success-view card bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl font-bold">✓</div>
            <div>
                <div className="text-xl font-bold text-gray-800">Data Agent Protocol Complete</div>
                <div className="text-sm text-gray-500">Successfully integrated {ingestResult.summary.inserted} subscribers into intelligence view</div>
            </div>
          </div>

          <div className="panel-grid panel-grid--4 mb-6">
            <KpiCard label="Records Unified" value={ingestResult.summary.inserted} color="blue" />
            <KpiCard label="High Risk Flagged" value={ingestResult.summary.risk_breakdown.high} color="red" />
            <KpiCard label="Rejected (Incomplete)" value={ingestResult.summary.rejected} color="amber" />
            <KpiCard label="Low Risk/Stable" value={ingestResult.summary.risk_breakdown.low} color="green" />
          </div>

          <AgentLog entries={ingestResult.agent_logs} />

          <div className="flex justify-center mt-8">
            <button className="px-8 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition shadow-xl" onClick={reset}>
               Process Another Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
