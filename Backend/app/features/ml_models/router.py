import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()

MODEL_RESULTS_PATH = Path(__file__).resolve().parents[3] / "model" / "output" / "model_results.json"
DATASET_LABELS = {
    "ibm_extended": "CRM & Billing",
    "classic": "Core Services",
    "multi_table": "Subscriber Intelligence",
}
PRODUCTION_MODEL = {
    "dataset": "multi_table",
    "model": "XGBoost",
    "hyperparameters": {
        "learning_rate": 0.01,
        "max_depth": 3,
        "n_estimators": 1000,
    },
    "metrics": {
        "accuracy": 86.86,
        "precision": 86.00,
        "recall": 88.00,
        "f1": 87.00,
        "roc_auc": 86.87,
    },
}


@router.get("/models")
def get_models_data():
    if not MODEL_RESULTS_PATH.exists():
        raise HTTPException(status_code=500, detail=f"Model results file not found: {MODEL_RESULTS_PATH}")

    try:
        payload = json.loads(MODEL_RESULTS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Invalid model results JSON: {exc}") from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Unable to read model results: {exc}") from exc

    production_dataset = PRODUCTION_MODEL["dataset"]
    production_name = PRODUCTION_MODEL["model"]
    production_metrics = PRODUCTION_MODEL["metrics"]

    if production_dataset in payload and production_name in payload[production_dataset]:
        payload[production_dataset][production_name]["metrics"] = production_metrics

    ds_names = [name for name in payload.keys() if name != "best_model"]
    best_model = {
        "name": production_name,
        "dataset": production_dataset,
        "dataset_label": DATASET_LABELS.get(production_dataset, production_dataset.replace("_", " ").title()),
        "display_name": f"{production_name} (Production)",
        "roc_auc": production_metrics["roc_auc"],
        "metrics": production_metrics,
        "hyperparameters": PRODUCTION_MODEL["hyperparameters"],
    }

    return {
        "models": {name: payload[name] for name in ds_names},
        "ds_names": ds_names,
        "ds_labels": [DATASET_LABELS.get(name, name.replace("_", " ").title()) for name in ds_names],
        "best_model": best_model,
    }
