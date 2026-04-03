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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // New Filters
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

  return (
    <div className="card overflow-hidden">
      <div className="card__header flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 px-6 border-b border-slate-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
           </div>
           <div>
             <h3 className="text-sm font-bold text-slate-800">Subscriber Intelligence</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unified Database View</p>
           </div>
        </div>
        
        {/* Filter Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          
          <select 
            className="sim-field__input px-3 py-1.5 text-[11px] font-bold bg-slate-50 border-slate-200 min-w-[120px] flex-shrink-0"
            value={churnFilter}
            onChange={(e) => { setChurnFilter(e.target.value); setPage(1); }}
          >
            <option value="">STATUS: ALL</option>
            <option value="Yes">CHURN: YES</option>
            <option value="No">CHURN: NO</option>
          </select>

          <select 
            className="sim-field__input px-3 py-1.5 text-[11px] font-bold bg-slate-50 border-slate-200 min-w-[120px] flex-shrink-0"
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
          >
            <option value="">GENDER: ALL</option>
            <option value="Male">MALE</option>
            <option value="Female">FEMALE</option>
          </select>

          <input
            className="sim-field__input px-3 py-1.5 text-[11px] font-bold bg-slate-50 border-slate-200 min-w-[140px] flex-shrink-0"
            placeholder="CITY..."
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          />

          <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block flex-shrink-0"></div>

          <input
            className="sim-field__input px-3 py-1.5 text-[11px] font-bold bg-white min-w-[150px] flex-shrink-0"
            style={{ width: 200 }}
            placeholder="SEARCH NAME/ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loading message="Fetching Intelligence Records..." />
          </div>
        ) : null}

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Tenure</th>
                <th>Churn Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(customers || []).map((c) => (
                <tr key={c.customer_id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="font-mono text-[11px] font-bold text-slate-400 tracking-tighter">{c.customer_id}</td>
                  <td className="font-bold text-slate-800 tracking-tight">{c.Name || "—"}</td>
                  <td className="text-slate-500 font-medium">{c.gender}</td>
                  <td className="text-slate-500 font-medium">{c.tenure} mo</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tighter border ${c.churn_label === "Yes" ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                      {c.churn_label === "Yes" ? "High Risk" : "Stable Base"}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => onViewDetail(c.customer_id)} 
                      className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-[11px] uppercase tracking-tight bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/50 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-95 shadow-sm shadow-indigo-100/20"
                    >
                      View Profile
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="text-slate-300 font-black uppercase tracking-widest text-xs">No Intel Matching Your Query</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && !loading && (
        <div className="pagination border-t border-slate-50 bg-slate-50/10 py-4 px-6">
          <button className="pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pagination__btn ${p === page ? "pagination__btn--active" : ""}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>→</button>
        </div>
      )}
    </div>
  );
}
