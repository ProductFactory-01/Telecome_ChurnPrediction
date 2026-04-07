"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function Header() {
  const [userName, setUserName] = useState("Admin Demo");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || user.name || "Admin Demo");
      } catch (e) {
        console.error("Auth: Error parsing user", e);
      }
    }
  }, []);
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/95 border-b border-slate-800/80 shadow-lg transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 lg:px-10 gap-4 sm:gap-0">
        
        {/* Brand Section */}
        <div className="flex items-center gap-4">
          
          {/* Corporate Logo */}
          <div className="flex items-center justify-center h-12 px-3 bg-white rounded-xl shadow-inner border border-white/10 flex-shrink-0">
            <img src="/corp_logo.svg" alt="CenturyLink" className="h-6 w-auto" />
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

        {/* User & Live Badge Section */}
        <div className="flex items-center gap-6 self-start sm:self-auto">
          {/* User Profile */}
          <div className="hidden md:flex items-center gap-3 pr-6 border-r border-slate-800/60">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/10 border border-white/10 ring-1 ring-white/10 overflow-hidden">
               <img 
                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} 
                 alt="User Avatar"
                 className="w-full h-full object-cover"
               />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-white leading-tight">{userName}</span>
              <button 
                onClick={() => {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                className="text-[10px] uppercase font-black tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mt-0.5 group"
              >
                Sign Out <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

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
