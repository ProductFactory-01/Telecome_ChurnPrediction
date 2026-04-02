"""Static data for Overview tab."""

OVERVIEW_KPIS = {
    "subscribers_unified": 7043,
    "current_churn_rate": 26.54,
    "target_churn_rate": 19.9,
    "high_risk_flagged": 1869,
    "retention_offers_sent": 0,
    "subscribers_saved": 0,
    "model_roc_auc": 91.03,
}

PIPELINE_STEPS = [
    {"label": "Agent 1", "sublabel": "Data Unified", "icon": "📊", "color": "#1565c0", "status": "done"},
    {"label": "Agent 2", "sublabel": "Scoring Live", "icon": "🎯", "color": "#f59e0b", "status": "done"},
    {"label": "Agent 3", "sublabel": "Offers Ready", "icon": "🎁", "color": "#16a34a", "status": "done"},
    {"label": "Agent 4", "sublabel": "Outreach Active", "icon": "📡", "color": "#7c3aed", "status": "done"},
    {"label": "Impact", "sublabel": "Dashboard Live", "icon": "📈", "color": "#0a1f44", "status": "done"},
]

CHURN_TREND = {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    "without_ai": [26.5] * 12,
    "with_ai": [26.5, 26.2, 25.8, 25.3, 24.6, 23.8, 22.9, 22.1, 21.2, 20.5, 19.9, 19.5],
}

AGENT_ACTIVITY = {
    "labels": ["Agent 1\nData", "Agent 2\nScoring", "Agent 3\nOffers", "Agent 4\nOutreach"],
    "tasks_completed": [6, 7043, 0, 0],
}
