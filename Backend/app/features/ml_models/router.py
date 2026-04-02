from fastapi import APIRouter

router = APIRouter()


@router.get("/models")
def get_models_data():
    models_data = {
        "ibm_extended": {
            "Logistic Regression": {"metrics": {"accuracy": 80.58, "precision": 68.1, "recall": 54.3, "f1": 60.45, "roc_auc": 83.21}, "feature_importances": None},
            "Random Forest": {"metrics": {"accuracy": 79.92, "precision": 65.82, "recall": 53.1, "f1": 58.78, "roc_auc": 82.07}, "feature_importances": None},
            "Gradient Boosting": {"metrics": {"accuracy": 82.15, "precision": 70.34, "recall": 57.8, "f1": 63.45, "roc_auc": 85.62}, "feature_importances": {"labels": ["MonthlyCharges", "TotalCharges", "tenure", "Contract", "PaymentMethod", "InternetService", "TechSupport", "OnlineSecurity", "PaperlessBilling", "SeniorCitizen", "Partner", "Dependents", "StreamingTV", "StreamingMovies", "MultipleLines"], "values": [0.18, 0.15, 0.14, 0.12, 0.08, 0.07, 0.05, 0.04, 0.04, 0.03, 0.025, 0.02, 0.015, 0.015, 0.01]}},
        },
        "classic": {
            "Logistic Regression": {"metrics": {"accuracy": 79.85, "precision": 66.42, "recall": 52.8, "f1": 58.82, "roc_auc": 82.15}, "feature_importances": None},
            "Random Forest": {"metrics": {"accuracy": 79.12, "precision": 64.55, "recall": 51.2, "f1": 57.1, "roc_auc": 80.89}, "feature_importances": None},
            "Gradient Boosting": {"metrics": {"accuracy": 81.44, "precision": 68.9, "recall": 56.1, "f1": 61.8, "roc_auc": 84.33}, "feature_importances": None},
        },
        "multi_table": {
            "Logistic Regression": {"metrics": {"accuracy": 83.25, "precision": 72.8, "recall": 60.5, "f1": 66.1, "roc_auc": 87.45}, "feature_importances": None},
            "Random Forest": {"metrics": {"accuracy": 85.12, "precision": 75.6, "recall": 65.2, "f1": 70.0, "roc_auc": 89.78}, "feature_importances": None},
            "Gradient Boosting": {"metrics": {"accuracy": 87.35, "precision": 78.9, "recall": 70.1, "f1": 74.2, "roc_auc": 91.03}, "feature_importances": {"labels": ["Tenure in Months", "Monthly Charge", "Total Charges", "Total Revenue", "CLTV", "Contract", "Internet Type", "Payment Method", "Satisfaction Score", "Number of Referrals", "Tech Support", "Online Security", "Paperless Billing", "Senior Citizen", "Avg Monthly GB"], "values": [0.24, 0.18, 0.14, 0.08, 0.07, 0.06, 0.05, 0.04, 0.035, 0.025, 0.02, 0.018, 0.015, 0.012, 0.01]}},
        },
    }

    return {
        "models": models_data,
        "ds_names": ["ibm_extended", "classic", "multi_table"],
        "ds_labels": ["CRM & Billing", "Core Services", "Subscriber Intelligence"],
    }
