"""Churn prediction model loader and predictor logic."""
import os
import numpy as np
import joblib

try:
    import h3
except ImportError:
    h3 = None

from app.llm import GROQ_API_KEY, try_groq_json
from .schemas import CustomerInput

# Resolve model path relative to this file
_BACKEND_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
_MODEL_PATH = os.path.join(_BACKEND_ROOT, "model", "churn_model_v1.pkl")

_model = None

def get_model():
    global _model
    if _model is not None:
        return _model
        
    try:
        import joblib
        model_data = joblib.load(_MODEL_PATH)
        _model = model_data["model"]
        print(f"✓ Prediction model loaded from {_MODEL_PATH}")
    except Exception as e:
        print(f"⚠ Could not load prediction model: {e}")
        _model = None
        
    return _model


def latlng_to_numeric_cell(latitude: float, longitude: float, resolution: int = 5) -> int:
    if h3 is not None:
        hex_id = h3.latlng_to_cell(latitude, longitude, resolution)
        return int(hex_id, 16) % 100000
    return abs(hash((round(latitude, 6), round(longitude, 6), resolution))) % 100000


def get_fallback_reason(prob: float, data: CustomerInput):
    # Deterministic fallback rules for stability
    if prob < 0.4:
        return None
    if data.MonthlyCharges > 80 and data.TenureMonths < 12:
        return {"main_category": "Price-Sensitive", "sub_category": "Price Issue", "reason": "High Cost Pressure for High-Value Subscriber"}
    elif not data.TechSupport and data.InternetService == "Fiber optic":
        return {"main_category": "Service Quality", "sub_category": "Technical Issue", "reason": "Lack of Tech Support on Fiber Connection"}
    elif data.Contract == "Month-to-month" and data.TenureMonths < 6:
        return {"main_category": "Competitor", "sub_category": "Better Offer", "reason": "Early-tenure Risk / Competitor pricing attractiveness"}
    return {"main_category": "Customer Experience", "sub_category": "General Issue", "reason": "General dissatisfaction with service terms"}


def get_llm_churn_reason(prob, data: CustomerInput):
    # Use LLM (Groq) for high-fidelity reasoning
    if not GROQ_API_KEY or prob < 0.4:
        return get_fallback_reason(prob, data)
    
    prompt = {
        "churn_probability": prob,
        "risk_level": "High" if prob > 0.7 else "Medium",
        "customer_profile": {
            "gender": data.Gender,
            "senior_citizen": data.SeniorCitizen,
            "tenure_months": data.TenureMonths,
            "contract": data.Contract,
            "monthly_charges": data.MonthlyCharges,
            "total_charges": data.TotalCharges,
            "internet_service": data.InternetService,
            "phone_service": data.PhoneService,
            "tech_support": data.TechSupport,
            "online_security": data.OnlineSecurity,
            "paperless_billing": data.PaperlessBilling,
        },
        "task": (
            "Analyze why this subscriber is at risk based on the data. "
            "Return only valid JSON in the shape: "
            "{\"main_category\": \"...\", \"sub_category\": \"...\", \"reason\": \"...\"}. "
            "Categories should match: Service Quality, Pricing, Competitor, or Experience. "
            "Reason must be a concise, one-sentence data-driven insight."
        )
    }

    parsed = try_groq_json(
        "You are a churn analysis assistant. Return only valid JSON for reasoning.",
        prompt
    )
    
    if parsed and isinstance(parsed, dict) and "reason" in parsed:
        return parsed
    return get_fallback_reason(prob, data)


def predict_churn(customer: CustomerInput) -> dict:
    model = get_model()
    if model is None:
        raise RuntimeError("Prediction model not loaded")

    gender_map = {"Male": 1, "Female": 0}
    internet_map = {"DSL": 0, "Fiber optic": 1, "No": 2}
    contract_map = {"Month-to-month": 0, "One year": 1, "Two year": 2}
    payment_map = {"Bank transfer (automatic)": 0, "Credit card (automatic)": 1, "Electronic check": 2, "Mailed check": 3}

    hex_id_numeric = latlng_to_numeric_cell(customer.Latitude, customer.Longitude, 5)

    features = [
        gender_map.get(customer.Gender, 0),
        1 if customer.SeniorCitizen else 0,
        1 if customer.Partner else 0,
        1 if customer.Dependents else 0,
        customer.TenureMonths,
        1 if customer.PhoneService else 0,
        1 if customer.MultipleLines else 0,
        internet_map.get(customer.InternetService, 2),
        1 if customer.OnlineSecurity else 0,
        1 if customer.OnlineBackup else 0,
        1 if customer.DeviceProtection else 0,
        1 if customer.TechSupport else 0,
        1 if customer.StreamingTV else 0,
        1 if customer.StreamingMovies else 0,
        contract_map.get(customer.Contract, 0),
        1 if customer.PaperlessBilling else 0,
        payment_map.get(customer.PaymentMethod, 2),
        customer.MonthlyCharges,
        customer.TotalCharges,
        hex_id_numeric,
    ]

    churn_prob = float(model.predict_proba(np.array(features).reshape(1, -1))[0][1])
    return {
        "churn_probability": round(churn_prob, 4),
        "churn_prediction": 1 if churn_prob > 0.5 else 0,
        "risk_level": "High" if churn_prob > 0.7 else "Medium" if churn_prob > 0.4 else "Low",
        "churn_reason": get_llm_churn_reason(churn_prob, customer),
    }
