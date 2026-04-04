"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";

interface Props {
  customerId: string;
  onClose: () => void;
}

export default function CustomerDetailView({ customerId, onClose }: Props) {
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
    return (
      <div className="fixed inset-0 z-[100] flex bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="m-auto bg-white rounded-2xl p-12 shadow-2xl flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-gray-500 font-medium">Synchronizing Customer Profile...</div>
        </div>
      </div>
    );
  }

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

  const StatBox = ({ label, value, color = "blue" }: { label: string; value: any; color?: string }) => (
    <div className="text-center px-4 border-r border-gray-100 last:border-0">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{label}</div>
      <div className={`text-[15px] font-bold ${color === "green" ? "text-green-600" : "text-gray-800"}`}>{value}</div>
    </div>
  );

  const DataRow = ({ label, value, color }: { label: string; value: any; color?: string }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-[12px] text-gray-500">{label}:</span>
      <span className={`text-[13px] font-semibold ${color === "red" ? "text-red-600 bg-red-50 px-1.5 rounded" : color === "green" ? "text-green-600" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );

  const ServiceBadge = ({ label, active }: { label: string; active: boolean }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${active ? "bg-blue-50 border-blue-100 text-blue-700 font-semibold" : "bg-gray-50 border-gray-100 text-gray-400 opacity-60"}`}>
      <span className="text-lg">{active ? "✅" : "❌"}</span>
      <span className="text-[12px]">{label}: {active ? "Yes" : "No"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex overflow-y-auto p-4 lg:p-8 animate-in fade-in zoom-in duration-300">
      <div className="m-auto w-full max-w-6xl bg-[#f8fafc] rounded-[24px] shadow-2xl border border-white/40 overflow-hidden flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-white border-b p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <button onClick={onClose} className="w-fit flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200">
              ← Back to List
            </button>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {(detail.Name || detail["Customer ID"]).charAt(0)}
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-gray-900 leading-tight">{detail.Name || detail["Customer ID"]}</h2>
                <span className="text-[11px] text-gray-400 font-mono tracking-tighter uppercase mb-2">{detail["Customer ID"]}</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1.5 hover:underline cursor-pointer">📧 {detail.email}</span>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 uppercase tracking-tighter">📞 {detail.mobile_number}</span>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">📍 {detail.City}, {detail.State}, {detail.Country}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
             <StatBox label="Tenure" value={`${detail["Tenure in Months"]} Months`} />
             <StatBox label="LTD Revenue" value={`$${ltdRevenue?.toLocaleString()}`} color="green" />
             <StatBox label="Contract" value={detail.Contract} />
             <StatBox label="Payment" value={detail.PaymentMethod || detail["Payment Method"]} />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Churn Risk */}
            <div className="bg-white rounded-2xl border-l-[6px] border-red-500 shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🎯</span>
                <h3 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Churn Risk Analysis</h3>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[11px] text-gray-400 font-bold uppercase">Risk Label:</span>
                      <span className="text-red-600 font-black text-lg">{detail["Churn Label"]}</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[11px] text-gray-400 font-bold uppercase">Risk Score:</span>
                      <span className="text-red-600 font-black text-4xl leading-none">{(detail["Churn Score"] / 100).toFixed(2)}</span>
                   </div>
                </div>
                <DataRow label="Risk Category" value={detail["Churn Category"] || "None"} color="red" />
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <span className="text-xs text-gray-500 italic block">"{detail["Churn Reason"] || "No active churn reason detected."}"</span>
                </div>
              </div>
            </div>

            {/* Profile Intelligence */}
            <div className="bg-white rounded-2xl border-l-[6px] border-purple-600 shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">👤</span>
                <h3 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Profile Intelligence</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <DataRow label="Gender" value={detail.Gender || detail.gender} />
                <DataRow label="Age" value={detail.Age} />
                <DataRow label="Senior Citizen" value={detail["Senior Citizen"]} />
                <DataRow label="Married" value={detail.Married} />
                <DataRow label="Dependents" value={detail.Dependents} />
                <DataRow label="No. Dependents" value={detail["Number of Dependents"] || 0} />
              </div>
            </div>

            {/* Billing & Revenue */}
            <div className="bg-white rounded-2xl border-l-[6px] border-green-500 shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💳</span>
                <h3 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Billing & Revenue</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <DataRow label="Monthly" value={`$${detail["Monthly Charge"]}`} color="green" />
                <DataRow label="LTD Revenue" value={`$${ltdRevenue}`} color="green" />
                <DataRow label="Total Charges" value={`$${totalCharges}`} />
                <DataRow label="Long Distance" value={`$${longDistanceCharges}`} />
                <DataRow label="Extra Data" value={`$${extraDataCharges}`} />
                <DataRow label="Total Refunds" value={`$${totalRefunds}`} color="red" />
                <DataRow label="Paperless" value={detail["Paperless Billing"]} />
              </div>
            </div>

            {/* Usage & Data */}
            <div className="bg-white rounded-2xl border-l-[6px] border-orange-500 shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📊</span>
                <h3 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Usage & Data</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <DataRow label="Data Usage" value={`${detail["Avg Monthly GB Download"] || 0} GB`} />
                <DataRow label="Unlimited" value={detail["Unlimited Data"] || "No"} />
                <DataRow label="Phone" value={detail["Phone Service"]} />
                <DataRow label="Multiple Lines" value={detail["Multiple Lines"]} />
                <DataRow label="Internet" value={detail["Internet Service"]} />
                <DataRow label="Type" value={detail["Internet Type"]} />
              </div>
            </div>
          </div>

          {/* Active Services */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🛠️</span>
              <h3 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Active Services</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <ServiceBadge label="Security" active={detail["Online Security"] === "Yes"} />
              <ServiceBadge label="Backup" active={detail["Online Backup"] === "Yes"} />
              <ServiceBadge label="Protection" active={detail["Device Protection Plan"] === "Yes"} />
              <ServiceBadge label="Support" active={detail["Premium Tech Support"] === "Yes"} />
              <ServiceBadge label="TV" active={detail["Streaming TV"] === "Yes"} />
              <ServiceBadge label="Movies" active={detail["Streaming Movies"] === "Yes"} />
              <ServiceBadge label="Music" active={detail["Streaming Music"] === "Yes"} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🗺️</span>
                <h3 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Location Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <DataRow label="Zip Code" value={detail["Zip Code"]} />
                <DataRow label="Latitude" value={detail.Latitude} />
                <DataRow label="Longitude" value={detail.Longitude} />
                <DataRow label="Population" value={detail.Population?.toLocaleString()} />
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤝</span>
                <h3 className="text-[15px] font-black text-gray-800 uppercase tracking-tight">Engagement & NPS</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <DataRow label="Referred Friends" value={detail["Referred a Friend"]} />
                <DataRow label="Total Referrals" value={detail["Number of Referrals"] || 0} />
                <DataRow label="Active Offer" value={detail.Offer} />
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[12px] text-gray-500 font-bold uppercase">CSAT Score:</span>
                  <span className="text-xl font-black text-green-600 bg-green-50 px-3 py-0.5 rounded-full border border-green-100">
                    {detail["Satisfaction Score"]} <span className="text-xs text-green-400 font-medium">/ 10</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
