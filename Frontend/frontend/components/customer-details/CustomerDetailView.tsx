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
          <div className="text-gray-500 font-medium tracking-tight font-sans">Synchronizing Customer Profile...</div>
        </div>
      </div>
    );
  }

  const toNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const isVal = (v: any) => v !== null && v !== undefined && v !== "" && v !== "N/A" && v !== "n/a";

  const StatBox = ({ label, value, color = "blue" }: { label: string; value: any; color?: string }) => {
    if (!isVal(value)) return null;
    return (
      <div className="text-center px-4 border-r border-gray-100 last:border-0 grow">
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">{label}</div>
        <div className={`text-[15px] font-black ${color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : "text-gray-900"}`}>{value}</div>
      </div>
    );
  };

  const DataRow = ({ label, value, color, suffix = "" }: { label: string; value: any; color?: string; suffix?: string }) => {
    if (!isVal(value)) return null;
    return (
      <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-1">
        <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-tight">{label}:</span>
        <span className={`text-[13px] font-bold ${color === "red" ? "text-red-600 bg-red-50/50 px-2 py-0.5 rounded" : color === "green" ? "text-green-600" : color === "blue" ? "text-blue-600" : "text-gray-800"}`}>
          {value}{suffix}
        </span>
      </div>
    );
  };

  const ServiceBadge = ({ label, active }: { label: string; active: boolean | string }) => {
    const isActive = active === true || active === "Yes" || active === "1";
    return (
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${isActive ? "bg-blue-50 border-blue-100 text-blue-700 shadow-sm" : "bg-gray-50 border-gray-100 text-gray-400 opacity-40 shadow-none"}`}>
        <span className="text-lg leading-none">{isActive ? "✅" : "❌"}</span>
        <span className="text-[11px] font-black uppercase tracking-tighter truncate">{label}</span>
      </div>
    );
  };

  const InsightBadge = ({ label, value, color = "purple" }: { label: string; value: any; color?: string }) => {
    if (!isVal(value)) return null;
    return (
      <div className={`p-4 rounded-[20px] border ring-1 ring-inset ${color === "purple" ? "bg-purple-50/40 border-purple-100/50 ring-purple-100/30" : "bg-blue-50/40 border-blue-100/50 ring-blue-100/30"} flex flex-col group hover:shadow-md transition-all`}>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 group-hover:text-gray-500">{label}</span>
        <span className={`text-sm font-black tracking-tight ${color === "purple" ? "text-purple-700" : "text-blue-700"}`}>{value}</span>
      </div>
    );
  };

  // Section Visibility Logic
  const hasAIFeatures = isVal(detail["Loyalty Score"]) || isVal(detail["Contract Risk Score"]) || isVal(detail["Network Quality Score"]) || isVal(detail["Call Quality Score"]) || isVal(detail["Value-to-Spend Ratio"]) || isVal(detail["Charge Deviation"]) || isVal(detail["Complaint Severity Index"]) || isVal(detail["Refund Rate"]);
  const hasAIStats = isVal(detail["Tenure Group"]) || isVal(detail["Age Group"]) || isVal(detail["Service Count"]) || isVal(detail["Avg Monthly Spend"]) || isVal(detail["Add-on Revenue Share"]);
  const hasNetwork = isVal(detail.SignalStrength) || isVal(detail.Throughput) || isVal(detail.Latency) || isVal(detail.PacketLoss) || isVal(detail.Jitter) || isVal(detail.DroppedCalls) || isVal(detail.BlockedCalls) || isVal(detail.SIMInactivePattern);
  const hasSentiment = isVal(detail.ComplaintType) || isVal(detail.ComplaintResolution) || isVal(detail.ComplaintFrequency) || isVal(detail.ComplaintMedium) || isVal(detail.PaymentDelay) || isVal(detail.PlanChangeTracking) || isVal(detail.DeviceCapability) || isVal(detail.Complaint);
  const hasSpending = isVal(detail["Avg Monthly Spend"]) || isVal(detail["Avg Monthly GB Download"]) || isVal(detail["Value-to-Spend Ratio"]) || isVal(detail["Total Extra Data Charges"]) || isVal(detail["Total Long Distance Charges"]) || isVal(detail["Total Refunds"]) || isVal(detail["Paperless Billing"]);
  const hasGeo = isVal(detail["Zip Code"]) || isVal(detail.population) || isVal(detail.Population) || isVal(detail.Latitude) || isVal(detail.Longitude);
  const hasDemogs = isVal(detail["Under 30"]) || isVal(detail["Senior Citizen"]) || isVal(detail.Married) || isVal(detail.Dependents);

  const numSecondaryCards = [hasNetwork, hasSentiment, hasSpending].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex overflow-y-auto p-4 lg:p-10 animate-in fade-in duration-500 font-sans">
      <div className="m-auto w-full max-w-[1400px] bg-[#f8fafc] rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-white overflow-hidden flex flex-col">

        {/* Header Hero Section */}
        <div className="bg-white px-10 py-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 border-b border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

          <div className="flex flex-col gap-6 w-full lg:w-auto">
            <button onClick={onClose} className="w-fit flex items-center gap-2.5 px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-200 active:scale-95 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Intelligence
            </button>
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-2xl ring-8 ring-blue-50/50">
                {(detail.Name || detail["Customer ID"]).charAt(0)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{detail.Name || detail["Customer ID"]}</h2>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-400 font-mono font-bold tracking-widest uppercase">{detail["Customer ID"]}</span>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <span className="text-[13px] text-blue-600 font-black flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
                    <span className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">📧</span> {detail.email}
                  </span>
                  <span className="text-[13px] text-gray-700 font-black flex items-center gap-2.5">
                    <span className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">📞</span> {detail.mobile_number}
                  </span>
                  <span className="text-[13px] text-gray-500 font-black flex items-center gap-2.5">
                    <span className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">📍</span> {detail.City}, {detail.State}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50 shadow-inner gap-y-6 gap-x-2">
            <StatBox label="Tenure (Mo)" value={detail["Tenure in Months"]} />
            <StatBox label="Risk index" value={detail["Churn Score"]} color={detail["Churn Score"] > 70 ? "red" : "blue"} />
            <StatBox label="Monthly Charge" value={`$${detail["Monthly Charge"]}`} color="green" />
            <StatBox label="Contract" value={detail.Contract} />
            <StatBox label="Satisfaction Score" value={detail["Satisfaction Score"]} color={detail["Satisfaction Score"] < 3 ? "red" : "green"} />
          </div>
        </div>

        {/* Content Explorer Area */}
        <div className="p-10 space-y-10 overflow-y-auto max-h-[75vh] custom-scrollbar bg-[#f8fafc]">

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

            {/* Churn Prediction Hub */}
            <div className="bg-white rounded-[32px] border-l-[12px] border-red-500 shadow-xl shadow-gray-200/50 p-8 border border-gray-100 flex flex-col group relative">
              <div className="flex items-center gap-4 mb-8">
                <span className="p-3 bg-red-50 rounded-[14px] text-2xl shadow-sm">🎯</span>
                <h3 className="text-[18px] font-black text-gray-800 uppercase tracking-tight">Churn Diagnostic Hub</h3>
              </div>
              <div className="space-y-6 flex-1">
                <div className="flex items-center justify-between p-6 bg-gradient-to-br from-red-50/80 to-white rounded-3xl border border-red-100/60 shadow-inner">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-red-400 font-black uppercase tracking-[0.1em] mb-1">State Prediction</span>
                    <span className="text-red-600 font-black text-3xl tracking-tighter uppercase">{detail["Churn Label"]}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[12px] text-red-400 font-black uppercase tracking-[0.1em] mb-1">Risk Score</span>
                    <span className="text-red-700 font-black text-6xl leading-none">{detail["Churn Score"]}</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <DataRow label="Churn Category" value={detail["Churn Category"]} color="red" />
                  <div className="mt-6 p-6 bg-gray-50/50 rounded-[24px] border border-dashed border-gray-200 group-hover:border-red-200 transition-colors">
                    <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest block mb-3">AI Context Reasoning:</span>
                    <span className="text-[14px] text-gray-700 font-bold leading-relaxed italic block font-serif">"{detail["Churn Reason"] || "Baseline analysis suggests no immediate risk; monitoring retention signals."}"</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Feature Intelligence (Secret Sauce) */}
            {(hasAIFeatures || hasAIStats) && (
              <div className="xl:col-span-2 bg-white rounded-[32px] border-l-[12px] border-indigo-600 shadow-xl shadow-gray-200/50 p-8 border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <span className="p-3 bg-indigo-50 rounded-[14px] text-2xl shadow-sm">🧠</span>
                  <h3 className="text-[18px] font-black text-gray-800 uppercase tracking-tight">AI Generated Feature Profile (The Secret Sauce)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <InsightBadge label="Loyalty Sc." value={detail["Loyalty Score"]} />
                  <InsightBadge label="Contract Risk" value={detail["Contract Risk Score"]} />
                  <InsightBadge label="Network Qu." value={detail["Network Quality Score"]} />
                  <InsightBadge label="Call Quality" value={detail["Call Quality Score"]} />
                  <InsightBadge label="Value/Spend" value={detail["Value-to-Spend Ratio"]} />
                  <InsightBadge label="Spend Bias" value={detail["Charge Deviation"]} color="blue" />
                  <InsightBadge label="Compl. Sev." value={detail["Complaint Severity Index"]} />
                  <InsightBadge label="Refund Rate" value={detail["Refund Rate"]} color="blue" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-2 border-t border-gray-50 pt-6">
                  <DataRow label="Tenure Seg." value={detail["Tenure Group"]} color="blue" />
                  <DataRow label="Age Segment" value={detail["Age Group"]} color="blue" />
                  <DataRow label="Total Ser." value={detail["Service Count"]} color="blue" />
                  <DataRow label="Heavy Usage" value={isVal(detail["Internet Heavy User Flag"]) ? (detail["Internet Heavy User Flag"] ? "Yes" : "No") : null} />
                  <DataRow label="Dormancy" value={isVal(detail["SIM Inactivity Flag"]) ? (detail["SIM Inactivity Flag"] ? "Yes" : "No") : null} />
                  <DataRow label="Premium Eq." value={isVal(detail["Premium Tier Flag"]) ? (detail["Premium Tier Flag"] ? "Yes" : "No") : null} />
                  <DataRow label="Rev Share" value={detail["Add-on Revenue Share"]} suffix="%" />
                  <DataRow label="Avg Spend" value={detail["Avg Monthly Spend"]} suffix=" /mo" />
                  <DataRow label="Advocacy Score" value={detail["Number of Referrals"]} />
                </div>
              </div>
            )}
          </div>

          {/* Deep Analytics Grid Layer */}
          <div className={`grid grid-cols-1 ${numSecondaryCards >= 3 ? 'lg:grid-cols-3' : numSecondaryCards === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-10`}>

            {/* Technical Performance Hub */}
            {hasNetwork && (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-8">
                  <span className="p-3 bg-orange-50 rounded-[14px] text-2xl">📶</span>
                  <h3 className="text-[16px] font-black text-gray-800 uppercase tracking-tight">Network Performance</h3>
                </div>
                <div className="space-y-1">
                  <DataRow label="Signal Strength" value={detail.SignalStrength} suffix=" dBm" />
                  <DataRow label="Throughput" value={detail.Throughput} suffix=" Mbps" color="green" />
                  <DataRow label="Latency" value={detail.Latency} suffix=" ms" color={toNumber(detail.Latency) > 80 ? "red" : "green"} />
                  <DataRow label="Jittering" value={detail.Jitter} suffix=" ms" />
                  <DataRow label="Packet Drop" value={detail.PacketLoss} suffix=" %" color={toNumber(detail.PacketLoss) > 1 ? "red" : "green"} />
                  <div className="h-4" />
                  <DataRow label="Dropped Total" value={detail.DroppedCalls} color={toNumber(detail.DroppedCalls) > 3 ? "red" : ""} />
                  <DataRow label="Blocking Total" value={detail.BlockedCalls} />
                  <DataRow label="Dormant Pat." value={detail.SIMInactivePattern} />
                </div>
              </div>
            )}

            {/* Service & Sentiment Intelligence */}
            {hasSentiment && (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-8">
                  <span className="p-3 bg-blue-50 rounded-[14px] text-2xl">🗳️</span>
                  <h3 className="text-[16px] font-black text-gray-800 uppercase tracking-tight">Service Sentiment</h3>
                </div>
                <div className="space-y-1">
                  <DataRow label="Issue Type" value={detail.ComplaintType} color="blue" />
                  <DataRow label="Resolution" value={detail.ComplaintResolution} />
                  <DataRow label="Freq. index" value={detail.ComplaintFrequency} color={toNumber(detail.ComplaintFrequency) > 1 ? "red" : ""} />
                  <DataRow label="Channel" value={detail.ComplaintMedium} />
                  <div className="h-4" />
                  <DataRow label="Payment Delay" value={detail.PaymentDelay} suffix=" Days" color={toNumber(detail.PaymentDelay) > 0 ? "red" : "green"} />
                  <DataRow label="Plan Chg Count" value={detail.PlanChangeTracking} />
                  <DataRow label="Handset Cap." value={detail.DeviceCapability} />
                  <div className="h-4" />
                  {isVal(detail.Complaint) && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-[12px] text-gray-500">
                      "{detail.Complaint}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financial Health Hub */}
            {hasSpending && (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-8">
                  <span className="p-3 bg-green-50 rounded-[14px] text-2xl">💎</span>
                  <h3 className="text-[16px] font-black text-gray-800 uppercase tracking-tight">Financial Health</h3>
                </div>
                <div className="space-y-1">
                  <DataRow label="Monthly Spend" value={detail["Avg Monthly Spend"]} suffix=" /mo" color="green" />
                  <DataRow label="Bandwidth DL" value={detail["Avg Monthly GB Download"]} suffix=" GB" />
                  <DataRow label="Extra Data" value={isVal(detail["Total Extra Data Charges"]) ? `$${detail["Total Extra Data Charges"]}` : null} />
                  <DataRow label="Long Dist" value={isVal(detail["Total Long Distance Charges"]) ? `$${detail["Total Long Distance Charges"]}` : null} />
                  <DataRow label="Advocacy (Ref)" value={detail["Referred a Friend"]} />
                  <DataRow label="Total Ref." value={detail["Number of Referrals"]} color="blue" />
                  <div className="h-4" />
                  <DataRow label="LTD Revenue" value={`$${(detail["Total Charges"] || (toNumber(detail["Tenure in Months"]) * toNumber(detail["Monthly Charge"])))?.toLocaleString()}`} color="green" />
                  <DataRow label="Extra Refund" value={isVal(detail["Total Refunds"]) ? `$${detail["Total Refunds"]}` : null} color={toNumber(detail["Total Refunds"]) > 0 ? "red" : ""} />
                  <DataRow label="Paperless bill" value={detail["Paperless Billing"]} />
                </div>
              </div>
            )}
          </div>

          {/* Infrastructure Matrix Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 pb-10">

            {/* Demographic & Location Summary */}
            {(hasGeo || hasDemogs) && (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col gap-8">
                {hasGeo && (
                  <div>
                    <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Location Context</h3>
                    <div className="space-y-1">
                      <DataRow label="Zipcode" value={detail["Zip Code"]} />
                      <DataRow label="Population" value={detail.population || detail.Population} />
                      <DataRow label="Geoloc" value={`${toNumber(detail.Latitude).toFixed(2)} / ${toNumber(detail.Longitude).toFixed(2)}`} />
                    </div>
                  </div>
                )}
                {hasDemogs && (
                  <div>
                    <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Subscriber Segment</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      <DataRow label="Under 30" value={detail["Under 30"]} />
                      <DataRow label="Senior" value={detail["Senior Citizen"]} />
                      <DataRow label="Married" value={detail.Married} />
                      <DataRow label="Dependents" value={detail.Dependents} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Service Offering Matrix */}
            <div className={`${(hasGeo || hasDemogs) ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-[32px] border border-gray-100 shadow-sm p-8`}>
              <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" /> Infrastructure & Service Offering Matrix
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <ServiceBadge label="Phone" active={detail["Phone Service"]} />
                <ServiceBadge label="Internet" active={detail["Internet Service"]} />
                <ServiceBadge label="Multi-Line" active={detail["Multiple Lines"]} />
                <ServiceBadge label="Unlimited" active={detail["Unlimited Data"]} />
                <ServiceBadge label="Security" active={detail["Online Security"]} />
                <ServiceBadge label="Backup" active={detail["Online Backup"]} />
                <ServiceBadge label="Support" active={detail["Premium Tech Support"]} />
                <ServiceBadge label="Protection" active={detail["Device Protection"]} />
                <ServiceBadge label="Stream TV" active={detail["Streaming TV"]} />
                <ServiceBadge label="Movie Hub" active={detail["Streaming Movies"]} />
                <ServiceBadge label="Music Hub" active={detail["Streaming Music"]} />
                <ServiceBadge label="Paperless" active={detail["Paperless Billing"]} />
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
