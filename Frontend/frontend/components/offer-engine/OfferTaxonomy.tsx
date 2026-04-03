import styles from "./OfferEngine.module.css";

export const TAXONOMY = [
  { main_category: "Price-Sensitive", sub_drivers: ["Price Issue"] },
  { main_category: "Low Engagement", sub_drivers: ["Other"] },
  { main_category: "Plan & Product Mismatch", sub_drivers: ["Competitor"] },
  {
    main_category: "Customer Experience Issues",
    sub_drivers: ["Service Issue", "Support Issue"],
  },
  {
    main_category: "High-Value Customer Risk",
    sub_drivers: ["Other", "Personal Reason"],
  },
  { main_category: "Demographics", sub_drivers: ["Personal Reason"] },
  { main_category: "Geography", sub_drivers: ["Service Issue"] },
  { main_category: "Behavior", sub_drivers: ["Other"] },
  { main_category: "Billing", sub_drivers: ["Price Issue"] },
  {
    main_category: "Product Adoption Gap",
    sub_drivers: ["Competitor", "Other"],
  },
];

export const RISK_LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];

interface OfferTaxonomyProps {
  selectedMain: string;
  selectedSub: string;
  selectedRisk: string;
  onMainChange: (val: string) => void;
  onSubChange: (val: string) => void;
  onRiskChange: (val: string) => void;
  onViewCustomers: () => void;
  onGenerateAI: () => void;
  status: string;
  isLoading: boolean;
  canViewCustomers: boolean;
  canGenerateAI: boolean;
}

export default function OfferTaxonomy({
  selectedMain,
  selectedSub,
  selectedRisk,
  onMainChange,
  onSubChange,
  onRiskChange,
  onViewCustomers,
  onGenerateAI,
  status,
  isLoading,
  canViewCustomers,
  canGenerateAI,
}: OfferTaxonomyProps) {
  const currentSubDrivers =
    TAXONOMY.find((t) => t.main_category === selectedMain)?.sub_drivers || [];

  return (
    <div className={`${styles.controlPanel} ${styles.offerConfigPanel}`}>
      <h4>Offer Intelligence Taxonomy</h4>

      <div className={styles.selectorGroup}>
        <div className={styles.selectorLabel}>Main Category</div>
        <div className={styles.blockGrid}>
          {TAXONOMY.map((t) => (
            <div
              key={t.main_category}
              className={`${styles.selectBlock} ${
                selectedMain === t.main_category ? styles.selectBlockActive : ""
              }`}
              onClick={() => onMainChange(t.main_category)}
            >
              {t.main_category}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.selectorGroup}>
        <div className={styles.selectorLabel}>Sub Category</div>
        <div className={styles.blockGrid}>
          {currentSubDrivers.map((sub) => (
            <div
              key={sub}
              className={`${styles.selectBlock} ${
                selectedSub === sub ? styles.selectBlockActive : ""
              }`}
              onClick={() => onSubChange(sub)}
            >
              {sub}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.selectorGroup}>
        <div className={styles.selectorLabel}>Risk Level</div>
        <div className={styles.blockGrid}>
          {RISK_LEVELS.map((level) => (
            <div
              key={level}
              className={`${styles.selectBlock} ${
                selectedRisk === level ? styles.selectBlockActive : ""
              }`}
              onClick={() => onRiskChange(level)}
            >
              {level}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <button
          className={`btn btn--primary ${
            !canViewCustomers || isLoading ? styles.selectBlockDisabled : ""
          }`}
          onClick={onViewCustomers}
          disabled={!canViewCustomers || isLoading}
        >
          🔍 View Customers
        </button>
        <button
          className={`btn btn--primary ${
            !canGenerateAI || isLoading ? styles.selectBlockDisabled : ""
          }`}
          onClick={onGenerateAI}
          disabled={!canGenerateAI || isLoading}
        >
          🤖 Generate Offer
        </button>
      </div>

      <div className={styles.generatorStatus}>{status}</div>
    </div>
  );
}
