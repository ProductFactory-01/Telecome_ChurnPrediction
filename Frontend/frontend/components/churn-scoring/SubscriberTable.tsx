"use client";
import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";

interface Customer {
  customer_id: string; Name: string; gender: string; tenure: number; churn_label: string;
}

interface Props {
  onViewCustomer?: (id: string) => void;
}

export default function SubscriberTable({ onViewCustomer }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  const fetchCustomers = useCallback(() => {
    api.get("/customers", { params: { page, limit, search } })
      .then((r) => { setCustomers(r.data.customers); setTotal(r.data.total); })
      .catch(console.error);
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__title">📋 Subscriber List</div>
        <input
          className="sim-field__input"
          style={{ width: 240 }}
          placeholder="Search by name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
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
            {customers.map((c) => (
              <tr key={c.customer_id}>
                <td>{c.customer_id}</td>
                <td>{c.Name || "—"}</td>
                <td>{c.gender}</td>
                <td>{c.tenure} mo</td>
                <td>
                  <span className={`data-table__badge data-table__badge--${c.churn_label === "Yes" ? "yes" : "no"}`}>
                    {c.churn_label}
                  </span>
                </td>
                <td>
                  <button className="data-table__link" onClick={() => onViewCustomer?.(c.customer_id)}>
                    View 360°
                  </button>
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
