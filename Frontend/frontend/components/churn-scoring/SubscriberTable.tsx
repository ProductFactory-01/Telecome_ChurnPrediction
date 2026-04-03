"use client";
import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import Link from "next/link";

interface Customer {
  customer_id: string; 
  Name: string; 
  gender: string; 
  tenure: number; 
  churn_label: string;
  city?: string;
}

export default function SubscriberTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  
  // New Filters
  const [churnFilter, setChurnFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  
  const limit = 10;

  const fetchCustomers = useCallback(() => {
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
      .catch(console.error);
  }, [page, search, churnFilter, genderFilter, cityFilter]);

  useEffect(() => { 
    fetchCustomers(); 
  }, [fetchCustomers]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="card">
      <div className="card__header flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
        <div className="card__title">📋 Subscriber Intelligence Database</div>
        
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          
          <select 
            className="sim-field__input !w-auto text-xs font-bold bg-gray-50 border-gray-200"
            value={churnFilter}
            onChange={(e) => { setChurnFilter(e.target.value); setPage(1); }}
          >
            <option value="">Status: All</option>
            <option value="Yes">Churn: Yes</option>
            <option value="No">Churn: No</option>
          </select>

          <select 
            className="sim-field__input !w-auto text-xs font-bold bg-gray-50 border-gray-200"
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
          >
            <option value="">Gender: All</option>
            <option value="Male">Male Only</option>
            <option value="Female">Female Only</option>
          </select>

          <input
            className="sim-field__input !w-auto text-xs font-bold bg-gray-50 border-gray-200"
            placeholder="Search by City..."
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          />

          <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>

          <input
            className="sim-field__input !w-auto text-xs"
            style={{ width: 220 }}
            placeholder="Search by Name or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Tenure</th>
              <th>Churn</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(customers || []).map((c) => (
              <tr key={c.customer_id}>
                <td className="font-mono text-[11px] font-bold text-gray-500 uppercase">{c.customer_id}</td>
                <td className="font-bold text-gray-900">{c.Name || "—"}</td>
                <td>{c.gender}</td>
                <td>{c.tenure} mo</td>
                <td>
                  <span className={`data-table__badge data-table__badge--${c.churn_label === "Yes" ? "yes" : "no"}`}>
                    {c.churn_label}
                  </span>
                </td>
                <td>
                  <Link href={`/customers/${c.customer_id}`} className="inline-block text-blue-600 font-black hover:underline bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100 transition-all hover:bg-blue-100/50">
                    View Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pagination__btn ${p === page ? "pagination__btn--active" : ""}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
