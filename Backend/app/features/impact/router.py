from fastapi import APIRouter

router = APIRouter()


@router.get("/impact")
def get_impact_data():
    return {
        "outcomes": {
            "churn_reduction": "0%",
            "offer_acceptance_rate": "0%",
            "clv_increase": "+0%",
            "cost_saving": "0%",
        },
        "meters": {
            "identification_rate": {"value": 0, "min": 60, "stretch": 75},
            "offer_uplift": {"value": 0, "min": 20, "stretch": 35},
            "revenue_protected": {"value": 0, "target": 2400000},
            "subscribers_retained": {"value": 0, "target": 1761},
        },
        "charts": {
            "churn_over_time": {
                "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                "baseline": [26.5] * 12,
                "with_ai": [26.5, 26.2, 25.8, 25.3, 24.6, 23.8, 22.9, 22.1, 21.2, 20.5, 19.9, 19.5],
            },
            "ab_test": {
                "labels": ["Churn Rate", "Offer Accept %", "Avg CLV ($K)", "Satisfaction"],
                "control": [26.5, 8.5, 4.87, 3.2],
                "ai_group": [20.7, 23.1, 6.68, 4.1],
            },
        },
        "roi": {
            "revenue_protected": "$0",
            "subscribers_retained": 0,
            "detection_accuracy": "91%",
            "signal_to_action": "--",
        },
    }
