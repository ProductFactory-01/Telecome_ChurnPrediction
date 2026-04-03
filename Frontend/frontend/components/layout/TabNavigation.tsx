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
    <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-700/60 shadow-lg">
      <nav 
        className="flex overflow-x-auto hide-scrollbar max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8" 
        id="tab-navigation"
      >
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              className={`
                group relative min-w-max flex items-center gap-2.5 py-4 px-4 text-[13px] font-semibold tracking-wider transition-all duration-300
                ${isActive 
                  ? "text-white border-b-3 border-white/90 bg-white/5" 
                  : "text-slate-400 hover:text-slate-50 hover:bg-white/5 border-b-3 border-transparent"}
              `}
              onClick={() => onTabChange(t.key)}
            >
              {t.label}
              
              {t.badge && (
                <span className={`
                  flex items-center justify-center w-6 h-6 text-[10px] font-bold rounded-full ring-1 transition-all duration-300
                  ${isActive 
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-amber-400/50 shadow-lg shadow-amber-500/20" 
                    : "bg-slate-700/60 text-slate-300 ring-slate-600/50 group-hover:bg-slate-600/60 group-hover:text-slate-100"}
                `}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export { TABS };
