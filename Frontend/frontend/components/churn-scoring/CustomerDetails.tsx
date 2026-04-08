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
  const [predicting, setPredicting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    churn: true,
    network: false,
    sentiment: false,
    spending: false,
    geo: false,
    services: false
  });

  const toggleSection = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePredictReason = async () => {
    setPredicting(true);
    try {
      const resp = await api.post(`/customers/${customerId}/predict-reason`);
      if (resp.data && (resp.data.ai_reason || resp.data.impact_analysis)) {
        setDetail((prev: any) => ({ 
          ...prev, 
          ai_reason: resp.data.ai_reason,
          impact_analysis: resp.data.impact_analysis 
        }));
      }
    } catch (err) {
      console.error("Failed to predict reason:", err);
      // Fallback update to let user know it failed without crashing
      setDetail((prev: any) => ({ ...prev, ai_reason: "AI System temporary offline. Could not generate predictive analysis." }));
    } finally {
      setPredicting(false);
    }
  };

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



  const CollapsibleSection = ({ id, icon, title, children, hasData, badge }: { id: string; icon: string; title: string; children: React.ReactNode; hasData: boolean; badge?: string }) => {
    if (!hasData) return null;
    const isExpanded = expanded[id];

    return (
      <div className={`bg-white rounded-[32px] border transition-all duration-500 overflow-hidden ${isExpanded ? "border-slate-200 shadow-xl shadow-slate-200/50" : "border-slate-100 shadow-sm hover:shadow-md"}`}>
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-8 text-left group outline-none"
        >
          <div className="flex items-center gap-4">
            <span className={`p-3 rounded-[18px] text-2xl transition-all duration-500 ${isExpanded ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"}`}>
              {icon}
            </span>
            <div className="flex flex-col">
              <h3 className={`text-[17px] font-black uppercase tracking-tight transition-colors ${isExpanded ? "text-slate-900" : "text-slate-500"}`}>
                {title}
              </h3>
              {/* {badge && !isExpanded && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 opacity-60">Insight Available • {badge}</span>} */}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${isExpanded ? "bg-slate-900 border-slate-900 rotate-180" : "bg-white border-slate-100 group-hover:border-slate-300"}`}>
            <span className={`text-xl leading-none font-thin ${isExpanded ? "text-white" : "text-slate-400"}`}>↓</span>
          </div>
        </button>

        <div className={`transition-all duration-700 ease-in-out ${isExpanded ? "max-h-[1400px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4 shadow-none pointer-events-none"}`}>
          <div className="px-8 pb-10 pt-2 border-t border-slate-50">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Section Visibility Logic
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

        {/* <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Active Intelligence View</span>
        </div> */}
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
      <div className="space-y-8 mb-10">

        {/* Churn Diagnostic Hub */}
        {/* Churn Diagnostic Hub */}
        <CollapsibleSection id="churn" icon="🎯" title="Churn Diagnostic Hub (Primary Risk)" hasData={true} badge={detail["Churn Label"]}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            
            {/* Left Column: Core Churn Metrics */}
            <div className={`flex items-center justify-between p-10 bg-white rounded-[32px] border transition-all duration-500 shadow-sm relative overflow-hidden group ${detail["Churn Label"] === "Yes" ? "border-red-100" : "border-emerald-100"}`}>
              {/* Subtle accent background */}
              <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${detail["Churn Label"] === "Yes" ? "bg-red-500" : "bg-emerald-500"}`} />
              
              <div className="flex flex-col relative z-10">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${detail["Churn Label"] === "Yes" ? "text-red-500" : "text-emerald-500"}`}>Churn Probability</span>
                <span className={`text-7xl font-black tracking-tighter uppercase leading-none ${detail["Churn Label"] === "Yes" ? "text-red-600" : "text-emerald-600"}`}>
                   {detail["Churn Label"]}
                </span>
              </div>

              <div className="flex flex-col items-end relative z-10">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${detail["Churn Label"] === "Yes" ? "text-red-500" : "text-emerald-500"}`}>Risk Magnitude</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-8xl font-black tracking-tighter leading-none ${detail["Churn Label"] === "Yes" ? "text-red-700" : "text-emerald-700"}`}>{detail["Churn Score"]}</span>
                  <span className={`text-3xl font-black ${detail["Churn Label"] === "Yes" ? "text-red-500" : "text-emerald-500"}`}>%</span>
                </div>
              </div>
            </div>

            {/* Right Column: AI Reasoning Hub */}
            <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm flex flex-col relative group overflow-hidden">
               <div className="flex items-center justify-between mb-8 relative z-10">
                 <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-indigo-50 rounded-xl text-xl">🤖</span>
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Diagnostic Reasoning Agent</h4>
                 </div>
                 {detail.ai_reason && (
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border italic ${detail["Churn Label"] === "Yes" ? "text-red-600 bg-red-50 border-red-100" : "text-emerald-600 bg-emerald-50 border-emerald-100"}`}>
                      {detail["Churn Category"] || "Risk Alert"}
                    </span>
                 )}
               </div>

               <div className="flex-1 relative z-10 divide-y divide-slate-50">
                 {detail.ai_reason ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-inner">
                        <p className="text-[15px] font-bold text-slate-700 leading-relaxed">
                          "{detail.ai_reason}"
                        </p>
                      </div>

                      {/* Factor Impact Analysis */}
                      {detail.impact_analysis && detail.impact_analysis.length > 0 && (
                        <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Risk Driver Analysis</h5>
                           <div className="space-y-3">
                              {detail.impact_analysis.map((factor: any, i: number) => (
                                <div key={i} className="group/factor">
                                  <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{factor.factor}</span>
                                    <span className={`text-[10px] font-black ${factor.impact > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                      {factor.impact > 0 ? "+" : ""}{factor.impact}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex justify-center">
                                     <div 
                                       className={`h-full rounded-full transition-all duration-1000 delay-${i * 100} ${factor.impact > 0 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"}`}
                                       style={{ width: `${Math.abs(factor.impact)}%` }}
                                     />
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400 mt-1 opacity-0 group-hover/factor:opacity-100 transition-opacity">
                                    {factor.description}
                                  </p>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                       {!predicting ? (
                          <button
                            onClick={handlePredictReason}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-indigo-200"
                          >
                            ✨ Generate Predictive Insight
                          </button>
                       ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Engaging LLM Core...</span>
                          </div>
                       )}
                    </div>
                 )}
               </div>
               
               <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </CollapsibleSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CollapsibleSection id="network" icon="📶" title="Network Intelligence" hasData={hasNetwork} badge={`${detail.Throughput} Mbps`}>
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
          </CollapsibleSection>

          <CollapsibleSection id="sentiment" icon="🗳️" title="Service Sentiment" hasData={hasSentiment} badge={detail.ComplaintType}>
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
          </CollapsibleSection>

          <CollapsibleSection id="spending" icon="💎" title="Spending Profile" hasData={hasSpending} badge={`$${detail["Avg Monthly Spend"]}`}>
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
          </CollapsibleSection>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <CollapsibleSection id="geo" icon="📍" title="Geospatial & Demographics" hasData={hasGeo || hasDemogs} badge={detail.City}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
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
          </CollapsibleSection>

          <CollapsibleSection id="services" icon="⚙️" title="Additional Provisioned Services" hasData={true} badge={`${detail["Service Count"] || '12'} Nodes`}>
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
          </CollapsibleSection>
        </div>
      </div>

    </div>
  );
}
