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
    <div className="w-full px-6 lg:px-10 pt-8 pb-2 flex justify-center">
      <div className="max-w-[1440px] w-full flex justify-center">
        <nav 
          className="inline-flex items-center p-1.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-700/60 shadow-lg rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] overflow-x-auto hide-scrollbar ring-1 ring-white/10" 
          id="tab-navigation"
        >
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                onClick={() => onTabChange(t.key)}
                className={`
                  group relative flex items-center gap-2.5 px-6 py-2.5 rounded-[20px] text-[13px] font-bold tracking-tight transition-all duration-300 whitespace-nowrap
                  ${isActive 
                    ? "bg-white text-indigo-950 shadow-xl scale-100" 
                    : "text-slate-300 hover:text-white hover:bg-white/5 scale-95 hover:scale-100"}
                `}
              >
                {t.label}
                
                {t.badge && (
                  <span className={`
                    flex items-center justify-center w-5 h-5 text-[9px] font-black rounded-full transition-all duration-300
                    ${isActive 
                      ? "bg-indigo-600 text-white shadow-indigo-200/20" 
                      : "bg-slate-700/80 text-slate-400 group-hover:bg-slate-600 group-hover:text-slate-100"}
                  `}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export { TABS };
