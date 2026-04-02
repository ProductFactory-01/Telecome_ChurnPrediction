"use client";

const TABS = [
  { key: "overview",       label: "Overview",       badge: null },
  { key: "data-agent",     label: "Data Agent",     badge: "1" },
  { key: "churn-scoring",  label: "Churn Scoring",  badge: "2" },
  { key: "offer-engine",   label: "Offer Engine",   badge: "3" },
  { key: "outreach",       label: "Outreach",       badge: "4" },
  { key: "live-impact",    label: "Live Impact",    badge: null },
  { key: "data-explorer",  label: "Data Explorer",  badge: null },
  { key: "ml-models",      label: "ML Models",      badge: null },
  { key: "role-views",     label: "Role Views",     badge: null },
  { key: "milestones",     label: "Milestones",     badge: null },
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
          {t.badge && (
            <span className={`tab-nav__badge tab-nav__badge--${t.badge}`}>{t.badge}</span>
          )}
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export { TABS };
