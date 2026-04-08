"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import KpiCard from "../shared/KpiCard";
import AgentHeader from "../shared/AgentHeader";
import UploadWizard from "./UploadWizard";
import Loading from "../shared/Loading";

interface Source {
  key: string;
  icon: string;
  title: string;
  description: string;
  records: number;
  completeness: number;
  active: boolean;
}

export default function DataAgentTab() {
  const [data, setData] = useState<any>(null);
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    api.get("/data-agent")
      .then((r) => {
        setData(r.data);
        setSources(r.data.sources);
      })
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loading message="Fetching Data Sources..." />
      </div>
    );
  }

  const k = data.kpis;
  const activeCount = sources.filter((s) => s.active).length;
  const totalRecords = sources.filter((s) => s.active).reduce((sum, s) => sum + s.records, 0);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 mt-6 lg:mt-10">
      
      {/* 1. Header & Strategy Section */}
      <AgentHeader
        number="1"
        title="Customer360 Data Agent"
        subtitle="Unified subscriber intelligence view"
        color="blue"
        // statusLabel="Active"
        // statusType="active"
      />

      <div className="space-y-6 mt-8">
        <div className="flex items-center gap-4 px-2">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
          <h2 className="text-[17px] font-black text-slate-800 uppercase tracking-tight">Connected Data Dimensions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {sources.map((s) => (
            <div
              key={s.key}
              className="group relative bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
            >
              {/* Corner accent */}
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500 opacity-0 group-hover:opacity-[0.05] rounded-full transition-all duration-700 group-hover:scale-150" />
              
              <div className="relative z-10">
                <div className="text-3xl mb-4 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 origin-left">
                  {s.icon}
                </div>
                <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-tight mb-2">
                  {s.title}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-4 line-clamp-2">
                  {s.description}
                </p>
                <div className="text-[12px] font-black text-indigo-600 tracking-tight">
                  {s.records.toLocaleString()} <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest ml-1">Records</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="absolute top-4 right-4 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Intelligence Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="Sources Connected" value={activeCount} color="green" sub="Active API & DB Streams" />
        <KpiCard label="Total Source Records" value={totalRecords.toLocaleString()} color="blue" sub="Managed Infrastructure" />
        <KpiCard label="Unique Subscribers" value={k.unique_subscribers.toLocaleString()} color="purple" sub="Intelligence Ready Base" />
      </div>

      {/* 3. Ingestion Pipeline Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-4 px-2">
          <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
          <h2 className="text-[17px] font-black text-slate-800 uppercase tracking-tight">AI Based Subscriber Ingestion Pipeline</h2>
        </div>
        
        <div className="bg-white rounded-[32px] border border-slate-200/60 p-1 shadow-sm overflow-hidden">
          <UploadWizard />
        </div>
      </div>
      
    </div>
  );
}
