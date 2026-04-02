import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Churn Prediction Backend", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
from app.features.overview.router import router as overview_router
from app.features.data_agent.router import router as data_agent_router
from app.features.churn_scoring.router import router as churn_scoring_router
from app.features.customers.router import router as customers_router
from app.features.offer_engine.router import router as offer_engine_router
from app.features.outreach.router import router as outreach_router
from app.features.impact.router import router as impact_router
from app.features.data_explorer.router import router as data_explorer_router
from app.features.ml_models.router import router as ml_models_router
from app.features.role_views.router import router as role_views_router
from app.features.milestones.router import router as milestones_router

app.include_router(overview_router, prefix="/api/v1", tags=["Overview"])
app.include_router(data_agent_router, prefix="/api/v1", tags=["Data Agent"])
app.include_router(churn_scoring_router, prefix="/api/v1", tags=["Churn Scoring"])
app.include_router(customers_router, prefix="/api/v1", tags=["Customers"])
app.include_router(offer_engine_router, prefix="/api/v1", tags=["Offer Engine"])
app.include_router(outreach_router, prefix="/api/v1", tags=["Outreach"])
app.include_router(impact_router, prefix="/api/v1", tags=["Impact"])
app.include_router(data_explorer_router, prefix="/api/v1", tags=["Data Explorer"])
app.include_router(ml_models_router, prefix="/api/v1", tags=["ML Models"])
app.include_router(role_views_router, prefix="/api/v1", tags=["Role Views"])
app.include_router(milestones_router, prefix="/api/v1", tags=["Milestones"])


@app.get("/")
def health():
    return {"status": "ok", "service": "Churn Prediction Backend v2"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)