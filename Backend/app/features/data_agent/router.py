from fastapi import APIRouter
from .data import DATA_SOURCES, DATA_AGENT_KPIS

router = APIRouter()


@router.get("/data-agent")
def get_data_agent():
    return {"sources": DATA_SOURCES, "kpis": DATA_AGENT_KPIS}
