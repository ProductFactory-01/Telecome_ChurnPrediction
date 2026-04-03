from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from app.database import get_db_engine

router = APIRouter()

@router.get("/data-agent")
def get_data_agent():
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        # 1. Get Record Counts for each Source Table
        tables = {
            "demographics": ("👤", "Demographics", "Age, Gender, Name, Email, Dependents"),
            "location": ("🌍", "Location Info", "City, State, Zip, Lat/Long, Population"),
            "population": ("👥", "Market Data", "Zip-level localized population stats"),
            "services": ("📡", "Services & Billing", "Plan, Internet, Phone, Charges, Contract"),
            "status": ("📋", "System Status", "Satisfaction, Label, Status, Reason"),
            "Churn_New": ("🎯", "AI Churn Scoring", "Updated Intelligence & AI Categories")
        }

        sources = []
        for table_name, (icon, title, desc) in tables.items():
            count_q = f'SELECT COUNT(*) FROM "{table_name}"'
            count = pd.read_sql(count_q, engine).iloc[0, 0]
            sources.append({
                "key": table_name,
                "icon": icon,
                "title": title,
                "description": desc,
                "records": int(count),
                "active": True
            })

        # 2. Calculate KPIs and Per-Source Completeness from 'merged'
        domain_columns = {
            "demographics": ["Name", "email", "Gender", "Age"],
            "location": ["City", "State", "Zip Code", "Latitude", "Longitude"],
            "population": ["population"], # Population linked via Zip
            "services": ["Phone Service", "Internet Service", "Contract", "Monthly Charge"],
            "status": ["Satisfaction Score", "Customer Status", "Churn Label"],
            "Churn_New": ["Churn Score", "CLTV"]
        }
        
        all_cols = []
        for cols in domain_columns.values():
            all_cols.extend(cols)
        columns_quoted = ", ".join([f'"{c}"' for c in all_cols])
        df_merged = pd.read_sql(f'SELECT "Customer ID", {columns_quoted} FROM merged', engine)
        
        total_rows = len(df_merged)
        unique_subs = df_merged["Customer ID"].nunique()
        
        sources = []
        for table_name, (icon, title, desc) in tables.items():
            count_q = f'SELECT COUNT(*) FROM "{table_name}"'
            count = pd.read_sql(count_q, engine).iloc[0, 0]
            
            # Calculate completeness for this domain
            cols = domain_columns.get(table_name, [])
            if cols and total_rows > 0:
                domain_points = df_merged[cols].notna().sum().sum()
                domain_max = total_rows * len(cols)
                completeness = round((domain_points / domain_max) * 100, 1)
            else:
                completeness = 100.0 if table_name != "Churn_New" else 0.0 # Fallback
                
            sources.append({
                "key": table_name,
                "icon": icon,
                "title": title,
                "description": desc,
                "records": int(count),
                "completeness": completeness,
                "active": True
            })

        # Global KPIs
        max_points = total_rows * len(all_cols)
        actual_points = df_merged[all_cols].notna().sum().sum()
        completeness_pct = round((actual_points / max_points) * 100, 1) if max_points > 0 else 0

        kpis = {
            "sources_connected": len(sources),
            "records_unified": int(actual_points),
            "merge_completeness": completeness_pct,
            "unique_subscribers": int(unique_subs),
        }

        return {"sources": sources, "kpis": kpis}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
