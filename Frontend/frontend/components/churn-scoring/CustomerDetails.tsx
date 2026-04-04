"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Loading from "../shared/Loading";

interface Props {
  customerId: string;
  onBack: () => void;
}

export default function CustomerDetails({ customerId, onBack }: Props) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/customers/${customerId}`)
      .then((r) => setDetail(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading || !detail) {
    return <Loading message={`Retrieving Intelligence for ${customerId}...`} />;
  }

  const riskScore = detail["Churn Score"] / 100;
  const riskColor = riskScore > 0.7 ? "text-red-600" : riskScore > 0.4 ? "text-amber-500" : "text-green-600";
  const riskBg = riskScore > 0.7 ? "bg-red-50/50" : riskScore > 0.4 ? "bg-amber-50/50" : "bg-green-50/50";
  const riskBorder = riskScore > 0.7 ? "border-red-100" : riskScore > 0.4 ? "border-amber-100" : "border-green-100";
  const toNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const totalCharges = toNumber(detail["Total Charges"]);
  const totalRefunds = toNumber(detail["Total Refunds"]);
  const extraDataCharges = toNumber(detail["Total Extra Data Charges"]);
  const longDistanceCharges = toNumber(detail["Total Long Distance Charges"]);
  const ltdRevenue =
    detail["LTD Revenue"] ??
    detail["Total Revenue"] ??
    totalCharges + extraDataCharges + longDistanceCharges - totalRefunds;

  const StatusBadge = ({ value }: { value: any }) => {
    const isYes = String(value).toLowerCase() === "yes";
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight border ${isYes ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
        {value}
      </span>
    );
  };

  const DataRow = ({ label, value, color }: { label: string; value: any; color?: string }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
      <span className="text-[12px] uppercase font-bold text-slate-500 tracking-tight">{label}:</span>
      {String(value).toLowerCase() === "yes" || String(value).toLowerCase() === "no" ? (
         <StatusBadge value={value} />
      ) : (
        <span className={`text-[14px] font-black ${color ? color : "text-slate-800"}`}>
          {value}
        </span>
      )}
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Back Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          BACK TO DIRECTORY
        </button>
        
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
           <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Active Intelligence View</span>
        </div>
      </div>

      {/* Hero Summary Card */}
      <div className="card mb-8 p-0 overflow-hidden">
        <div className="p-8 flex flex-col lg:flex-row items-center justify-between gap-8 bg-gradient-to-r from-slate-50/50 to-transparent">
           <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{detail.Name || detail["Customer ID"]}</h1>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{detail["Customer ID"]}</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <span className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {detail.email}
                </span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {detail.mobile_number || "NO RECORD"}
                </span>
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  {detail.City}, {detail.State}
                </span>
              </div>
           </div>

           <div className="flex flex-wrap items-center bg-white border border-slate-100 p-2 rounded-2xl shadow-sm">
             {[
               { label: "Tenure", value: `${detail["Tenure in Months"]} MO` },
               { label: "LTD Revenue", value: `$${ltdRevenue?.toLocaleString()}`, color: "text-emerald-600" },
               { label: "Contract", value: detail.Contract, color: "text-indigo-600" },
               { label: "Payment", value: detail.PaymentMethod || detail["Payment Method"] }
             ].map((item, idx) => (
               <div key={idx} className="px-6 py-3 text-center border-r last:border-0 border-slate-50 min-w-[110px]">
                 <div className="text-[11px] uppercase font-bold text-slate-400 mb-1 tracking-widest">{item.label}</div>
                 <div className={`text-xl font-black tracking-tight ${item.color || "text-slate-800"}`}>{item.value}</div>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         {/* Churn Risk Factor */}
         <div className="card overflow-hidden border-l-[6px] border-red-500 p-0">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-2">
                 <span className="text-lg">🎯</span>
                 <h3 className="font-bold text-slate-800 text-[12px] uppercase tracking-widest">Churn Risk Index</h3>
               </div>
               <div className={`${riskBg} px-3 py-1 rounded-full border ${riskBorder} ${riskColor}`}>
                  <span className="text-[9px] uppercase font-black">AI Calculated Risk</span>
               </div>
            </div>
             <div className="p-6">
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Risk Label</span>
                    <span className={`text-3xl font-black ${detail["Churn Label"] === "Yes" ? "text-red-600" : "text-emerald-600"}`}>{detail["Churn Label"]}</span>
                 </div>
                 <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Probability Score</span>
                    <div className={`text-5xl font-black leading-none ${riskColor}`}>{riskScore.toFixed(2)}</div>
                 </div>
              </div>
              <DataRow label="Segment Category" value={detail["Churn Category"] || "Standard Base"} color={riskColor} />
              <div className="mt-4 p-4 bg-slate-50 rounded-xl relative border border-slate-100 group">
                <div className="absolute -top-2 left-3 bg-white px-1.5 text-[8px] font-black text-slate-300 uppercase tracking-tighter transition-all group-hover:text-indigo-400">Reasoning Agent</div>
                <p className="text-[12px] leading-relaxed text-slate-600 italic font-medium">"{detail["Churn Reason"] || "No active signals of customer attrition detected in current billing cycle."}"</p>
              </div>
            </div>
         </div>

         {/* Profile Intelligence */}
         <div className="card overflow-hidden border-l-[6px] border-indigo-500 p-0">
            <div className="px-6 py-4 border-b flex items-center gap-2 bg-slate-50/30">
              <span className="text-lg">👤</span>
              <h3 className="font-bold text-slate-800 text-[12px] uppercase tracking-widest">Profile Intelligence</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <DataRow label="Gender" value={detail.Gender || detail.gender} />
              <DataRow label="Age" value={detail.Age} />
              <DataRow label="Senior Citizen" value={detail["Senior Citizen"]} />
              <DataRow label="Marital Status" value={detail.Married} />
              <DataRow label="Dependents" value={detail.Dependents} />
              <DataRow label="No. Dependents" value={detail["Number of Dependents"] || 0} />
            </div>
         </div>

         {/* Billing & Revenue */}
         <div className="card overflow-hidden border-l-[6px] border-emerald-500 p-0">
            <div className="px-6 py-4 border-b flex items-center gap-2 bg-slate-50/30">
              <span className="text-lg">💳</span>
              <h3 className="font-bold text-slate-800 text-[12px] uppercase tracking-widest">Revenue & Billing</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <DataRow label="Monthly Charge" value={`$${detail["Monthly Charge"]}`} color="text-emerald-600" />
              <DataRow label="Total Charges" value={`$${totalCharges}`} />
              <DataRow label="Long Distance" value={`$${longDistanceCharges}`} />
              <DataRow label="LTD Revenue" value={`$${ltdRevenue}`} color="text-emerald-600" />
              <DataRow label="Total Refunds" value={`$${totalRefunds}`} color="text-red-500" />
              <DataRow label="Overage" value={`$${extraDataCharges}`} />
              <DataRow label="Paperless" value={detail["Paperless Billing"]} />
            </div>
         </div>

         {/* Usage Behavior */}
         <div className="card overflow-hidden border-l-[6px] border-orange-500 p-0">
            <div className="px-6 py-4 border-b flex items-center gap-2 bg-slate-50/30">
              <span className="text-lg">📊</span>
              <h3 className="font-bold text-slate-800 text-[12px] uppercase tracking-widest">Usage Behavior</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <DataRow label="Avg Download" value={`${detail["Avg Monthly GB Download"] || 0} GB`} />
              <DataRow label="Unlimited" value={detail["Unlimited Data"] || "No"} />
              <DataRow label="Voice" value={detail["Phone Service"]} />
              <DataRow label="Lines" value={detail["Multiple Lines"]} />
              <DataRow label="Service" value={detail["Internet Service"]} />
              <DataRow label="Type" value={detail["Internet Type"]} />
            </div>
         </div>
      </div>

      {/* Service Provisioning */}
      <div className="card p-0 overflow-hidden border-t-2 border-slate-50">
         <div className="px-6 py-4 border-b bg-slate-50/20 flex items-center gap-2">
           <span className="text-lg">🛠️</span>
           <h3 className="font-bold text-slate-800 text-[12px] uppercase tracking-widest">Active Services</h3>
         </div>
         <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: "Security", active: detail["Online Security"] === "Yes", icon: "🛡️" },
             { label: "Backup", active: detail["Online Backup"] === "Yes", icon: "☁️" },
             { label: "Protection", active: detail["Device Protection Plan"] === "Yes", icon: "📱" },
             { label: "Support", active: detail["Premium Tech Support"] === "Yes", icon: "👨‍💻" },
             { label: "TV", active: detail["Streaming TV"] === "Yes", icon: "📺" },
             { label: "Movies", active: detail["Streaming Movies"] === "Yes", icon: "🎞️" },
             { label: "Music", active: detail["Streaming Music"] === "Yes", icon: "🎵" }
           ].map((s, idx) => (
             <div key={idx} className="flex items-center gap-2">
               <span className={`text-lg ${s.active ? "" : "opacity-60 grayscale"}`}>{s.icon}</span>
               <span className={`text-[12px] font-bold ${s.active ? "text-slate-600" : "text-slate-400 line-through"}`}>{s.label}:</span>
               <span className={`text-[12px] font-black ${s.active ? "text-slate-900" : "text-slate-400"}`}>{s.active ? "Yes" : "No"}</span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
