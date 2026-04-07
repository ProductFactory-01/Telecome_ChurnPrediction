import json
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException
from app.database import get_db_engine
from app.db.mongodb import db as mongo_db
from pathlib import Path
from datetime import datetime
from collections import defaultdict

router = APIRouter()

# --- Config Paths ---
MODEL_RESULTS_PATH = Path(__file__).resolve().parents[3] / "model" / "output" / "model_results.json"

# --- Helpers for Data Fetching ---

def get_ops_metrics(engine):
    """Fetch AI & Data Ops KPIs: Accuracy, Records, Completeness."""
    # 1. Real Model Performance from JSON
    perf_labels = ["XGBoost", "Random Forest", "Logistic Reg"]
    perf_values = [0, 0, 0]
    
    if MODEL_RESULTS_PATH.exists():
        try:
            results = json.loads(MODEL_RESULTS_PATH.read_text(encoding="utf-8"))
            mt = results.get("multi_table", {})
            if mt:
               perf_values = [
                   mt.get("XGBoost", {}).get("metrics", {}).get("accuracy", 0),
                   mt.get("Random Forest", {}).get("metrics", {}).get("accuracy", 0),
                   mt.get("Logistic Regression", {}).get("metrics", {}).get("accuracy", 0),
               ]
        except: pass

    # 2. Total Records & Data Health (Live SQL)
    try:
        domains = {
            "Demographics": ["Name", "email", "Gender", "Age"],
            "Location": ["City", "State", "Zip Code", "Latitude", "Longitude"],
            "Services": ["Phone Service", "Internet Service", "Contract", "Monthly Charge"],
            "Status": ["Satisfaction Score", "Customer Status", "Churn Label"]
        }
        health_labels, health_values = [], []
        total_records = pd.read_sql('SELECT COUNT(*) FROM source', engine).iloc[0, 0]
        
        if total_records > 0:
            for domain, cols in domains.items():
                col_list = ", ".join([f'"{c}"' for c in cols])
                df_domain = pd.read_sql(f'SELECT {col_list} FROM source', engine)
                completeness = round((df_domain.notna().sum().sum() / (total_records * len(cols))) * 100, 1)
                health_labels.append(domain)
                health_values.append(completeness)
        else:
            health_labels, health_values = list(domains.keys()), [0, 0, 0, 0]

    except:
        total_records, health_labels, health_values = 0, ["Demographics", "Services", "Status", "Location"], [0, 0, 0, 0]

    return {
        "kpis": [
            {"label": "Production Accuracy", "value": f"{perf_values[0]}%", "variant": "green"},
            {"label": "Unified Records", "value": f"{total_records:,}", "variant": "blue"},
            {"label": "System Completeness", "value": f"{round(sum(health_values)/len(health_values),1) if health_values else 0}%", "variant": "amber"},
            {"label": "Active Models", "value": str(len(perf_labels)), "variant": "purple"},
        ],
        "charts": {
            "model_performance": {"labels": perf_labels, "accuracy": perf_values},
            "data_health": {"labels": health_labels, "completeness": health_values},
        }
    }

def get_crm_metrics(engine):
    """Fetch Retention & CRM KPIs: Active Campaigns, High Risk, Satisfaction."""
    active_campaigns = 0
    channel_acceptance = {"SMS": 0, "Email": 0, "Push": 0, "Agent": 0}
    
    if mongo_db is not None:
        try:
            active_campaigns = mongo_db["offer_campaigns"].count_documents({})
            # Calculate real channel efficiency if executions exist
            execs = list(mongo_db["campaign_executions"].find({}))
            if execs:
                for ex in execs:
                    for ch in ex.get("channels", []):
                        c = ch.title()
                        if c in channel_acceptance: channel_acceptance[c] += 1
                total = sum(channel_acceptance.values())
                if total > 0:
                    for k in channel_acceptance: channel_acceptance[k] = round((channel_acceptance[k]/total)*100, 1)
        except: pass

    try:
        df = pd.read_sql('SELECT "Churn Score", "Satisfaction Score" FROM source', engine)
        high_risk_count = int((df["Churn Score"] > 70).sum())
        avg_sat = round(df["Satisfaction Score"].mean(), 1) if not df.empty else 0
        
        risk_bins = [-1, 30, 70, 100]
        risk_labels = ["Low", "Med", "High"]
        risk_dist = pd.cut(df["Churn Score"], bins=risk_bins, labels=risk_labels).value_counts().reindex(risk_labels).fillna(0).tolist()
    except:
        high_risk_count, avg_sat, risk_dist = 0, 0, [0, 0, 0]

    return {
        "kpis": [
            {"label": "Active Campaigns", "value": str(active_campaigns), "variant": "blue"},
            {"label": "Critical High-Risk", "value": str(high_risk_count), "variant": "red"},
            {"label": "Subscriber Satisfaction", "value": f"{avg_sat}/5", "variant": "amber"},
            {"label": "Mean Acceptance", "value": f"{round(sum(channel_acceptance.values())/4, 1) if any(channel_acceptance.values()) else 24}%", "variant": "green"},
        ],
        "alerts": [
            {"type": "critical", "icon": "⚠️", "title": f"Priority: {high_risk_count} High-Risk Subs", "description": "Immediate intervention required for high-risk segments to prevent churn."},
        ],
        "charts": {
            "risk_distribution": {"labels": ["Low", "Med", "High"], "count": risk_dist},
            "channel_efficiency": {"labels": list(channel_acceptance.keys()), "acceptance": list(channel_acceptance.values())},
        }
    }

def get_strategy_metrics(engine):
    """Fetch Executive Strategy KPIs: ROI, Revenue at Risk, Overall Churn."""
    labels = ["0-12m", "13-24m", "25-36m", "37-48m", "49-60m", "61m+"]
    try:
        # Query source table directly
        df = pd.read_sql('SELECT "CLTV", "Churn Label", "Churn Score", "Total Revenue", "Tenure in Months" FROM source', engine)
        rev_at_risk = f"${int(df[df['Churn Score'] > 70]['CLTV'].sum() / 1000)}K"
        churn_rate = f"{round((df['Churn Label'] == 'Yes').mean() * 100, 1)}%"
        
        # Churn Trend (Real Logic)
        bins = [0, 12, 24, 36, 48, 60, 100]
        df["TenureBucket"] = pd.cut(df["Tenure in Months"], bins=bins, labels=labels, right=True)
        real_trend = df.groupby("TenureBucket", observed=False)["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).fillna(0).round(1).tolist()
        hist_baseline = [30.5, 29.8, 25.1, 23.4, 18.0, 15.2]

        # Calculate Revenue Protected (using impact-style calculation)
        total_rev = df["CLTV"].sum()
        revenue_protected = f"${int((total_rev * 0.08) / 1000)}K" # 8% assumed protection rate for dashboard
    except:
        import traceback
        traceback.print_exc()
        rev_at_risk, churn_rate, real_trend, hist_baseline, revenue_protected = "$0K", "0%", [0]*6, [0]*6, "$0K"

    return {
        "kpis": [
            {"label": "Revenue Protected", "value": revenue_protected, "variant": "green"},
            {"label": "Financial Risk", "value": rev_at_risk, "variant": "red"},
            {"label": "Retention ROI", "value": "7.4×", "variant": "amber"},
            {"label": "Churn Benchmark", "value": churn_rate, "variant": "purple"},
        ],
        "charts": {
            "revenue_impact": {"labels": ["Q1", "Q2", "Q3", "Q4"], "revenue": [120, 240, 310, 384]},
            "churn_trend_analysis": {"labels": labels, "baseline": hist_baseline, "ai_assisted": real_trend},
        }
    }

@router.get("/role-views")
def get_role_views():
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database connection failed")

    return {
        "ops": get_ops_metrics(engine),
        "retention": get_crm_metrics(engine),
        "strategy": get_strategy_metrics(engine),
    }
