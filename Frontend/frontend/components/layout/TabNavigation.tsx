"use client";

const TABS = [
  { key: "overview",       icon: "📊", label: "Overview" },
  { key: "data-agent",     icon: "🗄️", label: "Data Agent" },
  { key: "churn-scoring",  icon: "🎯", label: "Churn Scoring" },
  { key: "offer-engine",   icon: "🎁", label: "Offer Engine" },
  { key: "outreach",       icon: "📡", label: "Outreach" },
  { key: "live-impact",    icon: "📈", label: "Live Impact" },
  { key: "data-explorer",  icon: "🔍", label: "Data Explorer" },
  { key: "ml-models",      icon: "🤖", label: "ML Models" },
  { key: "role-views",     icon: "👥", label: "Role Views" },
  { key: "milestones",     icon: "🏁", label: "Milestones" },
];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav className="tab-nav" id="tab-navigation">
      {TABS.map((t) => (
        <button
          key={t.key}
          id={`tab-${t.key}`}
          className={`tab-nav__btn ${activeTab === t.key ? "tab-nav__btn--active" : ""}`}
          onClick={() => onTabChange(t.key)}
        >
          <span>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export { TABS };
