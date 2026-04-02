"use client";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "amber" | "red" | "purple" | "cyan";
}

export default function KpiCard({ label, value, sub, color = "blue" }: Props) {
  return (
    <div className={`kpi-card kpi-card--${color}`} id={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__value">{value}</div>
      {sub && <div className="kpi-card__sub">{sub}</div>}
    </div>
  );
}
