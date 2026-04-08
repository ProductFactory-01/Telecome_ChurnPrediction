"use client";
import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import Loading from "../shared/Loading";

interface Customer {
  customer_id: string; 
  Name: string; 
  gender: string; 
  tenure: number; 
  churn_label: string;
  city?: string;
}

interface Props {
  onViewDetail: (id: string) => void;
}

export default function SubscriberTable({ onViewDetail }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [churnFilter, setChurnFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  
  const limit = 10;

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    api.get("/customers", { 
      params: { 
        page, 
        limit, 
        search,
        churn: churnFilter,
        gender: genderFilter,
        city: cityFilter
      } 
    })
      .then((r) => { 
        setCustomers(r.data.customers); 
        setTotal(r.data.total); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, churnFilter, genderFilter, cityFilter]);

  useEffect(() => { 
    fetchCustomers();
  }, [fetchCustomers]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="flex flex-col bg-white overflow-hidden">
      {/* 1. Integrated Intelligence Filter Bar */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
             </div>
             <div>
               <h3 className="text-[14px] font-black text-slate-800 tracking-tight">SUBSCRIBER INTEL</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] font-mono">Unified Customer Base</p>
             </div>
          </div>
          
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3 min-w-[600px]">
            <select 
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer"
              value={churnFilter}
              onChange={(e) => { setChurnFilter(e.target.value); setPage(1); }}
            >
              <option value="">STATUS: ALL</option>
              <option value="Yes">CHURN: YES</option>
              <option value="No">CHURN: NO</option>
            </select>

            <select 
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            >
              <option value="">GENDER: ALL</option>
              <option value="Male">MALE</option>
              <option value="Female">FEMALE</option>
            </select>

            <div className="relative flex-1 max-w-[400px]">
               <input
                 className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-[12px] font-bold text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                 placeholder="Search by name, ID or city..."
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && handleSearch()}
               />
               <svg className="absolute left-3.5 top-3 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </div>

            <button
              onClick={handleSearch}
              className="h-10 px-6 bg-slate-800 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
            >
              Sync Query
            </button>
          </div>
        </div>
      </div>

      {/* 2. Intelligence Table Workspace */}
      <div className="relative min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex items-center justify-center transition-opacity">
            <Loading message="Fetching Subscriber Data..." />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-5">Managed ID</th>
                <th className="px-8">Strategy Name</th>
                <th className="px-8">Demographic</th>
                <th className="px-8 text-center">Tenure Velocity</th>
                <th className="px-8 text-center">Intelligence Status</th>
                <th className="px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map((c) => (
                <tr key={c.customer_id} className="group hover:bg-slate-50/80 transition-all duration-300">
                  <td className="px-8 py-4 font-mono text-[11px] font-black text-slate-400 tracking-tighter">{c.customer_id}</td>
                  <td className="px-8">
                    <div className="flex flex-col">
                       <span className="text-[14px] font-black text-slate-800 tracking-tight">{c.Name || "—"}</span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.city || "Multi-Region"}</span>
                    </div>
                  </td>
                  <td className="px-8">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{c.gender}</span>
                  </td>
                  <td className="px-8 text-center">
                    <span className="text-[13px] font-black text-slate-700 tracking-tight">{c.tenure} <span className="text-[9px] text-slate-400 uppercase">months</span></span>
                  </td>
                  <td className="px-8 text-center">
                    <div className="flex justify-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all
                         ${c.churn_label === "Yes" 
                           ? "bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100" 
                           : "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100"}`}>
                         {c.churn_label === "Yes" ? "🔴 High Risk" : "🟢 Stable Base"}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 text-right">
                    <button 
                      onClick={() => onViewDetail(c.customer_id)} 
                      className="inline-flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-white py-2 px-4 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all active:scale-95 group/btn"
                    >
                      View Profile
                      <svg className="transition-transform group-hover/btn:translate-x-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <span className="text-4xl text-slate-200">🔍</span>
                       <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No Records in Intelligence Shard</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. High-Performance Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between px-8 py-5 bg-slate-50/50 border-t border-slate-100">
           <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-800">{customers.length}</span> of <span className="text-slate-800">{total}</span> intelligence profiles
           </div>
           
           <div className="flex items-center gap-1.5">
             <button 
               className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none" 
               disabled={page <= 1} 
               onClick={() => setPage(page - 1)}
             >
               ←
             </button>
             
             {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
               <button 
                 key={p} 
                 className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-[12px] transition-all
                   ${p === page 
                     ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50" 
                     : "bg-white border border-slate-200 text-slate-400 hover:border-slate-400"}`} 
                 onClick={() => setPage(p)}
               >
                 {p}
               </button>
             ))}
             
             <button 
               className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none" 
               disabled={page >= totalPages} 
               onClick={() => setPage(page + 1)}
             >
               →
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
