"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import SectionTitle from "../shared/SectionTitle";
import ChartCard from "../shared/ChartCard";
import Loading from "../shared/Loading";
import { Bar, Line } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import { TAXONOMY, RISK_LEVELS } from "../offer-engine/OfferTaxonomy";

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub: string; icon: string; color: "purple" | "blue" | "cyan" }) {
  const colorMap = {
    purple: "text-purple-600 bg-purple-50 border-purple-100 shadow-purple-100/50",
    blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/50",
    cyan: "text-cyan-600 bg-cyan-50 border-cyan-100 shadow-cyan-100/50"
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/20 group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-400 tracking-tight flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
            <span className={`w-1.5 h-1.5 rounded-full ${color === 'purple' ? 'bg-purple-500' : color === 'blue' ? 'bg-blue-500' : 'bg-cyan-500'} animate-pulse`} />
            {sub}
          </p>
        </div>
        <div className={`text-2xl p-4 rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OutreachTab() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [msgTemplate, setMsgTemplate] = useState("");

  const [selectedMain, setSelectedMain] = useState(TAXONOMY[0].main_category);
  const [selectedSub, setSelectedSub] = useState(TAXONOMY[0].sub_drivers[0]);
  const [selectedRisk, setSelectedRisk] = useState("Level 1");
  const [activeStrategy, setActiveStrategy] = useState<any>(null);
  const [isFetchingStrategy, setIsFetchingStrategy] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    api.get("/outreach").then((r) => {
      setData(r.data);
      setChannels(r.data.channels);
      
      const main = searchParams.get("main");
      const sub = searchParams.get("sub");
      const risk = searchParams.get("risk");
      
      if (main) setSelectedMain(main);
      if (sub) setSelectedSub(sub);
      if (risk) setSelectedRisk(risk);
      
      if (main && sub && risk) {
        setTimeout(() => {
          setIsFetchingStrategy(true);
          api.post("/outreach/active-campaign", {
            main_category: main,
            sub_category: sub,
            risk_level: risk
          })
            .then((res) => {
              setActiveStrategy(res.data.active_strategy);
              if (res.data.active_strategy?.recommendation) {
                setMsgTemplate(`Hi {{name}}, we noticed you've been with us for {{tenure}} months! As a valued customer, we'd like to offer you a special ${res.data.active_strategy.recommendation.offer_type}. Reply YES to accept.`);
              }
            })
            .catch(console.error)
            .finally(() => setIsFetchingStrategy(false));
        }, 500);
      }
    }).catch(console.error);
  }, [searchParams]);

  const fetchStrategy = () => {
    setIsFetchingStrategy(true);
    api.post("/outreach/active-campaign", {
      main_category: selectedMain,
      sub_category: selectedSub,
      risk_level: selectedRisk
    })
      .then((r) => {
        setActiveStrategy(r.data.active_strategy);
        if (r.data.active_strategy?.recommendation) {
          setMsgTemplate(`Hi {{name}}, we noticed you've been with us for {{tenure}} months! As a valued customer, we'd like to offer you a special ${r.data.active_strategy.recommendation.offer_type}. Reply YES to accept.`);
        } else {
          setMsgTemplate("");
        }
      })
      .catch(console.error)
      .finally(() => setIsFetchingStrategy(false));
  };

  const handleTriggerCampaign = async () => {
    if (!activeStrategy) return;
    const selectedKeys = channels.filter(c => c.selected).map(c => c.key);
    if (selectedKeys.length === 0) {
      alert("Please select at least one outreach channel.");
      return;
    }

    const allowedChannels = ['email', 'whatsapp', 'agent'];
    const unsupportedChannels = selectedKeys.filter(k => !allowedChannels.includes(k.toLowerCase()));
    if (unsupportedChannels.length > 0) {
      alert("Multichannel support (SMS, Telegram) is coming soon! Currently, Email, WhatsApp, and Live Agent are available for execution.");
      return;
    }

    setIsTriggering(true);

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "https://api.agents.snsihub.ai/webhook";
      const hasActiveChannel = selectedKeys.some(k => ['email', 'whatsapp', 'agent'].includes(k.toLowerCase()));
      
      if (hasActiveChannel) {
        await fetch(`${webhookUrl}/triggerEmail`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaign_id: activeStrategy._id,
            main_category: selectedMain,
            sub_category: selectedSub,
            risk_level: selectedRisk,
            customer_count: activeStrategy.customer_count,
            offer_title: activeStrategy.recommendation.title,
            offer_type: activeStrategy.recommendation.offer_type,
            offer_summary: activeStrategy.recommendation.offer_summary,
            channels: selectedKeys,
            platforms: selectedKeys, 
            target_customers: activeStrategy.customers.map((c: any) => ({
              customer_id: c.customer_id || c["Customer ID"],
              name: c.name || `Customer ${c.customer_id}`,
              email: c.email || `${(c.customer_id || "unknown").toLowerCase()}@client.com`,
              phone: c.mobile_number || "",
              state: c.state,
              churn_reason: c.churn_reason,
              rationale: c.rationale
            }))
          })
        });
      }

      await api.post("/outreach/trigger", {
        campaign_id: activeStrategy._id,
        channels: selectedKeys,
        message_template: msgTemplate
      });

      alert(`Campaign triggered successfully! External integrations notified.`);
      api.get("/outreach").then(res => setData(res.data));
    } catch (e) {
      console.error("Campaign trigger failed:", e);
      alert("Failed to trigger campaign.");
    } finally {
      setIsTriggering(false);
    }
  };


  const toggleChannel = (key: string) => {
    setChannels((prev) => prev.map((c) => c.key === key ? { ...c, selected: !c.selected } : c));
  };

  if (!data) return <div className="flex items-center justify-center min-h-[500px]"><Loading message="Synchronising Outreach Intelligence..." /></div>;

  const k = data.kpis;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 mt-6 lg:mt-10">
      <AgentHeader
        number="4"
        title="Outreach Automation Agent"
        subtitle="Multi-channel campaign orchestration"
        color="purple"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Campaigns Active" value={k.campaigns_triggered} sub="Execution Persistence" icon="🚀" color="purple" />
        <StatCard label="Messages Transmitted" value={k.messages_sent.toLocaleString()} sub="Direct Connectivity" icon="✉️" color="blue" />
        <StatCard label="Operational Cost" value={`$${k.total_contact_cost}`} sub="Outreach Expenditure" icon="💰" color="cyan" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-[32px] border border-slate-200/60 p-10 shadow-xl shadow-slate-200/30 group">
          <div className="flex items-center gap-3 mb-8">
             <span className="p-2.5 bg-purple-50 rounded-xl text-xl">🎯</span>
             <h4 className="text-[17px] font-black text-slate-800 uppercase tracking-tight">Target Cohort Selection</h4>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Macro Dimension</label>
              <select
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-[13px] font-bold text-slate-700 focus:ring-4 focus:ring-purple-50 transition-all outline-none appearance-none"
                value={selectedMain}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setSelectedMain(newVal);
                  const firstSub = TAXONOMY.find(t => t.main_category === newVal)?.sub_drivers[0] || "";
                  setSelectedSub(firstSub);
                }}
              >
                {TAXONOMY.map(t => <option key={t.main_category} value={t.main_category}>{t.main_category}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Micro Driver</label>
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-[13px] font-bold text-slate-700 focus:ring-4 focus:ring-purple-50 transition-all outline-none appearance-none"
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                >
                  {(TAXONOMY.find((t) => t.main_category === selectedMain)?.sub_drivers || []).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Risk Intensity</label>
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-[13px] font-bold text-slate-700 focus:ring-4 focus:ring-purple-50 transition-all outline-none appearance-none"
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                >
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button
            className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-black hover:shadow-xl transition-all disabled:opacity-50"
            onClick={fetchStrategy}
            disabled={isFetchingStrategy}
          >
            {isFetchingStrategy ? "Synchronising..." : "Load Managed Strategy"}
          </button>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200/60 p-10 shadow-xl shadow-slate-200/30 flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <span className="p-2.5 bg-indigo-50 rounded-xl text-xl">📋</span>
               <h4 className="text-[17px] font-black text-slate-800 uppercase tracking-tight">Active Campaign Strategy
</h4>
            </div>
            {activeStrategy && (
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 italic">
                {activeStrategy.customer_count} Target Customers
              </span>
            )}
          </div>

          {isFetchingStrategy ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Parsing Strategy Ledger...</span>
            </div>
          ) : activeStrategy ? (
            <div className="flex-1 flex flex-col space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Validated Protocol</span>
                <h5 className="text-[22px] font-black text-slate-800 tracking-tight">{activeStrategy.recommendation.title}</h5>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50/50 to-white rounded-2xl border border-purple-100 shadow-inner">
                <p className="text-[14px] text-slate-700 font-bold leading-relaxed italic pr-4">
                  "{activeStrategy.recommendation.offer_summary}"
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center gap-4">
                {/* <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Probability</span>
                  <span className="text-[18px] font-black text-emerald-600">High Confidence</span>
                </div> */}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
               <span className="text-3xl mb-4 grayscale opacity-40">🔌</span>
               <p className="text-[13px] text-slate-400 font-bold max-w-[240px]">No active protocols found. Persist an offer in the Generator first.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <SectionTitle title="Channel Execution Plan" color="purple" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {channels.map((c) => {
            const isEnabled = ["email", "whatsapp", "agent"].includes(c.key.toLowerCase());
            const isSelected = c.selected;
            return (
              <div
                key={c.key}
                className={`relative p-6 rounded-[28px] border transition-all duration-300 group ${
                   !isEnabled ? "opacity-40 grayscale cursor-not-allowed border-slate-100 bg-slate-50" : 
                   isSelected ? "bg-purple-50/50 border-purple-200 shadow-lg shadow-purple-100 ring-2 ring-purple-400 ring-offset-2 scale-[1.02]" : 
                   "bg-white border-slate-200/60 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                }`}
                onClick={() => isEnabled && toggleChannel(c.key)}
              >
                {!isEnabled && (
                  <div className="absolute top-4 right-4 text-[10px] grayscale select-none text-slate-400 font-black">LOCKED</div>
                )}
                <div className={`text-3xl mb-4 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>{c.icon}</div>
                <div className="space-y-1">
                  <h5 className="text-[14px] font-black text-slate-800 tracking-tight">{c.title}</h5>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${c.cost_per_contact.toFixed(2)} / Customer</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[24px] text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-200 hover:shadow-indigo-300 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
          onClick={handleTriggerCampaign}
          disabled={!activeStrategy || isTriggering}
        >
          {isTriggering ? (
             <div className="flex items-center gap-3">
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
               Launching Sequence...
             </div>
          ) : (
            <div className="flex items-center gap-3">
              <span>Execute Campaign for {activeStrategy?.customer_count || 0} Customers</span>
              <span className="transition-transform group-hover:translate-x-1 group-hover:rotate-12">🚀</span>
            </div>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Channel Performance" icon="📊" height={450}>
          <div className="p-4 h-full">
            <Bar data={{
              labels: data.charts.channel_performance.labels,
              datasets: [
                { 
                  label: "Transmission Volume", 
                  data: data.charts.channel_performance.counts, 
                  backgroundColor: [
                    "rgba(99, 102, 241, 0.8)",   // Indigo
                    "rgba(147, 51, 234, 0.8)",   // Purple
                    "rgba(59, 130, 246, 0.8)",   // Blue
                    "rgba(45, 212, 191, 0.8)",   // Teal
                    "rgba(244, 63, 94, 0.8)"      // Rose (Red accent)
                  ], 
                  borderRadius: 12 
                },
              ],
            }} options={{
              ...defaultOptions,
              maintainAspectRatio: false,
              plugins: { ...defaultOptions.plugins, legend: { display: false } },
              scales: {
                ...defaultOptions.scales,
                y: { 
                  ...defaultOptions.scales?.y, 
                  beginAtZero: true,
                  min: 0,
                  ticks: { ...defaultOptions.scales?.y?.ticks, stepSize: 20 }
                }
              }
            }} />
          </div>
        </ChartCard>
        
        <ChartCard title="Daily Outreach Timeline" icon="📈" height={450}>
          <div className="p-4 h-full">
            <Line data={{
              labels: data.charts.timeline.labels,
              datasets: [{ 
                label: "Notified Customers", 
                data: data.charts.timeline.messages_sent, 
                borderColor: "#4f46e5", 
                backgroundColor: "rgba(79, 70, 229, 0.05)", 
                tension: 0.4, 
                fill: true,
                pointBackgroundColor: "#4f46e5",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4
              }],
            }} options={{
              ...defaultOptions,
              maintainAspectRatio: false,
              scales: {
                ...defaultOptions.scales,
                y: {
                  ...defaultOptions.scales?.y,
                  min: 0,
                  ticks: { ...defaultOptions.scales?.y?.ticks, stepSize: 20 }
                }
              }
            }} />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
