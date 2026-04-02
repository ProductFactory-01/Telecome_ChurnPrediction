from fastapi import APIRouter
from .data import TAXONOMY, RISK_LEVELS, OFFER_EFFECTIVENESS, ACCEPTANCE_BY_RISK

router = APIRouter()


@router.get("/offer-engine")
def get_offer_engine_data():
    return {
        "taxonomy": TAXONOMY,
        "risk_levels": RISK_LEVELS,
        "charts": {
            "effectiveness": OFFER_EFFECTIVENESS,
            "acceptance_by_risk": ACCEPTANCE_BY_RISK,
        },
    }


@router.get("/offer-engine/customers")
def get_offer_engine_customers():
    """Static mock — will query DB later."""
    return {"data": []}


@router.post("/offer-engine/match-customers")
def match_customers(payload: dict):
    """Static mock — will integrate Groq later."""
    return {"offers": []}


@router.post("/offer-engine/recommendations")
def get_recommendations(payload: dict):
    """Static mock — will integrate Groq later."""
    return {
        "recommendations": [
            {
                "plan_id": "plan_discount",
                "title": "Discount",
                "offer_type": "Discount",
                "offer_summary": "15% off for 6 months",
                "projected_reduction_pct": 18,
                "projected_target_level": "Level 3",
                "why_it_fits": "Immediate price relief reduces churn pressure for price-sensitive cohort.",
            },
            {
                "plan_id": "plan_bundle",
                "title": "Custom Bundle",
                "offer_type": "Custom Bundle",
                "offer_summary": "Premium streaming + tech support for 6 months",
                "projected_reduction_pct": 14,
                "projected_target_level": "Level 3",
                "why_it_fits": "Improves perceived value for the selected cohort.",
            },
            {
                "plan_id": "plan_upgrade",
                "title": "Plan Upgrade",
                "offer_type": "Plan Upgrade",
                "offer_summary": "Free upgrade to premium plan for 6 months",
                "projected_reduction_pct": 11,
                "projected_target_level": "Level 4",
                "why_it_fits": "Adds service value while targeting a safer post-offer level.",
            },
        ]
    }


@router.post("/offer-engine/save-offer")
def save_offer(payload: dict):
    """Static mock — will integrate MongoDB later."""
    return {"document_name": "mock_document", "customer_count": 0}
