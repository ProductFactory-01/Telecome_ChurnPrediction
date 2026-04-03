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
    <div className="agent-header hover:shadow-md transition-all duration-300">
      <div className={`agent-header__icon agent-header__icon--${color} ring-2 ring-white/10`}>{number}</div>
      <div className="agent-header__info">
        <div className="agent-header__title text-base">{title}</div>
        <div className="agent-header__detail text-xs">{subtitle}</div>
      </div>
      {statusLabel && (
        <div className={`agent-header__status agent-header__status--${statusType}`}>
          <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"></span> {statusLabel}
        </div>
      )}
    </div>
  );
}
