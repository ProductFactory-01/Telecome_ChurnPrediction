"""Static data for the Offer Engine feature."""

TAXONOMY = [
    {"main_category": "Price-Sensitive", "sub_drivers": ["Price Issue"]},
    {"main_category": "Low Engagement", "sub_drivers": ["Other"]},
    {"main_category": "Plan & Product Mismatch", "sub_drivers": ["Competitor"]},
    {"main_category": "Customer Experience Issues", "sub_drivers": ["Service Issue", "Support Issue"]},
    {"main_category": "High-Value Customer Risk", "sub_drivers": ["Other", "Personal Reason"]},
    {"main_category": "Demographics", "sub_drivers": ["Personal Reason"]},
    {"main_category": "Geography", "sub_drivers": ["Service Issue"]},
    {"main_category": "Behavior", "sub_drivers": ["Other"]},
    {"main_category": "Billing", "sub_drivers": ["Price Issue"]},
    {"main_category": "Product Adoption Gap", "sub_drivers": ["Competitor", "Other"]},
]

RISK_LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]

OFFER_EFFECTIVENESS = {
    "labels": ["Discount", "Upgrade", "Loyalty Pts", "Gamification", "Bundle"],
    "values": [18, 14, 16, 22, 12],
}

ACCEPTANCE_BY_RISK = {
    "labels": ["Level 5", "Level 4", "Level 3", "Level 2", "Level 1"],
    "generic": [5, 7, 9, 11, 13],
    "ai_personalised": [10, 14, 19, 24, 29],
}
