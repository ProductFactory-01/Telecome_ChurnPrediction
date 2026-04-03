import styles from "./OfferEngine.module.css";

interface OfferKPIsProps {
  generatedCount: number;
  avgAcceptance: number;
  gamificationActive: boolean;
  revenueProtected: number;
}

export default function OfferKPIs({
  generatedCount,
  avgAcceptance,
  gamificationActive,
  revenueProtected
}: OfferKPIsProps) {
  return (
    <div className={styles.kpiRow}>
      <div className={`${styles.kpiCard} ${styles.kpiCardGreen}`}>
        <div className={styles.kpiLabel}>Offers Generated</div>
        <div className={styles.kpiValue}>{generatedCount.toLocaleString()}</div>
      </div>
      
      <div className={`${styles.kpiCard} ${styles.kpiCardAmber}`}>
        <div className={styles.kpiLabel}>Avg Acceptance (projected)</div>
        <div className={styles.kpiValue}>{avgAcceptance.toFixed(1)}%</div>
      </div>
      
      <div className={`${styles.kpiCard} ${styles.kpiCardPurple}`}>
        <div className={styles.kpiLabel}>Gamification Active</div>
        <div className={styles.kpiValue} style={{ color: gamificationActive ? "var(--green)" : "var(--red)" }}>
          {gamificationActive ? "ON" : "OFF"}
        </div>
      </div>
      
      <div className={styles.kpiCard}>
        <div className={styles.kpiLabel}>Est. Revenue Protected</div>
        <div className={styles.kpiValue}>${revenueProtected.toLocaleString()}</div>
      </div>
    </div>
  );
}
