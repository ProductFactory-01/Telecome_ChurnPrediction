"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import SectionTitle from "../shared/SectionTitle";
import KpiCard from "../shared/KpiCard";
import ChartCard from "../shared/ChartCard";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import "../../lib/chartSetup";
import { COLORS, defaultOptions } from "../../lib/chartSetup";

const SUB_TABS = [
  { key: "crm_billing", label: "CRM & Billing" },
  { key: "complaints", label: "Complaints" },
  { key: "subscriber_intel", label: "Subscriber Intel" },
  { key: "usage_services", label: "Usage & Services" },
];

export default function DataExplorerTab() {
  const [data, setData] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState("crm_billing");

  useEffect(() => {
    api.get("/eda").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <div className="dashboard-content text-muted">Loading…</div>;

  const renderCrmBilling = () => {
    const d = data.crm_billing;
    return (
      <>
        <div className="panel-grid panel-grid--4 mb-6">
          <KpiCard label="Total Subscribers" value={d.kpis.subscribers.toLocaleString()} color="blue" />
          <KpiCard label="Churn Rate" value={`${d.kpis.churn_rate}%`} color="red" />
          <KpiCard label="Avg Monthly Charges" value={`$${d.kpis.avg_monthly_charges}`} color="amber" />
          <KpiCard label="Avg CLTV" value={`$${d.kpis.avg_cltv.toLocaleString()}`} color="green" />
        </div>
        
        <div className="panel-grid panel-grid--2 mb-6">
          <ChartCard title="Churn Distribution" icon="📊" height={260}>
            <Doughnut data={{
              labels: d.churn_distribution.labels,
              datasets: [{ 
                data: d.churn_distribution.values, 
                backgroundColor: [COLORS.greenAlpha, COLORS.redAlpha], 
                borderColor: [COLORS.green, COLORS.red], 
                borderWidth: 2 
              }],
            }} options={{ ...defaultOptions, scales: undefined }} />
          </ChartCard>

          <ChartCard title="Churn by Contract Type" icon="📋">
            <Bar data={{
              labels: d.churn_by_contract.labels,
              datasets: [
                { 
                  label: "Stayed", 
                  data: d.churn_by_contract.stayed, 
                  backgroundColor: COLORS.greenAlpha, 
                  borderColor: COLORS.green, 
                  borderWidth: 1, 
                  borderRadius: 6 
                },
                { 
                  label: "Churned", 
                  data: d.churn_by_contract.churned, 
                  backgroundColor: COLORS.redAlpha, 
                  borderColor: COLORS.red, 
                  borderWidth: 1, 
                  borderRadius: 6 
                }
              ],
            }} options={defaultOptions} />
          </ChartCard>
        </div>

        <div className="panel-grid panel-grid--2 mb-6">
          <ChartCard title="Monthly Charges by Churn" icon="💰">
            <Bar data={{
              labels: d.monthly_charges_by_churn.labels,
              datasets: [{ 
                label: "Avg Monthly Charge", 
                data: d.monthly_charges_by_churn.values, 
                backgroundColor: [COLORS.greenAlpha, COLORS.redAlpha], 
                borderColor: [COLORS.green, COLORS.red], 
                borderWidth: 1, 
                borderRadius: 8 
              }],
            }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
          </ChartCard>

          <ChartCard title="Churn Category Breakdown" icon="📂" height={260}>
            <Doughnut data={{
              labels: d.churn_categories.labels,
              datasets: [{ 
                data: d.churn_categories.values, 
                backgroundColor: [COLORS.redAlpha, COLORS.amberAlpha, COLORS.blueAlpha, COLORS.purpleAlpha, COLORS.cyanAlpha], 
                borderWidth: 1 
              }],
            }} options={{ ...defaultOptions, scales: undefined }} />
          </ChartCard>
        </div>

        <ChartCard title="Top Churn Reasons (Details)" icon="💡" height={300}>
          <Bar data={{
            labels: d.top_churn_reasons.labels,
            datasets: [{ label: "Count", data: d.top_churn_reasons.values, backgroundColor: COLORS.blueAlpha, borderColor: COLORS.blue, borderWidth: 1, borderRadius: 4 }],
          }} options={{ ...defaultOptions, indexAxis: "y" as const, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
      </>
    );
  };

  const renderComplaints = () => {
    const d = data.complaints;
    return (
      <>
        <div className="panel-grid panel-grid--2 mb-6">
          <KpiCard label="Total Tickets" value={d.kpis.total_tickets.toLocaleString()} color="red" />
          <KpiCard label="Source" value={d.kpis.source} color="blue" />
        </div>
        <div className="panel-grid panel-grid--2 mb-6">
          <ChartCard title="Status Breakdown" icon="📊" height={240}>
            <Doughnut data={{
              labels: d.status_breakdown.labels,
              datasets: [{ data: d.status_breakdown.values, backgroundColor: [COLORS.greenAlpha, COLORS.redAlpha, COLORS.amberAlpha, COLORS.blueAlpha, COLORS.purpleAlpha], borderWidth: 1 }],
            }} options={{ ...defaultOptions, scales: undefined }} />
          </ChartCard>
          <ChartCard title="Volume Over Time" icon="📈">
            <Line data={{
              labels: d.volume_over_time.labels,
              datasets: [{ label: "Tickets", data: d.volume_over_time.values, borderColor: COLORS.red, backgroundColor: "rgba(239,68,68,0.1)", tension: 0.3, fill: true }],
            }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
          </ChartCard>
        </div>
        <ChartCard title="Top Complaint Keywords" icon="🔤" height={260}>
          <Bar data={{
            labels: d.complaint_keywords.labels,
            datasets: [{ label: "Mentions", data: d.complaint_keywords.values, backgroundColor: COLORS.amberAlpha, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 4 }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
      </>
    );
  };

  const renderSubscriber = () => {
    const d = data.subscriber_intel;
    return (
      <div className="panel-grid panel-grid--2">
        <ChartCard title="Age Distribution by Churn" icon="👤">
          <Bar data={{
            labels: d.age_distribution.bin_labels,
            datasets: [
              { label: "Stayed", data: d.age_distribution.stayed, backgroundColor: COLORS.greenAlpha, borderColor: COLORS.green, borderWidth: 1, borderRadius: 4 },
              { label: "Churned", data: d.age_distribution.churned, backgroundColor: COLORS.redAlpha, borderColor: COLORS.red, borderWidth: 1, borderRadius: 4 },
            ],
          }} options={defaultOptions} />
        </ChartCard>
        <ChartCard title="Satisfaction Distribution" icon="⭐">
          <Bar data={{
            labels: d.satisfaction_distribution.scores.map((s: number) => `Score ${s}`),
            datasets: [
              { label: "Stayed", data: d.satisfaction_distribution.stayed, backgroundColor: COLORS.greenAlpha, borderColor: COLORS.green, borderWidth: 1, borderRadius: 4 },
              { label: "Churned", data: d.satisfaction_distribution.churned, backgroundColor: COLORS.redAlpha, borderColor: COLORS.red, borderWidth: 1, borderRadius: 4 },
            ],
          }} options={defaultOptions} />
        </ChartCard>
        <ChartCard title="Churn Categories" icon="📂" height={240}>
          <Doughnut data={{
            labels: d.churn_categories.labels,
            datasets: [{ data: d.churn_categories.values, backgroundColor: [COLORS.redAlpha, COLORS.amberAlpha, COLORS.blueAlpha, COLORS.purpleAlpha, COLORS.cyanAlpha], borderWidth: 1 }],
          }} options={{ ...defaultOptions, scales: undefined }} />
        </ChartCard>
        <ChartCard title="Referral vs Churn" icon="🔗">
          <Bar data={{
            labels: d.referral_churn.labels,
            datasets: [{ label: "Churn %", data: d.referral_churn.values, backgroundColor: [COLORS.greenAlpha, COLORS.redAlpha], borderColor: [COLORS.green, COLORS.red], borderWidth: 1, borderRadius: 6 }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
      </div>
    );
  };

  const renderUsage = () => {
    const d = data.usage_services;
    return (
      <div className="panel-grid panel-grid--2">
        <ChartCard title="Service-Level Churn Rates" icon="⚙️">
          <Bar data={{
            labels: d.service_churn_rates.labels,
            datasets: [{ label: "Churn %", data: d.service_churn_rates.values, backgroundColor: COLORS.purpleAlpha, borderColor: COLORS.purple, borderWidth: 1, borderRadius: 4 }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
        <ChartCard title="Churn by Payment Method" icon="💳">
          <Bar data={{
            labels: d.churn_by_payment.labels,
            datasets: [{ label: "Churn %", data: d.churn_by_payment.values, backgroundColor: [COLORS.redAlpha, COLORS.amberAlpha, COLORS.blueAlpha, COLORS.greenAlpha], borderColor: [COLORS.red, COLORS.amber, COLORS.blue, COLORS.green], borderWidth: 1, borderRadius: 6 }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
        <ChartCard title="Churn by Internet Type" icon="🌐">
          <Bar data={{
            labels: d.churn_by_internet.labels,
            datasets: [{ label: "Churn %", data: d.churn_by_internet.values, backgroundColor: [COLORS.blueAlpha, COLORS.redAlpha, COLORS.greenAlpha], borderColor: [COLORS.blue, COLORS.red, COLORS.green], borderWidth: 1, borderRadius: 6 }],
          }} options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }} />
        </ChartCard>
      </div>
    );
  };

  return (
    <div className="dashboard-content">
      <SectionTitle title="Data Explorer (EDA)" description="Interactive data analysis across all data dimensions" color="cyan" />

      <div className="sub-tabs mb-6">
        {SUB_TABS.map((t) => (
          <button key={t.key} className={`sub-tabs__btn ${activeSubTab === t.key ? "sub-tabs__btn--active" : ""}`} onClick={() => setActiveSubTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === "crm_billing" && renderCrmBilling()}
      {activeSubTab === "complaints" && renderComplaints()}
      {activeSubTab === "subscriber_intel" && renderSubscriber()}
      {activeSubTab === "usage_services" && renderUsage()}
    </div>
  );
}
