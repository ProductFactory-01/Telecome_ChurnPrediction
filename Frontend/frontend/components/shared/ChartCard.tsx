"use client";
import { ReactNode } from "react";

interface Props {
  title: string;
  icon?: string;
  children: ReactNode;
  height?: number;
}

export default function ChartCard({ title, icon, children, height = 280 }: Props) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-200/60 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden relative group">
      {/* Header section with icon and title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
              {icon}
            </div>
          )}
          <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">
            {title}
          </h3>
        </div>
        
        {/* Subtle decorative dot */}
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 transition-colors group-hover:bg-indigo-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
        </div>
      </div>

      {/* Chart container */}
      <div 
        style={{ height }} 
        className="relative overflow-hidden rounded-2xl"
      >
        {children}
      </div>
      
      {/* Decorative glass border highlight */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}
