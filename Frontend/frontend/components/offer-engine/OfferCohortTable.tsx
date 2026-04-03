import { useState } from "react";
import styles from "./OfferEngine.module.css";

interface Customer {
  customer_id: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  gender: string;
  senior_citizen: string;
  partner: string;
  dependents: string;
  tenure_months: number | string;
  internet_service: string;
  contract: string;
  payment_method: string;
  monthly_charges: number | string;
  total_charges: number | string;
  churn_label: string;
  churn_score: number | string;
  main_category: string;
  sub_category: string;
  churn_reason: string;
  planned_offer?: string;
  rationale?: string;
  [key: string]: any;
}

interface OfferCohortTableProps {
  customers: Customer[];
}

const PAGE_SIZE = 10;

export default function OfferCohortTable({ customers }: OfferCohortTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const total = customers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageRows = customers.slice(startIdx, startIdx + PAGE_SIZE);

  const from = total === 0 ? 0 : startIdx + 1;
  const to = Math.min(startIdx + PAGE_SIZE, total);

  return (
    <div className={styles.tableCard}>
      <h3>Matched Customer Cohort</h3>
      <p>
        This table shows only the customers matched for the currently selected
        main category, sub category, and risk level.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Country</th>
              <th>State</th>
              <th>City</th>
              <th>Zip Code</th>
              <th>Gender</th>
              <th>Senior Citizen</th>
              <th>Partner</th>
              <th>Dependents</th>
              <th>Tenure Months</th>
              <th>Internet Service</th>
              <th>Contract</th>
              <th>Payment Method</th>
              <th>Monthly Charges</th>
              <th>Total Charges</th>
              <th>Churn Label</th>
              <th>Churn Score</th>
              <th>Main Category</th>
              <th>Sub Category</th>
              <th>Churn Reason</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={20}
                  style={{ textAlign: "center", padding: "40px", color: "#64748b" }}
                >
                  No customers matched for the current selection.
                </td>
              </tr>
            ) : (
              pageRows.map((c, i) => (
                <tr key={`${c.customer_id}-${i}`}>
                  <td>{c.customer_id || c["Customer ID"] || "—"}</td>
                  <td>{c.country || c["Country"] || "—"}</td>
                  <td>{c.state || c["State"] || "—"}</td>
                  <td>{c.city || c["City"] || "—"}</td>
                  <td>{c.zip_code || c["Zip Code"] || "—"}</td>
                  <td>{c.gender || c["Gender"] || "—"}</td>
                  <td>{c.senior_citizen || c["Senior Citizen"] || "—"}</td>
                  <td>{c.partner || c["Partner"] || "—"}</td>
                  <td>{c.dependents || c["Dependents"] || "—"}</td>
                  <td>{c.tenure_months || c["Tenure Months"] || "—"}</td>
                  <td>{c.internet_service || c["Internet Service"] || "—"}</td>
                  <td>{c.contract || c["Contract"] || "—"}</td>
                  <td>{c.payment_method || c["Payment Method"] || "—"}</td>
                  <td>{c.monthly_charges || c["Monthly Charges"] || "—"}</td>
                  <td>{c.total_charges || c["Total Charges"] || "—"}</td>
                  <td>{c.churn_label || c["Churn Label"] || "—"}</td>
                  <td>{c.churn_score || c["Churn Score"] || "—"}</td>
                  <td>{c.main_category || c["Main Category"] || "—"}</td>
                  <td>{c.sub_category || c["Sub Category"] || "—"}</td>
                  <td>{c.churn_reason || c["Churn Reason"] || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.tablePagination}>
        <div className={styles.tablePageInfo}>
          Showing {from}-{to} of {total}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`btn btn--primary ${
              page <= 1 ? styles.selectBlockDisabled : ""
            }`}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className={`btn btn--primary ${
              page >= totalPages ? styles.selectBlockDisabled : ""
            }`}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
