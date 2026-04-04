"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import api from "../../../lib/api";

type Params = Promise<{ id: string }>;

export default function CustomerPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/customers/${id}`)
      .then((r) => setDetail(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-blue-600 font-black uppercase tracking-widest text-xs">Accessing Unified Intelligence...</div>
      </div>
    );
  }

  const riskScore = detail["Churn Score"] / 100;
  const riskColor = riskScore > 0.7 ? "text-red-600" : riskScore > 0.4 ? "text-amber-500" : "text-green-600";
  const riskBg = riskScore > 0.7 ? "bg-red-50" : riskScore > 0.4 ? "bg-amber-50" : "bg-green-50";
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
      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter border ${isYes ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
        {value}
      </span>
    );
  };

  const DataRow = ({ label, value, color }: { label: string; value: any; color?: string }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[12px] uppercase font-bold text-gray-400 tracking-tight">{label}:</span>
      {String(value).toLowerCase() === "yes" || String(value).toLowerCase() === "no" ? (
         <StatusBadge value={value} />
      ) : (
        <span className={`text-[14px] font-black ${color ? color : "text-gray-800"}`}>
          {value}
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-10">
      <div className="max-w-[1400px] mx-auto p-6">
        
        {/* Header Action */}
        <div className="mb-6">
          <Link href="/?tab=churn-scoring" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
            ← Back to Intelligence List
          </Link>
        </div>

        {/* Global Summary Panel */}
        <div className="bg-white border-2 border-gray-100 rounded-[32px] p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl shadow-gray-200/20 hover:border-blue-100 transition-colors">
           <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">{detail.Name || detail["Customer ID"]}</h1>
                <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">{detail["Customer ID"]}</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <span className="text-sm text-blue-600 font-bold hover:underline cursor-pointer">📧 {detail.email}</span>
                <span className="text-sm text-gray-500 font-bold uppercase tracking-tighter">📞 {detail.mobile_number || "+1-555-0000"}</span>
                <span className="text-sm text-gray-500 font-bold">📍 {detail.City}, {detail.State}</span>
              </div>
           </div>

           <div className="flex items-center bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 shadow-inner">
             <div className="px-8 text-center border-r border-gray-200">
               <div className="text-[10px] uppercase font-black text-gray-300 mb-1 tracking-widest">Tenure</div>
               <div className="text-xl font-black text-gray-800">{detail["Tenure in Months"]} Mo</div>
             </div>
             <div className="px-8 text-center border-r border-gray-200">
               <div className="text-[10px] uppercase font-black text-gray-300 mb-1 tracking-widest">LTD Revenue</div>
               <div className="text-xl font-black text-green-600">${ltdRevenue?.toLocaleString()}</div>
             </div>
             <div className="px-8 text-center border-r border-gray-200">
               <div className="text-[10px] uppercase font-black text-gray-300 mb-1 tracking-widest">Contract</div>
               <div className="text-xl font-black text-blue-600">{detail.Contract}</div>
             </div>
             <div className="px-8 text-center">
               <div className="text-[10px] uppercase font-black text-gray-300 mb-1 tracking-widest">Payment</div>
               <div className="text-[14px] font-black text-gray-900 leading-tight">{detail.PaymentMethod || detail["Payment Method"]}</div>
             </div>
           </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
           
           {/* Section 1: Churn Risk Factor */}
           <div className="bg-white rounded-[28px] border-l-[8px] border-red-500 shadow-lg shadow-gray-200/30 overflow-hidden hover:translate-y-[-4px] transition-transform">
              <div className="px-8 py-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <h3 className="font-black text-gray-800 text-[14px] uppercase tracking-widest">Churn Risk Index</h3>
                </div>
                <div className={`${riskBg} px-4 py-1 rounded-full border border-current/10 ${riskColor}`}>
                   <span className="text-[10px] uppercase font-black">Status: Calculated Risk</span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-black uppercase">Risk Label</span>
                      <span className={`text-2xl font-black ${detail["Churn Label"] === "Yes" ? "text-red-600" : "text-green-600"}`}>{detail["Churn Label"]}</span>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-black uppercase">Risk Probability Score</span>
                      <div className={`text-5xl font-black leading-none ${riskColor}`}>{riskScore.toFixed(2)}</div>
                   </div>
                </div>
                <DataRow label="Assigned Category" value={detail["Churn Category"] || "Low Engagement"} color={riskColor} />
                <div className="mt-6 p-5 bg-gray-50 rounded-2xl text-[13px] leading-relaxed text-gray-600 border border-gray-100 font-medium italic relative">
                  <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-gray-300 uppercase">Reasoning Agent</div>
                  "{detail["Churn Reason"] || "No active signals of customer attrition detected in current billing cycle."}"
                </div>
              </div>
           </div>

           {/* Section 2: Profile Intelligence */}
           <div className="bg-white rounded-[28px] border-l-[8px] border-purple-600 shadow-lg shadow-gray-200/30 overflow-hidden hover:translate-y-[-4px] transition-transform">
              <div className="px-8 py-6 border-b flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <h3 className="font-black text-gray-800 text-[14px] uppercase tracking-widest">Profile Intelligence</h3>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <DataRow label="Gender Identity" value={detail.Gender || detail.gender} />
                <DataRow label="Subscriber Age" value={detail.Age} />
                <DataRow label="Senior Citizen" value={detail["Senior Citizen"]} />
                <DataRow label="Marital Status" value={detail.Married} />
                <DataRow label="Dependents" value={detail.Dependents} />
                <DataRow label="No. Dependents" value={detail["Number of Dependents"] || 0} />
              </div>
           </div>

           {/* Section 3: Billing & Revenue History */}
           <div className="bg-white rounded-[28px] border-l-[8px] border-green-500 shadow-lg shadow-gray-200/30 overflow-hidden hover:translate-y-[-4px] transition-transform">
              <div className="px-8 py-6 border-b flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <h3 className="font-black text-gray-800 text-[14px] uppercase tracking-widest">Revenue & Billing</h3>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <DataRow label="Monthly Charge" value={`$${detail["Monthly Charge"]}`} color="text-green-600" />
                <DataRow label="Total Charges" value={`$${totalCharges}`} />
                <DataRow label="LTD Revenue" value={`$${ltdRevenue}`} color="text-green-600" />
                <DataRow label="Total Refunds" value={`$${totalRefunds}`} color="text-red-500" />
                <DataRow label="Long Distance" value={`$${longDistanceCharges}`} />
                <DataRow label="Data Overage" value={`$${extraDataCharges}`} />
                <DataRow label="Paperless bill" value={detail["Paperless Billing"]} />
              </div>
           </div>

           {/* Section 4: Usage & Behavioral Data */}
           <div className="bg-white rounded-[28px] border-l-[8px] border-orange-500 shadow-lg shadow-gray-200/30 overflow-hidden hover:translate-y-[-4px] transition-transform">
              <div className="px-8 py-6 border-b flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <h3 className="font-black text-gray-800 text-[14px] uppercase tracking-widest">Usage Behavior</h3>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <DataRow label="Avg Download" value={`${detail["Avg Monthly GB Download"] || 0} GB`} />
                <DataRow label="Unlimited Data" value={detail["Unlimited Data"] || "No"} />
                <DataRow label="Voice Service" value={detail["Phone Service"]} />
                <DataRow label="Multiple Lines" value={detail["Multiple Lines"]} />
                <DataRow label="Internet Status" value={detail["Internet Service"]} />
                <DataRow label="Line Type" value={detail["Internet Type"]} />
              </div>
           </div>

        </div>

        {/* Section 5: Active Service Provisioning */}
        <div className="bg-white rounded-[28px] border-t-2 border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
           <div className="px-8 py-6 border-b bg-gray-50/30 flex items-center gap-3">
             <span className="text-2xl">🛠️</span>
             <h3 className="font-black text-gray-800 text-[14px] uppercase tracking-widest">Active Service Provisioning</h3>
           </div>
           <div className="p-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
             {[
               { label: "Security", active: detail["Online Security"] === "Yes" },
               { label: "Backup", active: detail["Online Backup"] === "Yes" },
               { label: "Protection", active: detail["Device Protection Plan"] === "Yes" },
               { label: "Support", active: detail["Premium Tech Support"] === "Yes" },
               { label: "Stream TV", active: detail["Streaming TV"] === "Yes" },
               { label: "Movies", active: detail["Streaming Movies"] === "Yes" },
               { label: "Cloud Music", active: detail["Streaming Music"] === "Yes" }
             ].map((s, idx) => (
               <div key={idx} className="flex flex-col items-center group cursor-default">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 border transition-all ${s.active ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100 opacity-40 grayscale"}`}>
                   {s.active ? "✅" : "🔘"}
                 </div>
                 <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">{s.label}</span>
                 <span className={`text-[10px] font-black mt-1 uppercase ${s.active ? "text-blue-600" : "text-gray-300"}`}>
                   {s.active ? "Active" : "Disabled"}
                 </span>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
