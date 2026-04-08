"use client";
import React, { useState, useRef } from "react";
import api from "../../lib/api";
import MappingEditor from "./MappingEditor";
import AgentLog from "../shared/AgentLog";
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
    <div className="bg-slate-50/50 p-8 rounded-[32px] space-y-8">
      {/* Wizard Steps Indicator */}
      <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto mb-10">
        {[0, 1, 2, 3].map((s, idx) => {
          const isActive = ["idle", "mapping", "processing", "success"].indexOf(step) >= s;
          const stepLabels = ["Source", "Mapping", "Ingesting", "Finalize"];
          return (
            <div key={s} className="flex-1 flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black transition-all duration-500 shadow-sm
                  ${isActive 
                    ? "bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-50" 
                    : "bg-white text-slate-400 border border-slate-200"}`}
                >
                   {isActive && ["idle", "mapping", "processing", "success"].indexOf(step) > s ? "✓" : (idx + 1)}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                  {stepLabels[idx]}
                </span>
              </div>
              {idx < 3 && <div className={`flex-1 h-[2px] mb-6 transition-all duration-700 ${isActive ? "bg-indigo-600" : "bg-slate-200"}`} />}
            </div>
          );
        })}
      </div>

      {step === "idle" && (
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleFileChange} />
          
          <div className="border-4 border-dashed border-slate-200 rounded-[32px] p-16 flex flex-col items-center gap-6 transition-all duration-300 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 overflow-hidden relative">
            <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center text-4xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6
              ${file ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-white text-slate-400 border border-slate-100"}`}
            >
              {file ? "📄" : "☁️"}
            </div>

            <div className="text-center">
              <h3 className="text-[20px] font-black text-slate-800 tracking-tight mb-2">
                {file ? file.name : "Integrate New Dataset"}
              </h3>
              <p className="text-[13px] font-bold text-slate-500 max-w-sm">
                {file ? "File ready for agent processing" : "Drag and drop your subscriber records or click to browse files"}
              </p>
            </div>

            {file && (
              <button
                className="relative z-10 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                onClick={(e) => { e.stopPropagation(); uploadFile(); }}
                disabled={isUploading}
              >
                {isUploading ? "⚙️ AI Processing..." : "✨ Start AI Processing"}
              </button>
            )}
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
        </div>
      )}

      {step === "mapping" && uploadData && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">🔗</div>
                 <div>
                    <h2 className="text-[16px] font-black text-slate-800 uppercase tracking-tight">Intelligence Mapping & Review</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">{uploadData.filename}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button className="px-5 py-2 text-slate-500 font-bold text-[12px] uppercase tracking-widest hover:text-slate-800 transition-colors" onClick={reset}>Discard</button>
                 <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all" onClick={ingestData}>Confirm & Ingest</button>
              </div>
           </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: CSV Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Source Preview</span>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-black uppercase tracking-widest">Read Only</span>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[450px]">
                  <table className="w-full text-[12px] text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-20">
                      <tr>
                        {uploadData.columns.map((col: string) => (
                          <th key={col} className="px-4 py-3 border-b border-slate-100 text-slate-800 font-black uppercase tracking-tighter whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadData.preview.map((row: any, i: number) => (
                        <React.Fragment key={i}>
                          <tr className={`border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${!row.is_valid ? 'bg-red-50/40' : ''}`}>
                            {uploadData.columns.map((col: string, j: number) => (
                              <td key={j} className="px-4 py-3 text-slate-600 font-medium">
                                {row.row_data[col] || <span className="text-slate-300 italic">null</span>}
                              </td>
                            ))}
                          </tr>
                          {!row.is_valid && (
                            <tr className="bg-rose-50/60 border-b border-rose-100">
                              <td colSpan={uploadData.columns.length} className="px-4 py-2 text-rose-600 text-[11px] font-black italic">
                                REJECTED: {row.rejection_reason}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Mapping Editor */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Intelligence Schema Alignment</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[450px]">
                    <MappingEditor
                    csvColumns={uploadData.columns}
                    initialMapping={uploadData.mapping}
                    targetColumns={TARGET_SCHEMA_COLUMNS}
                    onChange={(m) => setConfirmedMapping(m)}
                    nullCounts={uploadData.null_counts}
                    />
                </div>
            </div>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <div className="w-16 h-16 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8" />
           <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Processing Data Ingestion</h2>
           <p className="text-[14px] font-bold text-slate-500 mb-8 font-mono">Agent Ingesting the Data...</p>
           
           <div className="w-full max-w-xl">
             <AgentLog entries={[
                { time: "SYS", tag: "info", message: "Fetching database shards..." },
                { time: "SYS", tag: "info", message: "Initializing LLM reasoning engine..." },
                { time: "SYS", tag: "info", message: "Mapping customer demographics..." }
              ]} />
           </div>
        </div>
      )}

      {step === "success" && ingestResult && (
        <div className="animate-in zoom-in-95 duration-700">
           <div className="bg-emerald-500 rounded-[32px] p-10 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-emerald-200">
              <div className="w-20 h-20 rounded-[28px] bg-white text-emerald-500 flex items-center justify-center text-4xl shadow-lg">✓</div>
              <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-black tracking-tight mb-2">Data Successfully Ingested</h2>
                  <p className="text-[15px] font-medium opacity-90 max-w-lg">
                    {ingestResult.status === "skipped" ? "Integrity check passed. No new records required at this time." : `Successfully unified ${ingestResult.summary.inserted} subscriber records.`}
                  </p>
                  <button onClick={reset} className="mt-6 px-8 py-3 bg-white text-emerald-600 font-black text-[13px] uppercase tracking-widest rounded-2xl shadow-xl hover:-translate-y-1 transition-all">Process Another Dataset</button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
              <KpiCard label="Records Unified" value={ingestResult.summary.inserted} color="blue" sub="Managed Base" />
              <KpiCard label="High Risk Flagged" value={ingestResult.summary.risk_breakdown.high} color="red" sub="Watchlist Ready" />
              <KpiCard label="Rejected" value={ingestResult.summary.rejected} color="amber" sub="Integrity Check Fail" />
              <KpiCard label="Stable Status" value={ingestResult.summary.risk_breakdown.low} color="green" sub="Low Risk Profile" />
           </div>

           <div className="mt-10 bg-white rounded-3xl border border-slate-200 p-8">
              <AgentLog entries={ingestResult.agent_logs} />
           </div>
        </div>
      )}
    </div>
  );
}
