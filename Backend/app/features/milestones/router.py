from fastapi import APIRouter

router = APIRouter()


@router.get("/milestones")
def get_milestones():
    return {
        "phases": [
            {"phase": "Phase 1 — Data Unification", "phase_class": "p1", "title": "Customer360 Data Agent Live", "deliverables": "Unified subscriber view with CRM + billing + NPS + network quality merged", "agent": "Agent 1", "milestone": "✅ Subscriber Intelligence Layer Live"},
            {"phase": "Phase 2 — Churn Scoring", "phase_class": "p2", "title": "Churn Model Validated", "deliverables": "Daily propensity scores; 91.03% ROC-AUC validated", "agent": "Agent 2", "milestone": "✅ Churn Model Validated"},
            {"phase": "Phase 3 — Offer & Outreach", "phase_class": "p3", "title": "Live Retention Campaign", "deliverables": "Personalised offers + omnichannel outreach live", "agent": "Agent 3 + Agent 4", "milestone": "🔄 Live Retention Campaign"},
            {"phase": "Phase 4 — UAT & Handoff", "phase_class": "p4", "title": "UC3 PoC Complete", "deliverables": "A/B test results; CRM team trained", "agent": "Validation: Control group comparison", "milestone": "⏳ UC3 PoC Complete"},
        ],
        "gauges": [
            {"title": "Churn Identification Rate", "value": 78, "min_target": 60, "stretch_target": 75, "metrics": [{"label": "Achieved", "value": "78%"}, {"label": "False Pos.", "value": "12.3%"}]},
            {"title": "Offer Acceptance Uplift", "value": 76, "min_target": 20, "stretch_target": 35, "metrics": [{"label": "Uplift", "value": "+38%"}, {"label": "AI Rate", "value": "23.1%"}]},
        ],
    }
