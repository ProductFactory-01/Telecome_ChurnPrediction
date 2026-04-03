from fastapi import APIRouter, HTTPException
import pandas as pd
import json
import numpy as np
from app.database import get_db_engine
from .data import PIPELINE_STEPS
from app.db.mongodb import db as mongo_db

router = APIRouter()

def get_retention_offers_sent():
    """Calculate total customer_count from MongoDB where notify_user is True."""
    if mongo_db is None:
        return 0
    try:
        coll = mongo_db["offer_campaigns"]
        # Sum of customer_count field where notify_user is True
        pipeline = [
            {"$match": {"notify_user": True}},
            {"$group": {"_id": None, "total": {"$sum": "$customer_count"}}}
        ]
        result = list(coll.aggregate(pipeline))
        return result[0]["total"] if result else 0
    except Exception as e:
        print(f"MongoDB Error in get_retention_offers_sent: {e}")
        return 0

@router.get("/overview")
def get_overview():
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        # Load all data from 'merged' (Master Base)
        df_merged = pd.read_sql('SELECT * FROM merged', engine)
        df_merged.columns = [c.replace('"', '') for c in df_merged.columns]
        # Rename 'Customer ID' to 'id' for join consistency
        df_merged = df_merged.rename(columns={'Customer ID': 'id'})
        
        # Load all data from 'Churn_New' (Updated Intelligence)
        df_churn_new = pd.read_sql('SELECT * FROM "Churn_New"', engine)
        df_churn_new.columns = [c.replace('"', '') for c in df_churn_new.columns]
        # Rename 'CustomerID' to 'id' for join consistency
        df_churn_new = df_churn_new.rename(columns={'CustomerID': 'id'})

        # ── UNIFY TABLES via Outer Join ──
        # We perform an outer join to ensure NO subscriber is dropped from either table.
        df = pd.merge(df_merged, df_churn_new, on='id', how='outer', suffixes=('_m', '_c'))

        # ── Intelligence Unification ──
        # We prioritize Churn_New columns over Merged ones using combine_first
        def unify(col_c, col_m):
            if col_c in df.columns and col_m in df.columns:
                return df[col_c].combine_first(df[col_m])
            return df[col_c] if col_c in df.columns else (df[col_m] if col_m in df.columns else None)

        df["Churn Label"] = unify("Churn Label_c", "Churn Label_m")
        df["Churn Score"] = unify("Churn Score_c", "Churn Score_m")
        df["CLTV"] = unify("CLTV_c", "CLTV_m")
        
        # Tenure field naming differs
        tenure_col = unify("Tenure Months", "Tenure in Months")
        if tenure_col is not None:
             df["TenureFinal"] = tenure_col
        else:
             df["TenureFinal"] = 0

        total = len(df)
        churned_mask = df["Churn Label"] == "Yes"
        
        churn_rate = 0.0
        if total > 0:
            churn_rate = round((churned_mask.sum() / total) * 100, 2)
            
        high_risk_flagged = int((df["Churn Score"] > 70).sum())
        avg_cltv = int(df["CLTV"].mean()) if not df["CLTV"].isna().all() else 0

        # --- Calculate Tenure Trend (Unified Base) ---
        bins = [0, 12, 24, 36, 48, 60, 100]
        labels = ["0-12m", "13-24m", "25-36m", "37-48m", "49-60m", "61m+"]
        
        df["TenureBucket"] = pd.cut(df["TenureFinal"], bins=bins, labels=labels, right=True)
        trend_group = df.groupby("TenureBucket", observed=False)["Churn Label"].apply(
            lambda x: (x == "Yes").mean() * 100
        ).fillna(0).round(1)

        real_trend_values = trend_group.tolist()
        historical_baseline = [30.5, 29.8, 25.1, 23.4, 18.0, 15.2]

        kpis = {
            "subscribers_unified": total,
            "current_churn_rate": churn_rate,
            "target_churn_rate": 19.9,
            "high_risk_flagged": high_risk_flagged,
            "retention_offers_sent": get_retention_offers_sent(),
            "subscribers_saved": int(get_retention_offers_sent() * 0.4), # Placeholder: 40% conversion
            "avg_cltv": avg_cltv,
        }

        churn_trend = {
            "labels": labels,
            "without_ai": historical_baseline,
            "with_ai": real_trend_values,
        }
        
        risk_bins = [-1, 30, 70, 100]
        risk_labels = ["Low Risk (<30)", "Medium Risk (30-70)", "High Risk (>70)"]
        df["RiskBucket"] = pd.cut(df["Churn Score"], bins=risk_bins, labels=risk_labels)
        risk_dist = df["RiskBucket"].value_counts().reindex(risk_labels).fillna(0)
        
        risk_distribution = {
            "labels": risk_labels,
            "counts": risk_dist.tolist()
        }

        result = {
            "kpis": kpis,
            "pipeline": PIPELINE_STEPS,
            "churn_trend": churn_trend,
            "risk_distribution": risk_distribution,
        }

        def default_encoder(o):
            if isinstance(o, np.integer): return int(o)
            if isinstance(o, np.floating): return float(o)
            if isinstance(o, np.ndarray): return o.tolist()
            raise TypeError
            
        return json.loads(json.dumps(result, default=default_encoder))

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
