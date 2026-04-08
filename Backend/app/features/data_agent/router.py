from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from pydantic import BaseModel
import pandas as pd
import numpy as np
import io
import datetime
from app.database import get_db_engine
from .column_mapper import get_column_mapping, classify_columns_to_tables
from .validator import validate_csv_structure, check_duplicates, validate_ml_readiness, validate_row_readiness
from .temp_storage import store_session, get_session, clear_session
from .ingestor import ingest_data, run_churn_predictions

class IngestRequest(BaseModel):
    session_id: str
    mapping: dict

router = APIRouter(prefix="/data-agent")

@router.get("")
def get_data_agent():
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        # 1. Get Record Counts for each Source Table
        tables = {
            "demographics": ("👤", "Demographics", "Subscriber profiles and details"),
            "location": ("🌍", "Location Info", "Geographic and population insights"),
            "population": ("👥", "Population Data", "Localized census"),
            "services": ("📡", "Services & Billing", "Plans, charges, and contract records"),
            "status": ("📋", "System Status", "Experience metrics and outcomes"),
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
        }
        
        all_cols = []
        for cols in domain_columns.values():
            all_cols.extend(cols)
        columns_quoted = ", ".join([f'"{c}"' for c in all_cols])
        df_source = pd.read_sql(f'SELECT "Customer ID", {columns_quoted} FROM source', engine)
        
        total_rows = len(df_source)
        unique_subs = df_source["Customer ID"].nunique()
        
        sources = []
        for table_name, (icon, title, desc) in tables.items():
            count_q = f'SELECT COUNT(*) FROM "{table_name}"'
            count = pd.read_sql(count_q, engine).iloc[0, 0]
            
            # Calculate completeness for this domain
            cols = domain_columns.get(table_name, [])
            if cols and total_rows > 0:
                domain_points = df_source[cols].notna().sum().sum()
                domain_max = total_rows * len(cols)
                completeness = round((domain_points / domain_max) * 100, 1)
            else:
                completeness = 100.0 # Fallback
                
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
        actual_points = df_source[all_cols].notna().sum().sum()
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

@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Step 1: Upload CSV, get AI mapping, and check for duplicates."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    engine = get_db_engine()
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")
        
    # 1. Get AI mapping
    csv_cols = df.columns.tolist()
    sample_data = df.head(5).to_dict(orient='records')
    mapping = await get_column_mapping(csv_cols, sample_data)
    
    # 2. Check for duplicates and validate structure
    structure_errors = validate_csv_structure(df, mapping)
    df_with_dupes, validation_logs = check_duplicates(df, mapping, engine)
    
    # 3. Check row-level readiness (New Check)
    df_with_valid = validate_row_readiness(df_with_dupes, mapping)
    
    # 4. Check ML readiness (Global Mapping Check)
    is_ready_for_ml, missing_fields = validate_ml_readiness(mapping)
    
    # 5. Store session
    session_id = store_session(df_with_valid)
    
    # 6. Prepare preview (first 10 rows)
    preview_data = []
    # Replace NaN with None for JSON compliance
    df_clean = df_with_valid.replace({np.nan: None})
    for _, row in df_clean.head(10).iterrows():
        row_dict = row.to_dict()
        preview_data.append({
            "row_data": row_dict,
            "is_duplicate": bool(row.get("is_duplicate", False)),
            "is_valid": bool(row.get("is_valid", True)),
            "rejection_reason": row.get("rejection_reason", "")
        })
        
    return {
        "session_id": session_id,
        "filename": file.filename,
        "total_rows": len(df),
        "columns": csv_cols,
        "mapping": mapping,
        "table_assignment": classify_columns_to_tables(mapping),
        "structure_errors": structure_errors,
        "validation_logs": validation_logs,
        "ml_readiness": {
            "is_ready": is_ready_for_ml,
            "missing_fields": missing_fields
        },
        "preview": preview_data,
        "null_counts": df.isnull().sum().to_dict()
    }

@router.post("/confirm-ingest")
async def ingest_csv(payload: IngestRequest):
    """Step 2: Confirm mapping and ingest data into database."""
    session_id = payload.session_id
    confirmed_mapping = payload.mapping
    
    if not session_id or not confirmed_mapping:
        raise HTTPException(status_code=400, detail="Missing session_id or mapping confirmation.")
        
    df = get_session(session_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Session expired or not found. Please upload again.")
        
    engine = get_db_engine()
    
    try:
        agent_logs = []
        now_str = datetime.datetime.now().strftime("%H:%M:%S")
        
        # 1. Ingest into multiple tables
        agent_logs.append({"time": now_str, "tag": "info", "message": f"Starting ingestion for {len(df)} rows..."})
        ingest_result = ingest_data(df, confirmed_mapping, engine)
        
        if "error" in ingest_result:
            if ingest_result["error"] == "No new valid rows to ingest":
                # Handle gracefully: send back summary with zero inserted but 100% rejection reason
                agent_logs.append({
                    "time": now_str, 
                    "tag": "warn", 
                    "message": "Ingestion skipped: 100% of records were either duplicates or invalid."
                })
                return {
                    "status": "skipped",
                    "summary": {
                        "total_rows": len(df),
                        "inserted": 0,
                        "rejected": ingest_result.get("rejected_count", 0),
                        "predictions_run": 0,
                        "risk_breakdown": {"high": 0, "medium": 0, "low": 0}
                    },
                    "agent_logs": agent_logs
                }
            raise Exception(ingest_result["error"])
            
        new_ids = ingest_result["new_customers"]
        rej_count = ingest_result.get("rejected_count", 0)
        rej_invalid = ingest_result.get("rejected_invalid", 0)
        rej_duplicate = ingest_result.get("rejected_duplicate", 0)
        
        if rej_count > 0:
            reasons = []
            if rej_invalid > 0: reasons.append(f"{rej_invalid} incomplete (missing mandatory fields)")
            if rej_duplicate > 0: reasons.append(f"{rej_duplicate} duplicates (already exist)")
            
            agent_logs.append({
                "time": now_str, 
                "tag": "warn", 
                "message": f"Rejected {rej_count} record(s) — {', '.join(reasons)}."
            })
            
        agent_logs.append({"time": datetime.datetime.now().strftime("%H:%M:%S"), "tag": "ok", "message": f"Data processed for target tables — {len(new_ids)} record(s) stored."})
        
        # 2. Run Churn Predictions
        # Global check if mapping was complete
        is_mapping_complete, _ = validate_ml_readiness(confirmed_mapping)
        prediction_summary = {"high": 0, "medium": 0, "low": 0}
        
        if is_mapping_complete and new_ids:
            agent_logs.append({"time": datetime.datetime.now().strftime("%H:%M:%S"), "tag": "info", "message": "Running AI Churn Prediction on new subscribers..."})
            prediction_results = run_churn_predictions(new_ids, engine)
            
            # Aggregate summary
            # We'll need to fetch the risk levels for the newly predicted ones
            placeholders = ", ".join(["%s"] * len(new_ids))
            score_query = f'SELECT "Churn Score" FROM status WHERE "Customer ID" IN ({placeholders})'
            results_df = pd.read_sql(score_query, engine, params=tuple(new_ids))
            for score in results_df["Churn Score"].fillna(0):
                if score >= 50: prediction_summary["high"] += 1
                else: prediction_summary["low"] += 1
                
            agent_logs.append({"time": datetime.datetime.now().strftime("%H:%M:%S"), "tag": "ok", "message": f"Churn scoring complete — {len(new_ids)} subscriber(s) processed."})
        else:
            agent_logs.append({"time": datetime.datetime.now().strftime("%H:%M:%S"), "tag": "warn", "message": "Skipping churn prediction due to missing mandatory fields or empty set."})
            
        # Cleanup
        clear_session(session_id)
        
        return {
            "status": "success",
            "summary": {
                "total_rows": len(df),
                "inserted": len(new_ids),
                "rejected": rej_count,
                "predictions_run": len(new_ids) if is_mapping_complete else 0,
                "risk_breakdown": prediction_summary
            },
            "agent_logs": agent_logs
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
