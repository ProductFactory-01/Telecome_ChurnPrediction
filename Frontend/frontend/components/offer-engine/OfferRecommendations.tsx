import { useState } from "react";
import styles from "./OfferEngine.module.css";

export interface Recommendation {
  plan_id: string;
  title?: string;
  offer_type?: string;
  projected_reduction_pct: number;
  projected_target_level: string;
  offer_summary: string;
  why_it_fits: string;
}

interface OfferRecommendationsProps {
  recommendations: Recommendation[];
  selectedId: string;
  onSelect: (id: string) => void;
  onUpdateSummary: (id: string, summary: string) => void;
  isLoading: boolean;
}

export default function OfferRecommendations({
  recommendations,
  selectedId,
  onSelect,
  onUpdateSummary,
  isLoading,
}: OfferRecommendationsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEditingId(id);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className={styles.offerPreview}>
      <h3>AI Offer Recommendations</h3>
      <div className={styles.recommendationGrid}>
        {isLoading ? (
          <div className={styles.recommendationCard}>
            <div className={styles.recommendationNote}>
              Matching customers and generating recommendations...
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className={styles.recommendationCard}>
            <div className={styles.recommendationNote}>
              No recommendations yet. Select filters and wait for the AI
              recommendations to load.
            </div>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.plan_id}
              className={`${styles.recommendationCard} ${
                selectedId === rec.plan_id ? styles.recommendationCardActive : ""
              }`}
              onClick={() => onSelect(rec.plan_id)}
              style={{ position: "relative" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h4>{rec.offer_type || rec.title}</h4>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={(e) => (editingId !== null && editingId === rec.plan_id) ? handleSaveClick(e) : handleEditClick(e, rec.plan_id)}
                  style={{ padding: "4px 8px", fontSize: "12px" }}
                >
                  {(editingId !== null && editingId === rec.plan_id) ? "Save" : "Edit"}
                </button>
              </div>
              
              <div className={styles.recommendationMeta}>
                <span className={styles.recommendationPill}>
                  {rec.offer_type || rec.title}
                </span>
                <span className={styles.recommendationPill}>
                  Target {rec.projected_target_level}
                </span>
                <span className={styles.recommendationPill}>
                  {rec.projected_reduction_pct}% potential reduction
                </span>
              </div>

              {editingId === rec.plan_id ? (
                <textarea
                  className="dashboard-input"
                  value={rec.offer_summary}
                  onChange={(e) => onUpdateSummary(rec.plan_id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  rows={3}
                  style={{ width: "100%", marginTop: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--color-green-light)" }}
                />
              ) : (
                <div className={styles.recommendationSummary}>
                  {rec.offer_summary}
                </div>
              )}
              
              <div className={styles.recommendationNote}>{rec.why_it_fits}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
