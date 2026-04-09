import styles from "./OfferEngine.module.css";

export type OfferType = "Discount" | "Custom Bundle" | "Loyalty Points" | "Gamification" | "Plan Upgrade";

export interface RecommendationConfig {
  discount_percentage?: number;
  duration_months?: number;
  loyalty_points?: number;
  bundle_details?: string;
  plan_upgrade_target?: string;
  gamification_reward?: string;
  bill_credit_amount?: number;
}

export interface Recommendation {
  plan_id: string;
  title?: string;
  offer_type?: string;
  projected_reduction_pct: number;
  projected_target_level: string;
  offer_summary: string;
  why_it_fits: string;
  config?: RecommendationConfig;
}

interface OfferRecommendationsProps {
  recommendations: Recommendation[];
  selectedId: string;
  onSelect: (id: string) => void;
  onUpdateRecommendation: (id: string, update: Partial<Recommendation>) => void;
  isLoading: boolean;
}

export default function OfferRecommendations({
  recommendations,
  selectedId,
  onSelect,
  onUpdateRecommendation,
  isLoading,
}: OfferRecommendationsProps) {
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
            >
              <h4>{rec.offer_type || rec.title}</h4>
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
              <div className={styles.recommendationSummary}>
                {rec.offer_summary}
              </div>
              <div className={styles.recommendationNote}>{rec.why_it_fits}</div>

              {selectedId === rec.plan_id && (
                <div
                  className={styles.recommendationEditor}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.editorTitle}>Edit Plan</div>
                  <label className={styles.editorField}>
                    <span>Offer Statement</span>
                    <textarea
                      rows={3}
                      value={rec.offer_summary}
                      onChange={(e) =>
                        onUpdateRecommendation(rec.plan_id, {
                          offer_summary: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
