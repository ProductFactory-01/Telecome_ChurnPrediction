from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
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
        # Load only necessary columns for the list view
        cols = ['"Customer ID"', '"Name"', '"Gender"', '"Tenure in Months"', '"Churn Label"', '"City"']
        query = f"SELECT {', '.join(cols)} FROM merged"
        df = pd.read_sql(query, engine)
        
        # Clean column names (remove double quotes)
        df.columns = [c.replace('"', '').replace(' ', '_').lower() for c in df.columns]
        # Resulting cols: customer_id, name, gender, tenure_in_months, churn_label, city
        
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
        # Query entire row for the detail view
        query = f"SELECT * FROM merged WHERE \"Customer ID\" = '{customer_id}'"
        df = pd.read_sql(query, engine)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        return df.iloc[0].to_dict()
    except Exception as e:
        print(f"Error fetching detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))
