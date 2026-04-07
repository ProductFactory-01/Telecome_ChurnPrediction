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

  const toNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalCharges = toNumber(detail["Total Charges"]);
  const totalRefunds = toNumber(detail["Total Refunds"]);
  const extraDataCharges = toNumber(detail["Total Extra Data Charges"]);
  const longDistanceCharges = toNumber(detail["Total Long Distance Charges"]);
  const ltdRevenue = detail["Total Revenue"] || (totalCharges + extraDataCharges + longDistanceCharges - totalRefunds);

  const isVal = (v: any) => v !== null && v !== undefined && v !== "" && v !== "N/A" && v !== "n/a";

  const StatBox = ({ label, value, color = "blue" }: { label: string; value: any; color?: string }) => {
    if (!isVal(value)) return null;
    return (
      <div className="text-center px-6 border-r border-slate-100 last:border-0 grow">
        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">{label}</div>
        <div className={`text-[16px] font-black ${color === "green" ? "text-emerald-600" : color === "red" ? "text-red-600" : "text-slate-900"}`}>{value}</div>
      </div>
    );
  };

  const DataRow = ({ label, value, color, suffix = "" }: { label: string; value: any; color?: string; suffix?: string }) => {
    if (!isVal(value)) return null;
    return (
      <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-1">
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{label}:</span>
        <span className={`text-[13px] font-black ${color === "red" ? "text-red-600 bg-red-50/50 px-2 py-0.5 rounded" : color === "green" ? "text-emerald-600" : color === "blue" ? "text-indigo-600" : "text-slate-800"}`}>
          {value}{suffix}
        </span>
      </div>
    );
  };

  const ServiceBadge = ({ label, active }: { label: string; active: boolean | string }) => {
    const isActive = active === true || active === "Yes" || active === "1";
    return (
      <div className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all ${isActive ? "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm" : "bg-slate-50 border-slate-100 text-slate-400 opacity-40 shadow-none"}`}>
        <span className="text-lg leading-none">{isActive ? "✅" : "❌"}</span>
        <span className="text-[11px] font-black uppercase tracking-tighter truncate">{label}</span>
      </div>
    );
  };

  const InsightBadge = ({ label, value, color = "purple" }: { label: string; value: any; color?: string }) => {
    if (!isVal(value)) return null;
    return (
      <div className={`p-4 rounded-[20px] border ring-1 ring-inset ${color === "purple" ? "bg-purple-50/40 border-purple-100/50 ring-purple-100/30" : "bg-indigo-50/40 border-indigo-100/50 ring-indigo-100/30"} flex flex-col group hover:shadow-md transition-all`}>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-hover:text-slate-500">{label}</span>
        <span className={`text-sm font-black tracking-tight ${color === "purple" ? "text-purple-700" : "text-indigo-700"}`}>{value}</span>
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#f8fafc] -m-6 p-10 min-h-screen">

      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2.5 bg-white border border-slate-200 px-6 py-2.5 rounded-2xl text-[11px] font-black text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-xl shadow-slate-200/50 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK TO DIRECTORY
        </button>

        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Active Intelligence View</span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(15,23,42,0.08)] border border-white p-0 overflow-hidden mb-10 relative">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500" />

        <div className="p-10 flex flex-col xl:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-10 w-full xl:w-auto">
            <div className="w-28 h-28 bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 rounded-[38px] flex items-center justify-center text-white text-5xl font-black shadow-2xl ring-[12px] ring-indigo-50/50">
              {(detail.Name || detail["Customer ID"]).charAt(0)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{detail.Name || detail["Customer ID"]}</h1>
                {/* <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm border ${detail["Customer Status"] === "Stayed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                  {detail["Customer Status"]}
                </div> */}
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs text-slate-400 font-mono font-bold tracking-widest uppercase">{detail["Customer ID"]}</span>
              </div>
              <div className="flex flex-wrap gap-x-10 gap-y-4">
                <span className="text-[14px] text-indigo-600 font-black flex items-center gap-3 hover:opacity-70 transition-opacity cursor-pointer">
                  <span className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shadow-sm">📧</span> {detail.email}
                </span>
                <span className="text-[14px] text-slate-700 font-black flex items-center gap-3">
                  <span className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shadow-sm">📞</span> {detail.mobile_number || "NO RECORD"}
                </span>
                <span className="text-[14px] text-slate-500 font-black flex items-center gap-3">
                  <span className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shadow-sm">📍</span> {detail.City}, {detail.State}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-2 bg-slate-50/50 p-8 rounded-[38px] border border-slate-100 shadow-inner gap-x-2 gap-y-8">
            {/* <StatBox label="CLTV Score" value={`$${detail.CLTV?.toLocaleString()}`} color="green" /> */}
            <StatBox label="Tenure (Mo)" value={detail["Tenure in Months"]} />
            {/* <StatBox label="Risk Index" value={detail["Churn Score"]} color={toNumber(detail["Churn Score"]) > 70 ? "red" : "blue"} /> */}
            <StatBox label="Monthly Charge" value={`$${detail["Monthly Charge"]}`} color="green" />
            {/* <StatBox label="Net Revenue" value={`$${ltdRevenue?.toLocaleString()}`} color="green" /> */}
            <StatBox label="Contract Type" value={detail.Contract} />
            <StatBox label="CSAT / 5" value={detail["Satisfaction Score"]} color={toNumber(detail["Satisfaction Score"]) < 3 ? "red" : "green"} />
            {/* <StatBox label="Active Offer" value={detail.Offer} /> */}
          </div>
        </div>
      </div>

      {/* Analytics Matrix Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-10">

        {/* Churn Diagnostic Card */}
        <div className="bg-white rounded-[40px] border-l-[14px] border-red-500 shadow-xl shadow-slate-200/40 p-10 border border-slate-100 flex flex-col group">
          <div className="flex items-center gap-4 mb-10">
            <span className="p-3.5 bg-red-50 rounded-[18px] text-2xl shadow-sm group-hover:scale-110 transition-transform">🎯</span>
            <h3 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">Churn Diagnostic Hub</h3>
          </div>
          <div className="space-y-8 flex-1">
            <div className="flex items-center justify-between p-8 bg-gradient-to-br from-red-50/60 to-white rounded-[32px] border border-red-100/50 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[12px] text-red-400 font-black uppercase tracking-[0.15em] mb-2">Churn Probability</span>
                <span className="text-red-600 font-black text-4xl tracking-tighter uppercase">{detail["Churn Label"]}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[12px] text-red-400 font-black uppercase tracking-[0.15em] mb-2">Score</span>
                <span className="text-red-700 font-black text-7xl leading-none tracking-tighter">{detail["Churn Score"]}</span>
              </div>
            </div>
            <div className="space-y-3">
              <DataRow label="Churn Category" value={detail["Churn Category"]} color="red" />
              <div className="mt-8 p-8 bg-slate-50/80 rounded-[30px] border border-dashed border-slate-200 group-hover:border-red-200 transition-colors relative">
                <div className="absolute -top-3 left-6 bg-white px-3 py-0.5 rounded-full border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Diagnostic Reasoning Agent</div>
                <span className="text-[15px] text-slate-700 font-bold leading-relaxed italic block font-serif">"{detail["Churn Reason"] || "Baseline analysis suggests no immediate risk; monitoring retention signals."}"</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Engineered Profile (Secret Sauce) */}
        {(hasAIFeatures || hasAIStats) && (
          <div className="xl:col-span-2 bg-white rounded-[40px] border-l-[14px] border-indigo-600 shadow-xl shadow-slate-200/40 p-10 border border-slate-100 overflow-hidden group">
            <div className="flex items-center gap-4 mb-10">
              <span className="p-3.5 bg-indigo-50 rounded-[18px] text-2xl shadow-sm group-hover:scale-110 transition-transform">🧠</span>
              <h3 className="text-[18px] font-black text-slate-800 uppercase tracking-tight">Featured Data</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
              <InsightBadge label="Loyalty index" value={detail["Loyalty Score"]} />
              <InsightBadge label="Contract Risk" value={detail["Contract Risk Score"]} />
              <InsightBadge label="Network Qu." value={detail["Network Quality Score"]} />
              <InsightBadge label="Call Quality" value={detail["Call Quality Score"]} />
              <InsightBadge label="Value Gap" value={detail["Value-to-Spend Ratio"]} />
              <InsightBadge label="Spend Bias" value={detail["Charge Deviation"]} color="blue" />
              <InsightBadge label="Complaint Sev." value={detail["Complaint Severity Index"]} />
              <InsightBadge label="Refund Prop." value={detail["Refund Rate"]} color="blue" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-2 border-t border-slate-50 pt-8">
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

      <div className={`grid grid-cols-1 ${numSecondaryCards >= 3 ? 'lg:grid-cols-3' : numSecondaryCards === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-10 mb-10`}>

        {/* Technical Health Matrix */}
        {hasNetwork && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 p-10 hover:shadow-2xl transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <span className="p-3 bg-orange-50 rounded-[16px] text-2xl group-hover:rotate-12 transition-transform">📶</span>
              <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-tight">Network Intelligence</h3>
            </div>
            <div className="space-y-1">
              <DataRow label="Signal Strength" value={detail.SignalStrength} suffix=" dBm" />
              <DataRow label="Throughput" value={detail.Throughput} suffix=" Mbps" color="green" />
              <DataRow label="Latency (ms)" value={detail.Latency} suffix=" ms" color={toNumber(detail.Latency) > 80 ? "red" : "green"} />
              <DataRow label="Packet Drop" value={detail.PacketLoss} suffix=" %" color={toNumber(detail.PacketLoss) > 1 ? "red" : "green"} />
              <DataRow label="Jittering" value={detail.Jitter} suffix=" ms" />
              <div className="h-4" />
              <DataRow label="Dropped Calls" value={detail.DroppedCalls} color={toNumber(detail.DroppedCalls) > 5 ? "red" : ""} />
              <DataRow label="Blocked Calls" value={detail.BlockedCalls} />
              <DataRow label="Dormant Pattern" value={detail.SIMInactivePattern} />
            </div>
          </div>
        )}

        {/* Support & Relationship Card */}
        {hasSentiment && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 p-10 hover:shadow-2xl transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <span className="p-3 bg-blue-50 rounded-[16px] text-2xl group-hover:rotate-12 transition-transform">🗳️</span>
              <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-tight">Service Sentiment</h3>
            </div>
            <div className="space-y-1">
              <DataRow label="Support Issue" value={detail.ComplaintType} color="blue" />
              <DataRow label="Status" value={detail.ComplaintResolution} />
              <DataRow label="Freq. Count" value={detail.ComplaintFrequency} color={toNumber(detail.ComplaintFrequency) > 1 ? "red" : ""} />
              <DataRow label="Channel" value={detail.ComplaintMedium} />
              <div className="h-4" />
              <DataRow label="Payment Delay" value={detail.PaymentDelay} suffix=" Days" color={toNumber(detail.PaymentDelay) > 0 ? "red" : "green"} />
              <DataRow label="Plan Chg Index" value={detail.PlanChangeTracking} />
              <DataRow label="Handset Cap." value={detail.DeviceCapability} />
              <div className="h-4" />
              {isVal(detail.Complaint) && (
                <div className="mt-2 p-5 bg-slate-50 rounded-[20px] border border-slate-100 italic text-[13px] text-slate-600 font-medium">
                  "{detail.Complaint}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Consumption Hub */}
        {hasSpending && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 p-10 hover:shadow-2xl transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <span className="p-3 bg-emerald-50 rounded-[16px] text-2xl group-hover:rotate-12 transition-transform">💎</span>
              <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-tight">Spending Profile</h3>
            </div>
            <div className="space-y-1">
              <DataRow label="Average Check" value={detail["Avg Monthly Spend"]} suffix=" /mo" color="green" />
              <DataRow label="Bandwidth DL" value={detail["Avg Monthly GB Download"]} suffix=" GB" />
              <DataRow label="Value Ratios" value={detail["Value-to-Spend Ratio"]} color="blue" />
              <DataRow label="Extra Data" value={isVal(detail["Total Extra Data Charges"]) ? `$${detail["Total Extra Data Charges"]}` : null} />
              <DataRow label="Long Distance" value={isVal(detail["Total Long Distance Charges"]) ? `$${detail["Total Long Distance Charges"]}` : null} />
              <div className="h-4" />
              <DataRow label="Lifetime Rev" value={`$${ltdRevenue?.toLocaleString()}`} color="green" />
              <DataRow label="Refund Total" value={isVal(detail["Total Refunds"]) ? `$${detail["Total Refunds"]}` : null} color={toNumber(detail["Total Refunds"]) > 0 ? "red" : ""} />
              <DataRow label="Paperless bill" value={detail["Paperless Billing"]} />
            </div>
          </div>
        )}
      </div>

      {/* Infrastructure Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 pb-10">

        {/* Demographic & Location Matrix */}
        {(hasGeo || hasDemogs) && (
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 flex flex-col gap-8">
            {hasGeo && (
              <div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 pb-2 border-b border-slate-50">Geospatial Data</h3>
                <div className="space-y-1">
                  <DataRow label="Zipcode" value={detail["Zip Code"]} />
                  <DataRow label="Population Size" value={detail.population || detail.Population} />
                  <DataRow label="Coordinates" value={`${toNumber(detail.Latitude).toFixed(2)} / ${toNumber(detail.Longitude).toFixed(2)}`} />
                </div>
              </div>
            )}
            {hasDemogs && (
              <div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 pb-2 border-b border-slate-50">Demographics</h3>
                <div className="space-y-1">
                  <DataRow label="Under 30" value={detail["Under 30"]} />
                  <DataRow label="Senior" value={detail["Senior Citizen"]} />
                  <DataRow label="Married" value={detail.Married} />
                  <DataRow label="Dependents" value={detail.Dependents} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Provisioning Matrix */}
        <div className={`${(hasGeo || hasDemogs) ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-[40px] border border-slate-100 shadow-sm p-10`}>
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" /> Additional Services
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5">
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
  );
}
