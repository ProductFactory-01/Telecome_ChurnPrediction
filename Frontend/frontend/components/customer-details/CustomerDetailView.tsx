"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";

interface Props {
  customerId: string;
  onClose: () => void;
}

export default function CustomerDetailView({ customerId, onClose }: Props) {
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    api.get(`/customers/${customerId}`).then((r) => setDetail(r.data)).catch(console.error);
  }, [customerId]);

  if (!detail) {
    return (
      <div className="detail-overlay" onClick={onClose}>
        <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "👤 Profile",
      fields: [
        { label: "Customer ID", value: detail["Customer ID"] },
        { label: "Name", value: detail["Name"] },
        { label: "Gender", value: detail["Gender"] },
        { label: "Age", value: detail["Age"] },
        { label: "Senior Citizen", value: detail["Senior Citizen"] },
        { label: "Married", value: detail["Married"] },
        { label: "Dependents", value: detail["Dependents"] },
      ],
    },
    {
      title: "💳 Billing & Contract",
      fields: [
        { label: "Contract", value: detail["Contract"] },
        { label: "Payment Method", value: detail["Payment Method"] },
        { label: "Monthly Charge", value: `$${detail["Monthly Charge"]}` },
        { label: "Total Charges", value: `$${detail["Total Charges"]}` },
        { label: "Total Revenue", value: `$${detail["Total Revenue"]}` },
        { label: "Paperless Billing", value: detail["Paperless Billing"] },
      ],
    },
    {
      title: "📡 Services",
      fields: [
        { label: "Phone Service", value: detail["Phone Service"] },
        { label: "Internet Service", value: detail["Internet Service"] },
        { label: "Internet Type", value: detail["Internet Type"] },
        { label: "Online Security", value: detail["Online Security"] },
        { label: "Online Backup", value: detail["Online Backup"] },
        { label: "Tech Support", value: detail["Premium Tech Support"] },
        { label: "Streaming TV", value: detail["Streaming TV"] },
        { label: "Streaming Movies", value: detail["Streaming Movies"] },
      ],
    },
    {
      title: "📍 Location",
      fields: [
        { label: "City", value: detail["City"] },
        { label: "State", value: detail["State"] },
        { label: "Country", value: detail["Country"] },
        { label: "Zip Code", value: detail["Zip Code"] },
      ],
    },
    {
      title: "🎯 Churn Intelligence",
      fields: [
        { label: "Churn Label", value: detail["Churn Label"] },
        { label: "Churn Score", value: detail["Churn Score"] },
        { label: "CLTV", value: `$${detail["CLTV"]}` },
        { label: "Churn Category", value: detail["Churn Category"] },
        { label: "Churn Reason", value: detail["Churn Reason"] },
        { label: "Satisfaction Score", value: detail["Satisfaction Score"] },
      ],
    },
    {
      title: "📞 Contact",
      fields: [
        { label: "Email", value: detail["email"] },
        { label: "Mobile", value: detail["mobile_number"] },
      ],
    },
  ];

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <button className="detail-panel__close" onClick={onClose}>✕</button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            {detail["Name"] || detail["Customer ID"]}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Customer 360° View</div>
        </div>

        {sections.map((section, i) => (
          <div key={i} className="detail-section">
            <div className="detail-section__title">{section.title}</div>
            <div className="detail-grid">
              {section.fields
                .filter((f) => f.value !== undefined && f.value !== null)
                .map((f, j) => (
                  <div key={j} className="detail-field">
                    <div className="detail-field__label">{f.label}</div>
                    <div className="detail-field__value">{String(f.value)}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
