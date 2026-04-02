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

export default function OutreachTab() {
  const [data, setData] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [msgTemplate, setMsgTemplate] = useState(
    "Hi {{name}}, we noticed you've been with us for {{tenure}} months! As a valued customer, we'd like to offer you {{offer}}. Reply YES to accept."
  );

  useEffect(() => {
    api.get("/outreach").then((r) => {
      setData(r.data);
      setChannels(r.data.channels);
    }).catch(console.error);
  }, []);

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

      <div className="panel-grid panel-grid--4 mb-6">
        <KpiCard label="Campaigns Triggered" value={k.campaigns_triggered} color="purple" />
        <KpiCard label="Messages Sent" value={k.messages_sent} color="blue" />
        <KpiCard label="Avg Response Time" value={k.avg_response_time} color="amber" />
        <KpiCard label="Total Contact Cost" value={`$${k.total_contact_cost}`} color="cyan" />
      </div>

      <SectionTitle title="Channel Selection" color="purple" />
      <div className="panel-grid panel-grid--5 mb-6">
        {channels.map((c) => (
          <div key={c.key} className={`channel-card ${c.selected ? "channel-card--selected" : ""}`} onClick={() => toggleChannel(c.key)}>
            <div className="channel-card__icon">{c.icon}</div>
            <div className="channel-card__title">{c.title}</div>
            <div className="channel-card__rate">{c.accept_rate}%</div>
            <div className="channel-card__cost">${c.cost_per_contact}/contact</div>
          </div>
        ))}
      </div>

      <SectionTitle title="Message Template" color="cyan" />
      <div className="msg-template mb-6">
        <textarea className="msg-template__textarea" value={msgTemplate} onChange={(e) => setMsgTemplate(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button className="btn btn--primary">🚀 Trigger Campaign</button>
        <button className="btn btn--outline">👁️ Preview</button>
      </div>

      <div className="panel-grid panel-grid--2">
        <ChartCard title="Channel Performance" icon="📊">
          <Bar data={{
            labels: data.charts.channel_performance.labels,
            datasets: [
              { label: "Accept Rate %", data: data.charts.channel_performance.accept_rate, backgroundColor: COLORS.greenAlpha, borderColor: COLORS.green, borderWidth: 1, borderRadius: 4 },
              { label: "Cost Efficiency", data: data.charts.channel_performance.cost_efficiency, backgroundColor: COLORS.blueAlpha, borderColor: COLORS.blue, borderWidth: 1, borderRadius: 4 },
            ],
          }} options={defaultOptions} />
        </ChartCard>
        <ChartCard title="Message Timeline" icon="📈">
          <Line data={{
            labels: data.charts.timeline.labels,
            datasets: [{ label: "Messages Sent", data: data.charts.timeline.messages_sent, borderColor: COLORS.purple, backgroundColor: "rgba(124,58,237,0.1)", tension: 0.3, fill: true }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
      </div>
    </div>
  );
}
