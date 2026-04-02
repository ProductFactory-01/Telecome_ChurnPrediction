"use client";

interface Props {
  icon: string;
  title: string;
  subtitle: string;
  color?: "blue" | "amber" | "green" | "purple";
}

export default function AgentHeader({ icon, title, subtitle, color = "blue" }: Props) {
  return (
    <div className="agent-header">
      <div className={`agent-header__icon agent-header__icon--${color}`}>{icon}</div>
      <div className="agent-header__info">
        <div className="agent-header__title">{title}</div>
        <div className="agent-header__detail">{subtitle}</div>
      </div>
    </div>
  );
}
