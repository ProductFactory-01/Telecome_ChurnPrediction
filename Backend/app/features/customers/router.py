from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from sqlalchemy import text
from app.database import get_db_engine

router = APIRouter()

@router.get("/customers")
async def get_customers(
    page: int = 1, 
    limit: int = 10, 
    search: str = "",
    churn: str = "",
    gender: str = "",
    city: str = ""
):
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        # Load only necessary columns from 'merged' for the list view
        cols = ['"Customer ID"', '"Name"', '"Gender"', '"Tenure in Months"', '"Churn Label"', '"City"']
        query = f"SELECT {', '.join(cols)} FROM merged"
        df = pd.read_sql(query, engine)
        
        # Clean column names (remove double quotes)
        df.columns = [c.replace('"', '').replace(' ', '_').lower() for c in df.columns]
        
        # Apply Search
        if search:
            df = df[df["name"].str.contains(search, case=False, na=False) | 
                    df["customer_id"].str.contains(search, case=False, na=False)]
        
        # Apply filters
        if churn:
            df = df[df["churn_label"] == churn]
        if gender:
            df = df[df["gender"] == gender]
        if city:
            df = df[df["city"].str.contains(city, case=False, na=False)]

        total = len(df)
        start = (page - 1) * limit
        df_slice = df.iloc[start:start+limit]
        
        # Map to frontend format
        customers = []
        for _, row in df_slice.iterrows():
            customers.append({
                "customer_id": row["customer_id"],
                "Name": row["name"],
                "gender": row["gender"],
                "tenure": row["tenure_in_months"],
                "churn_label": row["churn_label"],
                "city": row["city"]
            })

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "customers": customers,
        }
    except Exception as e:
        print(f"Error fetching customers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customers/{customer_id}")
async def get_customer_details(customer_id: str):
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        # Hybrid Join: Merged (Business) + Source (Extended Technical/AI)
        # We join on "Customer ID" to get ALL 88+ columns.
        query = text("""
            SELECT m.*, s.*
            FROM merged m
            LEFT JOIN source s ON m."Customer ID" = s."Customer ID"
            WHERE m."Customer ID" = :customer_id
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"customer_id": customer_id})
            row = result.fetchone()
            
            if not row:
                 raise HTTPException(status_code=404, detail="Customer not found")
            
            # Map Row to dict, handling potential duplicate column names from the * join
            data = {}
            for key, value in row._mapping.items():
                if key not in data or data[key] is None:
                    data[key] = value
            
            # Post-processing for JSON compatibility
            def clean_val(v):
                if isinstance(v, (np.integer, np.int64)): return int(v)
                if isinstance(v, (np.floating, np.float64)): return float(v)
                if pd.isna(v): return None
                return v

            return {k: clean_val(v) for k, v in data.items()}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error fetching detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))
