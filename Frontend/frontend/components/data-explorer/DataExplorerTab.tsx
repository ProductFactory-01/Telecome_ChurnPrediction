"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import Loading from "../shared/Loading";
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

type LabeledSeries = {
  labels: string[];
  values: number[];
};

type SplitSeries = {
  labels: string[];
  stayed: number[];
  churned: number[];
};

type CrmBillingData = {
  kpis: {
    subscribers: number;
    churn_rate: number;
    avg_monthly_charges: number;
    avg_cltv: number;
  };
  churn_distribution: LabeledSeries;
  monthly_charges_hist: SplitSeries;
  churn_by_contract: SplitSeries;
  churn_by_payment: SplitSeries;
  top_churn_reasons: LabeledSeries;
};

type ComplaintsData = {
  kpis: {
    dissatisfied_customers: number;
    avg_satisfaction: number | string;
    dissat_rate: number;
  };
  source_breakdown?: LabeledSeries;
  category_breakdown?: LabeledSeries;
  regional_dissat?: LabeledSeries;
  tech_dissat?: LabeledSeries;
};

type SubscriberIntelData = {
  kpis: {
    senior_citizens: number;
    high_cltv_ratio: number;
    avg_tenure: number;
  };
  age_distribution?: {
    bin_labels: string[];
    stayed: number[];
    churned: number[];
  };
  satisfaction_distribution?: {
    scores: number[];
    stayed: number[];
    churned: number[];
  };
  senior_impact?: LabeledSeries;
  gender_senior_impact?: {
    labels: string[];
    non_senior: number[];
    senior: number[];
  };
  internet_type_dist?: LabeledSeries;
};

type UsageServicesData = {
  kpis: {
    avg_gb_monthly: number;
    unlimited_data_adoption: number;
  };
  tenure_vs_charges?: {
    stayed?: { x: number[]; y: number[] };
    churned?: { x: number[]; y: number[] };
  };
  service_adoption?: LabeledSeries;
  gb_usage_by_type?: LabeledSeries;
  churn_by_internet?: LabeledSeries;
};

type EdaResponse = {
  crm_billing: CrmBillingData;
  complaints: ComplaintsData;
  subscriber_intel: SubscriberIntelData;
  usage_services: UsageServicesData;
};

const SERIES_COLORS = [COLORS.blue, COLORS.cyan, COLORS.green, COLORS.amber, COLORS.purple, COLORS.red];
const SERIES_COLORS_ALPHA = [COLORS.blueAlpha, COLORS.cyanAlpha, COLORS.greenAlpha, COLORS.amberAlpha, COLORS.purpleAlpha, COLORS.redAlpha];

function chartColors(size: number) {
  return Array.from({ length: size }, (_, index) => SERIES_COLORS[index % SERIES_COLORS.length]);
}

function chartColorsAlpha(size: number) {
  return Array.from({ length: size }, (_, index) => SERIES_COLORS_ALPHA[index % SERIES_COLORS_ALPHA.length]);
}

export default function DataExplorerTab() {
  const [data, setData] = useState<EdaResponse | null>(null);
  const [activeSubTab, setActiveSubTab] = useState("crm_billing");

  useEffect(() => {
    api.get("/eda").then((r) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <Loading message="Creating Dashboards..." />;

  const renderCrmBilling = () => {
    const d = data.crm_billing;
    return (
      <>
        <div className="panel-grid panel-grid--3 mb-6">
          <KpiCard label="Total Subscribers" value={d.kpis.subscribers.toLocaleString()} color="blue" />
          <KpiCard label="Churn Rate" value={`${d.kpis.churn_rate}%`} color="red" />
          <KpiCard label="Avg Monthly Charges" value={`$${d.kpis.avg_monthly_charges}`} color="amber" />
          {/* <KpiCard label="Avg CLTV" value={`$${d.kpis.avg_cltv.toLocaleString()}`} color="green" /> */}
        </div>

        <div className="panel-grid panel-grid--2 mb-6">
          <ChartCard title="Churn Distribution" height={260}>
            <Doughnut
              data={{
                labels: d.churn_distribution.labels,
                datasets: [
                  {
                    data: d.churn_distribution.values,
                    backgroundColor: [COLORS.greenAlpha, COLORS.redAlpha],
                    borderColor: [COLORS.green, COLORS.red],
                    borderWidth: 2,
                  },
                ],
              }}
              options={{ ...defaultOptions, scales: undefined }}
            />
          </ChartCard>

          <ChartCard title="Churn by Contract Type">
            <Bar
              data={{
                labels: d.churn_by_contract.labels,
                datasets: [
                  { label: "Stayed", data: d.churn_by_contract.stayed, backgroundColor: COLORS.greenAlpha, borderColor: COLORS.green, borderWidth: 1, borderRadius: 6 },
                  { label: "Churned", data: d.churn_by_contract.churned, backgroundColor: COLORS.redAlpha, borderColor: COLORS.red, borderWidth: 1, borderRadius: 6 },
                ],
              }}
              options={{
                ...defaultOptions,
                scales: {
                  x: { ...defaultOptions.scales.x, stacked: true },
                  y: { ...defaultOptions.scales.y, stacked: true },
                },
              }}
            />
          </ChartCard>
        </div>

        <div className="panel-grid panel-grid--2 mb-6">
          <ChartCard title="Monthly Charge Distribution">
            <Line
              data={{
                labels: d.monthly_charges_hist.labels,
                datasets: [
                  {
                    label: "Stayed",
                    data: d.monthly_charges_hist.stayed,
                    borderColor: COLORS.green,
                    backgroundColor: COLORS.greenAlpha,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 4,
                    order: 2,
                  },
                  {
                    label: "Churned",
                    data: d.monthly_charges_hist.churned,
                    borderColor: COLORS.red,
                    backgroundColor: COLORS.redAlpha,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 3,
                    order: 1,
                  },
                ],
              }}
              options={defaultOptions}
            />
          </ChartCard>

          <ChartCard title="Churn by Payment Method">
            <Bar
              data={{
                labels: d.churn_by_payment.labels,
                datasets: [
                  { label: "Stayed", data: d.churn_by_payment.stayed, backgroundColor: COLORS.blueAlpha, borderColor: COLORS.blue, borderWidth: 1, borderRadius: 6 },
                  { label: "Churned", data: d.churn_by_payment.churned, backgroundColor: COLORS.amberAlpha, borderColor: COLORS.amber, borderWidth: 1, borderRadius: 6 },
                ],
              }}
              options={{ ...defaultOptions, indexAxis: "y" as const }}
            />
          </ChartCard>
        </div>

        <ChartCard title="Top Churn Reasons (Billing Impact)" height={300}>
          <Bar
            data={{
              labels: d.top_churn_reasons.labels,
              datasets: [
                {
                  label: "Count",
                  data: d.top_churn_reasons.values,
                  backgroundColor: chartColorsAlpha(d.top_churn_reasons.values.length),
                  borderColor: chartColors(d.top_churn_reasons.values.length),
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ],
            }}
            options={{ ...defaultOptions, indexAxis: "y" as const, plugins: { ...defaultOptions.plugins, legend: { display: false } } }}
          />
        </ChartCard>
      </>
    );
  };

  const renderComplaints = () => {
    const d = data.complaints;
    if (!d || !d.kpis) return null;

    return (
      <>
        <div className="panel-grid panel-grid--3 mb-6">
          <KpiCard label="Dissatisfied Customers" value={(d.kpis.dissatisfied_customers ?? 0).toLocaleString()} color="red" />
          <KpiCard label="Avg Satisfaction" value={d.kpis.avg_satisfaction ?? "N/A"} color="blue" />
          <KpiCard label="Dissatisfaction Rate" value={`${d.kpis.dissat_rate ?? 0}%`} color="amber" />
        </div>

        <div className="panel-grid panel-grid--2 mb-6">
          <ChartCard title="Dissatisfaction Source Mix (Estimated)" height={260}>
            <Pie
              data={{
                labels: d.source_breakdown?.labels ?? [],
                datasets: [
                  {
                    data: d.source_breakdown?.values ?? [],
                    backgroundColor: chartColorsAlpha(d.source_breakdown?.values?.length ?? 0),
                    borderColor: chartColors(d.source_breakdown?.values?.length ?? 0),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{ ...defaultOptions, scales: undefined }}
            />
          </ChartCard>

          <ChartCard title="Top Complaint Categories">
            <Bar
              data={{
                labels: d.category_breakdown?.labels ?? [],
                datasets: [
                  {
                    label: "Complaints",
                    data: d.category_breakdown?.values ?? [],
                    backgroundColor: chartColorsAlpha(d.category_breakdown?.values?.length ?? 0),
                    borderColor: chartColors(d.category_breakdown?.values?.length ?? 0),
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{ ...defaultOptions, indexAxis: "y" as const, plugins: { ...defaultOptions.plugins, legend: { display: false } } }}
            />
          </ChartCard>
        </div>

        <div className="panel-grid panel-grid--2">
          <ChartCard title="Top Cities by Dissatisfaction"  height={260}>
            <Bar
              data={{
                labels: d.regional_dissat?.labels ?? [],
                datasets: [
                  {
                    label: "Dissatisfied Count",
                    data: d.regional_dissat?.values ?? [],
                    backgroundColor: chartColorsAlpha(d.regional_dissat?.values?.length ?? 0),
                    borderColor: chartColors(d.regional_dissat?.values?.length ?? 0),
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={defaultOptions}
            />
          </ChartCard>

          <ChartCard title="Dissatisfaction by Internet Service" height={260}>
            <Doughnut
              data={{
                labels: d.tech_dissat?.labels ?? [],
                datasets: [
                  {
                    data: d.tech_dissat?.values ?? [],
                    backgroundColor: chartColorsAlpha(d.tech_dissat?.values?.length ?? 0),
                    borderColor: chartColors(d.tech_dissat?.values?.length ?? 0),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{ ...defaultOptions, scales: undefined }}
            />
          </ChartCard>
        </div>
      </>
    );
  };

  const renderSubscriber = () => {
    const d = data.subscriber_intel;
    if (!d || !d.kpis) return null;

    return (
      <div className="panel-grid--1">
        <div className="panel-grid panel-grid--3 mb-6">
          <KpiCard label="Senior Citizens" value={d.kpis.senior_citizens?.toLocaleString() ?? "0"} color="purple" />
          <KpiCard label="High-Value Segment" value={`${d.kpis.high_cltv_ratio ?? 0}%`} color="cyan" />
          <KpiCard label="Avg Tenure (Months)" value={d.kpis.avg_tenure ?? "0"} color="green" />
        </div>

        <div className="panel-grid panel-grid--2">
          <ChartCard title="Age Distribution by Churn">
            <Line
              data={{
                labels: d.age_distribution?.bin_labels ?? [],
                datasets: [
                  { label: "Stayed", data: d.age_distribution?.stayed ?? [], borderColor: COLORS.green, backgroundColor: COLORS.greenAlpha, fill: true, tension: 0.25, pointRadius: 3 },
                  { label: "Churned", data: d.age_distribution?.churned ?? [], borderColor: COLORS.red, backgroundColor: COLORS.redAlpha, fill: true, tension: 0.25, pointRadius: 3 },
                ],
              }}
              options={defaultOptions}
            />
          </ChartCard>

          <ChartCard title="Satisfaction Score by Churn">
            <Bar
              data={{
                labels: d.satisfaction_distribution?.scores?.map((s: number) => `Score ${s}`) ?? [],
                datasets: [
                  { label: "Stayed", data: d.satisfaction_distribution?.stayed ?? [], backgroundColor: COLORS.blueAlpha, borderColor: COLORS.blue, borderWidth: 1, borderRadius: 4 },
                  { label: "Churned", data: d.satisfaction_distribution?.churned ?? [], backgroundColor: COLORS.redAlpha, borderColor: COLORS.red, borderWidth: 1, borderRadius: 4 },
                ],
              }}
              options={{
                ...defaultOptions,
                scales: {
                  x: { ...defaultOptions.scales.x, stacked: true },
                  y: { ...defaultOptions.scales.y, stacked: true },
                },
              }}
            />
          </ChartCard>
{/* 
          <ChartCard title="Senior Citizen Churn Rate" icon="senior" height={240}>
            <Bar
              data={{
                labels: d.senior_impact?.labels ?? [],
                datasets: [
                  {
                    label: "Churn Rate %",
                    data: d.senior_impact?.values ?? [],
                    backgroundColor: [COLORS.cyanAlpha, COLORS.redAlpha],
                    borderColor: [COLORS.cyan, COLORS.red],
                    borderWidth: 1,
                    borderRadius: 6,
                  },
                ],
              }}
              options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }}
            />
          </ChartCard> */}

          <ChartCard title="Gender and Senior Churn Rate"  height={240}>
            <Bar
              data={{
                labels: d.gender_senior_impact?.labels ?? [],
                datasets: [
                  {
                    label: "Non-Senior",
                    data: d.gender_senior_impact?.non_senior ?? [],
                    backgroundColor: COLORS.cyanAlpha,
                    borderColor: COLORS.cyan,
                    borderWidth: 1,
                    borderRadius: 6,
                  },
                  {
                    label: "Senior Citizen",
                    data: d.gender_senior_impact?.senior ?? [],
                    backgroundColor: COLORS.redAlpha,
                    borderColor: COLORS.red,
                    borderWidth: 1,
                    borderRadius: 6,
                  },
                ],
              }}
              options={defaultOptions}
            />
          </ChartCard>

          <ChartCard title="Internet Type Distribution">
            <Pie
              data={{
                labels: d.internet_type_dist?.labels ?? [],
                datasets: [
                  {
                    data: d.internet_type_dist?.values ?? [],
                    backgroundColor: chartColorsAlpha(d.internet_type_dist?.values?.length ?? 0),
                    borderColor: chartColors(d.internet_type_dist?.values?.length ?? 0),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{ ...defaultOptions, scales: undefined }}
            />
          </ChartCard>
        </div>
      </div>
    );
  };

  const renderUsage = () => {
    const d = data.usage_services;
    if (!d || !d.kpis) return null;

    return (
      <div className="panel-grid--1">
        <div className="panel-grid panel-grid--2 mb-6">
          <KpiCard label="Avg GB Download / Mo" value={d.kpis.avg_gb_monthly ?? "0"} color="blue" />
          <KpiCard label="Unlimited Data Adoption" value={`${d.kpis.unlimited_data_adoption ?? 0}%`} color="cyan" />
        </div>

        <div className="panel-grid panel-grid--2">
          <ChartCard title="Tenure vs Monthly Charges">
            <Line
              data={{
                labels: d.tenure_vs_charges?.stayed?.x ?? [],
                datasets: [
                  { label: "Stayed ($)", data: d.tenure_vs_charges?.stayed?.y ?? [], borderColor: COLORS.green, backgroundColor: COLORS.greenAlpha, tension: 0.4, pointRadius: 3, fill: true },
                  { label: "Churned ($)", data: d.tenure_vs_charges?.churned?.y ?? [], borderColor: COLORS.red, backgroundColor: COLORS.redAlpha, tension: 0.4, pointRadius: 3, fill: true },
                ],
              }}
              options={defaultOptions}
            />
          </ChartCard>
          <ChartCard title="Value-Added Service Adoption">
            <Bar
              data={{
                labels: d.service_adoption?.labels ?? [],
                datasets: [
                  {
                    label: "Adoption %",
                    data: d.service_adoption?.values ?? [],
                    backgroundColor: chartColorsAlpha(d.service_adoption?.values?.length ?? 0),
                    borderColor: chartColors(d.service_adoption?.values?.length ?? 0),
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{ ...defaultOptions, indexAxis: "y" as const, plugins: { ...defaultOptions.plugins, legend: { display: false } } }}
            />
          </ChartCard>
          <ChartCard title="Average Data Usage by Internet Type">
            <Bar
              data={{
                labels: d.gb_usage_by_type?.labels ?? [],
                datasets: [
                  {
                    label: "Avg GB",
                    data: d.gb_usage_by_type?.values ?? [],
                    backgroundColor: chartColorsAlpha(d.gb_usage_by_type?.values?.length ?? 0),
                    borderColor: chartColors(d.gb_usage_by_type?.values?.length ?? 0),
                    borderWidth: 1,
                    borderRadius: 6,
                  },
                ],
              }}
              options={defaultOptions}
            />
          </ChartCard>
          <ChartCard title="Churn Rate by Internet Service">
            <Line
              data={{
                labels: d.churn_by_internet?.labels ?? [],
                datasets: [
                  {
                    label: "Churn %",
                    data: d.churn_by_internet?.values ?? [],
                    borderColor: COLORS.red,
                    backgroundColor: COLORS.redAlpha,
                    fill: true,
                    tension: 0.25,
                    pointBackgroundColor: chartColors(d.churn_by_internet?.values?.length ?? 0),
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    pointRadius: 5,
                  },
                ],
              }}
              options={{ ...defaultOptions, plugins: { ...defaultOptions.plugins, legend: { display: false } } }}
            />
          </ChartCard>
        </div>
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
