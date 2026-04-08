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
    <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden mb-10 group" id="pipeline-flow">
      {/* Header section */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-slate-50/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 flex items-center justify-center text-white ring-4 ring-indigo-50 transition-transform group-hover:scale-110">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-black text-slate-800 tracking-tight">AI AGENT ORCHESTRATION</h2>
            <p className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-[0.15em]">Unified Intelligence Pipeline</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          {/* <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span> */}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center w-full overflow-hidden gap-2 lg:gap-4 py-8 lg:py-10 relative px-4">
        {/* Subtle connecting line behind all nodes on desktop */}
        <div className="hidden md:block absolute top-[50%] left-0 w-full h-[3px] bg-slate-100 -z-10" />

        {steps.map((step, i) => (
          <div key={i} className="flex items-center shrink-0 w-full md:w-auto relative z-10">
            {/* Premium Agent Block - Reduced Size */}
            <div 
              className="relative flex flex-col items-center justify-center w-full md:w-[200px] h-[120px] rounded-[24px] shadow-sm border border-black/5 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-slate-200 cursor-default overflow-hidden group/agent"
              style={{ background: step.color }}
            >
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none opacity-90 transition-opacity group-hover/agent:opacity-100" />
              <div className="absolute inset-0 bg-black/5 pointer-events-none group-hover/agent:bg-transparent transition-colors duration-500" />
              
              <div className="relative z-10 text-2xl mb-1 drop-shadow-xl transform transition-transform duration-500 group-hover/agent:scale-110">{step.icon}</div>
              <div className="relative z-10 text-[12px] font-black text-white tracking-tight leading-tight px-2 drop-shadow-sm">{step.label}</div>
              <div className="relative z-10 text-[8px] font-black text-white/70 tracking-[0.15em] uppercase mt-1 drop-shadow-sm">{step.sublabel}</div>
              
              {/* Bottom glass reflection */}
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/10 to-transparent opacity-50" />
            </div>

            {/* Desktop Connector - Smaller */}
            {i < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center px-1 lg:px-2">
                <div className="w-6 h-6 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center transition-transform hover:scale-110">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>
              </div>
            )}
            
            {/* Mobile Connector */}
            {i < steps.length - 1 && (
              <div className="flex md:hidden items-center justify-center py-4 w-full">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
