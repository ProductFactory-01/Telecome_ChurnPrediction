import styles from "./OfferEngine.module.css";

interface OfferKPIsProps {
  generatedCount: number;
  totalCustomers: number;
  gamificationActive?: boolean; // make optional
  revenueProtected?: number;  // make optional
}

export default function OfferKPIs({
  generatedCount = 0,
  totalCustomers = 0,
  gamificationActive = true,
  revenueProtected = 12500
}: OfferKPIsProps) {
  return (
    <div className={styles.kpiRow}>
      <div className={`${styles.kpiCard} ${styles.kpiCardGreen}`}>
        <div className={styles.kpiLabel}>Offers Generated</div>
        <div className={styles.kpiValue}>{(generatedCount || 0).toLocaleString()}</div>
      </div>
      
      <div className={`${styles.kpiCard} ${styles.kpiCardAmber}`}>
        <div className={styles.kpiLabel}>Total Customers</div>
        <div className={styles.kpiValue}>{(totalCustomers || 0).toLocaleString()}</div>
      </div>
    </div>
  );
}
