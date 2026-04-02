from fastapi import APIRouter
from .data import OVERVIEW_KPIS, PIPELINE_STEPS, CHURN_TREND, AGENT_ACTIVITY

router = APIRouter()


@router.get("/overview")
def get_overview():
    return {
        "kpis": OVERVIEW_KPIS,
        "pipeline": PIPELINE_STEPS,
        "churn_trend": CHURN_TREND,
        "agent_activity": AGENT_ACTIVITY,
    }
