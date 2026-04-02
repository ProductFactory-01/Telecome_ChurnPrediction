"use client";

interface Props {
  number: string;
  title: string;
  subtitle: string;
  color?: "blue" | "amber" | "green" | "purple";
  statusLabel?: string;
  statusType?: "active" | "scoring" | "generating";
}

export default function AgentHeader({ number, title, subtitle, color = "blue", statusLabel, statusType = "active" }: Props) {
  return (
    <div className="agent-header">
      <div className={`agent-header__icon agent-header__icon--${color}`}>{number}</div>
      <div className="agent-header__info">
        <div className="agent-header__title">{title}</div>
        <div className="agent-header__detail">{subtitle}</div>
      </div>
      {statusLabel && (
        <div className={`agent-header__status agent-header__status--${statusType}`}>
          <span style={{ fontSize: 8 }}>●</span> {statusLabel}
        </div>
      )}
    </div>
  );
}
