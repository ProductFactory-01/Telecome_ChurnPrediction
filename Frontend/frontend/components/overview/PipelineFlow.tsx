"use client";

interface Step {
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  status: string;
}

interface Props {
  steps: Step[];
}

export default function PipelineFlow({ steps }: Props) {
  return (
    <div className="card mb-6 overflow-hidden" id="pipeline-flow">
      {/* Title Bar */}
      <div className="flex items-center gap-3 py-3 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-sm shadow-indigo-200">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
           </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">AI AGENT ORCHESTRATION</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autonomous Pipeline Flow</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center w-full overflow-x-auto hide-scrollbar gap-2 lg:gap-3 py-6 lg:py-8 relative px-4">
        {/* Subtle connecting line behind all nodes on desktop */}
        <div className="hidden md:block absolute top-[50%] left-0 w-full h-0.5 bg-slate-100 -z-10" />

        {steps.map((step, i) => (
          <div key={i} className="flex items-center shrink-0 w-full md:w-auto relative z-10 bg-white md:bg-transparent">
            {/* Premium Agent Block */}
            <div 
              className="relative flex flex-col items-center justify-center w-full md:w-[200px] h-[110px] rounded-2xl shadow-sm border border-black/5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default overflow-hidden group"
              style={{ background: step.color }}
            >
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none opacity-80" />
              <div className="absolute inset-0 bg-black/5 pointer-events-none group-hover:bg-transparent transition-colors duration-300" />
              
              <div className="relative z-10 text-2xl sm:text-[28px] mb-2 drop-shadow-md transform transition-transform duration-300 group-hover:scale-110">{step.icon}</div>
              <div className="relative z-10 text-[13px] font-bold text-white tracking-wide leading-tight px-2">{step.label}</div>
              <div className="relative z-10 text-[11px] font-semibold text-white/80 tracking-widest uppercase mt-1">{step.sublabel}</div>
            </div>

            {/* Desktop Connector Chevron */}
            {i < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center px-2 lg:px-4 text-slate-300 bg-white">
                <div className="p-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>
              </div>
            )}
            {/* Mobile Connector Chevron */}
            {i < steps.length - 1 && (
              <div className="flex md:hidden items-center justify-center py-3 w-full text-slate-300">
                 <div className="p-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
