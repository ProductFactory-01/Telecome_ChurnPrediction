"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import AgentHeader from "../shared/AgentHeader";
import SectionTitle from "../shared/SectionTitle";
import KpiCard from "../shared/KpiCard";
import ChartCard from "../shared/ChartCard";
import { Bar, Line } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";
import { TAXONOMY, RISK_LEVELS } from "../offer-engine/OfferTaxonomy";
import styles from "../offer-engine/OfferEngine.module.css";

export default function OutreachTab() {
  const [data, setData] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [msgTemplate, setMsgTemplate] = useState("");

  // Strategy Mapping State
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
    }).catch(console.error);
  }, []);

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

    // Check for non-supported channels
    const allowedChannels = ['email', 'whatsapp'];
    const unsupportedChannels = selectedKeys.filter(k => !allowedChannels.includes(k));
    if (unsupportedChannels.length > 0) {
      alert("Multichannel support (SMS, Telegram, Live Agent) is coming soon! Currently, only Email and WhatsApp are available for execution.");
      return;
    }

    setIsTriggering(true);

    // Make Webhook Call for actual execution
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "https://api.agents.snsihub.ai/webhook";
      
      if (selectedKeys.includes('email')) {
        console.log("Triggering Webhook at:", `${webhookUrl}/triggerEmail`);
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
            target_customers: activeStrategy.customers.map((c: any) => ({
              customer_id: c.customer_id || c["Customer ID"],
              name: c.name || `Customer ${c.customer_id}`,
              email: c.email || `${(c.customer_id || "unknown").toLowerCase()}@client.com`,
              state: c.state,
              churn_reason: c.churn_reason,
              rationale: c.rationale
            }))
          })
        });
      }

      // Record in system
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

  if (!data) return <div className="dashboard-content text-muted">Loading…</div>;

  const k = data.kpis;

  return (
    <div className="dashboard-content">
      <AgentHeader
        number="4"
        title="Outreach Automation Agent"
        subtitle="Multi-channel campaign orchestration with smart scheduling"
        color="purple"
        statusLabel="Ready"
        statusType="active"
      />

      <div className="panel-grid panel-grid--3 mb-6">
        <KpiCard label="Campaigns Triggered" value={k.campaigns_triggered} color="purple" />
        <KpiCard label="Messages Sent" value={k.messages_sent} color="blue" />
        <KpiCard label="Total Contact Cost" value={`$${k.total_contact_cost}`} color="cyan" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px", alignItems: "start" }}>
        {/* Taxonomy Selector */}
        <div className={`${styles.controlPanel} ${styles.offerConfigPanel}`}>
          <h4>Target Cohort Selection</h4>

          <div className={styles.selectorGroup} style={{ marginBottom: "12px" }}>
            <div className={styles.selectorLabel}>Main Category</div>
            <select
              className="dashboard-input"
              value={selectedMain}
              onChange={(e) => {
                const newVal = e.target.value;
                setSelectedMain(newVal);
                // Reset sub-category to the first driver of the new main category
                const firstSub = TAXONOMY.find(t => t.main_category === newVal)?.sub_drivers[0] || "";
                setSelectedSub(firstSub);
              }}
              style={{ width: "100%" }}
            >
              {TAXONOMY.map(t => <option key={t.main_category} value={t.main_category}>{t.main_category}</option>)}
            </select>
          </div>

          <div className={styles.selectorGroup} style={{ marginBottom: "12px" }}>
            <div className={styles.selectorLabel}>Sub Category</div>
            <select
              className="dashboard-input"
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
              style={{ width: "100%" }}
            >
              {(TAXONOMY.find((t) => t.main_category === selectedMain)?.sub_drivers || []).map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectorGroup}>
            <div className={styles.selectorLabel}>Risk Level</div>
            <select
              className="dashboard-input"
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              style={{ width: "100%" }}
            >
              {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button
            className="btn btn--primary"
            onClick={fetchStrategy}
            disabled={isFetchingStrategy}
            style={{ marginTop: "16px", width: "100%" }}
          >
            {isFetchingStrategy ? "🔄 Loading..." : "🔍 Load Strategy"}
          </button>
        </div>

        {/* Active Strategy Panel */}
        <div className={`${styles.controlPanel} ${styles.offerConfigPanel}`} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h4 style={{ margin: 0 }}>Active Campaign Strategy</h4>
            {activeStrategy && (
              <span className="badge badge--cyan">{activeStrategy.customer_count} Customers Targeted</span>
            )}
          </div>

          {isFetchingStrategy ? (
            <div className="text-muted" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "20px" }}>🔄</span>
              <span style={{ marginLeft: "12px" }}>Analyzing cohort data...</span>
            </div>
          ) : activeStrategy ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(124,58,237,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  {activeStrategy.recommendation.offer_type === "Discount" ? "🏷️" :
                    activeStrategy.recommendation.offer_type === "Loyalty Points" ? "✨" :
                      activeStrategy.recommendation.offer_type === "Custom Bundle" ? "🎁" : "🚀"}
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--color-purple)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {activeStrategy.recommendation.offer_type.toLowerCase() === activeStrategy.recommendation.title.toLowerCase()
                      ? "RECOMMENDED OFFER"
                      : activeStrategy.recommendation.offer_type}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "700" }}>{activeStrategy.recommendation.title}</div>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", borderLeft: "4px solid var(--color-purple)" }}>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>{activeStrategy.recommendation.offer_summary}</p>
              </div>
            </div>
          ) : (
            <div className="text-muted" style={{ padding: "20px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
              No active strategy found for this exact cohort. Please generate and save an offer in the Offer Engine first.
            </div>
          )}
        </div>
      </div>

      <SectionTitle title="Channel Execution Plan" color="purple" />
      <div className="panel-grid panel-grid--5 mb-6">
        {channels.map((c) => {
          const isEnabled = c.key === "email" || c.key.toLowerCase() === "whatsapp";
          return (
            <div
              key={c.key}
              className={`channel-card ${c.selected ? "channel-card--selected" : ""}`}
              onClick={() => isEnabled && toggleChannel(c.key)}
              style={{
                opacity: isEnabled ? 1 : 0.6,
                cursor: isEnabled ? "pointer" : "not-allowed",
                filter: isEnabled ? "none" : "grayscale(0.8)",
                position: "relative",
                background: isEnabled ? undefined : "rgba(241, 245, 249, 0.5)",
                border: isEnabled ? undefined : "1px dashed #cbd5e1",
              }}
            >
              {!isEnabled && (
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    fontSize: "12px",
                  }}
                >
                  🔒
                </div>
              )}
              <div className="channel-card__icon">{c.icon}</div>
              <div className="channel-card__title">
                {c.title} {!isEnabled && <span style={{ fontSize: "10px", display: "block", color: "#64748b" }}>(Locked)</span>}
              </div>
              <div className="channel-card__cost">${c.cost_per_contact.toFixed(2)}/contact</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
        <button
          className="btn btn--primary"
          onClick={handleTriggerCampaign}
          disabled={!activeStrategy || isTriggering}
        >
          {isTriggering ? "🚀 Launching..." : `🚀 Execute Campaign for ${activeStrategy?.customer_count || 0} Customers`}
        </button>
      </div>

      <div className="panel-grid panel-grid--2">
        <ChartCard title="Channel Performance" icon="📊">
          <Bar data={{
            labels: data.charts.channel_performance.labels,
            datasets: [
              { 
                label: "Customer Count", 
                data: data.charts.channel_performance.counts, 
                backgroundColor: [
                  "rgba(59, 130, 246, 0.7)",  // SMS (Blue)
                  "rgba(16, 185, 129, 0.7)",  // Email (Green)
                  "rgba(245, 158, 11, 0.7)",  // Whatsapp (Orange)
                  "rgba(6, 182, 212, 0.7)",   // Live Agent (Cyan)
                  "rgba(124, 58, 237, 0.7)"   // Telegram (Purple)
                ], 
                borderColor: [
                  "#3b82f6", 
                  "#10b981", 
                  "#f59e0b", 
                  "#06b6d4", 
                  "#7c3aed"
                ], 
                borderWidth: 1, 
                borderRadius: 4 
              },
            ],
          }} options={{
            ...defaultOptions,
            plugins: {
              ...defaultOptions.plugins,
              legend: {
                display: false
              }
            },
            scales: {
              ...defaultOptions.scales,
              y: {
                ...defaultOptions.scales?.y,
                ticks: {
                  stepSize: 1,
                  callback: (value) => value
                },
                beginAtZero: true
              }
            }
          }} />
        </ChartCard>
        <ChartCard title="Daily Outreach Timeline" icon="📉">
          <Line data={{
            labels: data.charts.timeline.labels,
            datasets: [{ label: "Customers Notified", data: data.charts.timeline.messages_sent, borderColor: COLORS.purple, backgroundColor: "rgba(124,58,237,0.1)", tension: 0.3, fill: true }],
          }} options={{ 
            ...defaultOptions, 
            plugins: { ...defaultOptions.plugins, legend: { display: false } },
            scales: {
              ...defaultOptions.scales,
              y: {
                ...defaultOptions.scales?.y,
                ticks: {
                  stepSize: 1,
                  callback: (value) => value
                },
                beginAtZero: true
              }
            }
          }} />
        </ChartCard>
      </div>
    </div>
  );
}
