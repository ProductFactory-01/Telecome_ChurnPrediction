from fastapi import APIRouter, HTTPException
from .schemas import CustomerInput
from .predictor import predict_churn

router = APIRouter()


@router.post("/predict")
async def predict(customer: CustomerInput):
    try:
        result = predict_churn(customer)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")


@router.get("/churn-scoring")
def get_churn_scoring_data():
    """Static data for the churn scoring dashboard."""
    return {
        "live_score": 0.82,
        "risk_rank": "#127 / 7,043",
        "risk_percent": "Top 1.8%",
        "primary_driver": "Short tenure + Fiber + No support",
        "recommended_action": "Immediate retention offer — upgrade + discount bundle",
        "risk_distribution": {
            "labels": ["High Risk (>0.7)", "Medium (0.4-0.7)", "Low (<0.4)"],
            "values": [1869, 2341, 2833],
        },
        "feature_importance": {
            "labels": [
                "Tenure in Months", "Monthly Charge", "Total Charges",
                "Contract", "Internet Service", "Payment Method",
                "Tech Support", "Online Security", "Paperless Billing",
                "Senior Citizen",
            ],
            "values": [0.24, 0.18, 0.14, 0.12, 0.09, 0.07, 0.05, 0.04, 0.04, 0.03],
        },
    }
