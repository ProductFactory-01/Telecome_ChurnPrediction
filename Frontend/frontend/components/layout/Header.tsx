"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/95 border-b border-slate-800/80 shadow-lg transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 lg:px-10 gap-4 sm:gap-0">
        
        {/* Brand Section */}
        <div className="flex items-center gap-4">
          
          {/* Custom SVG Logo with enhanced styling */}
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-amber-400 to-orange-600 shadow-[0_0_24px_rgba(245,158,11,0.35)] flex-shrink-0 ring-1 ring-white/10 hover:shadow-[0_0_32px_rgba(245,158,11,0.45)] transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          
          {/* Title & Subtitle */}
          <div className="flex flex-col justify-center">
            <h1 className="text-base sm:text-lg lg:text-[19px] font-bold text-white tracking-tight leading-snug">
              Churn Prediction &amp; Retention
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">
              AI-Powered Multi-Agent Platform
            </p>
          </div>
        </div>

        {/* Live Badge Section */}
        <div className="flex items-center self-start sm:self-auto">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/15 border border-emerald-500/40 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.15)] backdrop-blur-sm ring-1 ring-emerald-400/20">
            {/* Pulsing Dot */}
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </div>
            
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
              Live System
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
