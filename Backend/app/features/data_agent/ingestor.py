import pandas as pd
import numpy as np
from sqlalchemy import text
from typing import List, Dict, Any
from app.features.churn_scoring.predictor import predict_churn
from app.features.churn_scoring.schemas import CustomerInput

# Table Name to Schema Columns Mapping
TABLE_COLUMNS = {
    "demographics": [
        "Customer ID", "Count", "Gender", "Age", "Under 30", "Senior Citizen", 
        "Married", "Dependents", "Number of Dependents", "Name", "email", "mobile_number"
    ],
    "location": [
        "Location ID", "Customer ID", "Count", "Country", "State", "City", 
        "Zip Code", "Lat Long", "Latitude", "Longitude"
    ],
    "services": [
        "Service ID", "Customer ID", "Count", "Quarter", "Referred a Friend", 
        "Number of Referrals", "Tenure in Months", "Offer", "Phone Service", 
        "Avg Monthly Long Distance Charges", "Multiple Lines", "Internet Service", 
        "Internet Type", "Avg Monthly GB Download", "Online Security", "Online Backup", 
        "Device Protection Plan", "Premium Tech Support", "Streaming TV", 
        "Streaming Movies", "Streaming Music", "Unlimited Data", "Contract", 
        "Paperless Billing", "Payment Method", "Monthly Charge", "Total Charges", 
        "Total Refunds", "Total Extra Data Charges", "Total Long Distance Charges", "Total Revenue"
    ],
    "status": [
        "Status ID", "Customer ID", "Count", "Quarter", "Satisfaction Score", 
        "Customer Status", "Churn Label", "Churn Value", "Churn Score", 
        "CLTV", "Churn Category", "Churn Reason"
    ]
}
def clean_value(val, col_name: str):
    """Cleans and standardizes values for the database, handling numeric vs boolean types correctly."""
    if pd.isna(val) or val == "":
        if col_name == "Count": return 1
        return None
        
    s_val = str(val).strip()
    
    # 1. Identify if target column is strictly numeric
    numeric_columns = [
        "Count", "Age", "Number of Dependents", "Tenure in Months", 
        "Number of Referrals", "Avg Monthly Long Distance Charges", 
        "Avg Monthly GB Download", "Monthly Charge", "Total Charges", 
        "Total Refunds", "Total Extra Data Charges", "Total Long Distance Charges", 
        "Total Revenue", "Satisfaction Score", "Churn Value", "Churn Score", "CLTV",
        "Latitude", "Longitude", "population", "Population"
    ]
    is_numeric_target = col_name in numeric_columns

    # 2. Try numeric parsing first
    try:
        if "." in s_val: num_val = float(s_val)
        else: num_val = int(s_val)
        
        # If it's a numeric target, always return the number
        if is_numeric_target:
            return num_val
            
        # If it's (0, 1) and NOT a numeric target, convert to Yes/No for string-based DB columns
        if not is_numeric_target and num_val in [0, 1, 0.0, 1.0]:
            return "Yes" if num_val == 1 else "No"
            
        return num_val
    except:
        # 3. Handle non-numeric strings
        if s_val.lower() in ['yes', 'true']: return "Yes"
        if s_val.lower() in ['no', 'false']: return "No"
        
        # If we got "Yes" but it's a numeric target, we have a mapping issue, 
        # but we should at least avoid crashing if possible or return 0
        if is_numeric_target:
            return 0 if s_val.lower() in ['no', 'false'] else 1
            
        return s_val

def ingest_data(df: pd.DataFrame, mapping: Dict[str, str], engine) -> Dict[str, Any]:
    """Inserts data into multiple tables based on column mappings."""
    # 1. Filter out invalid rows (missing mandatory fields OR already existing in DB)
    is_valid = df.get('is_valid', True)
    is_duplicate = df.get('is_duplicate', False)
    
    # We reject any row that is either invalid or a duplicate
    valid_df = df[is_valid & ~is_duplicate].copy()
    
    rejected_count = len(df) - len(valid_df)
    rejected_invalid = (~is_valid).sum()
    rejected_duplicate = (is_valid & is_duplicate).sum()
    
    if valid_df.empty:
        return {
            "new_customers": [], 
            "rejected_count": int(rejected_count), 
            "rejected_invalid": int(rejected_invalid),
            "rejected_duplicate": int(rejected_duplicate),
            "error": "No new valid rows to ingest" if rejected_count > 0 else "File is empty"
        }

    # Find the user's Customer ID column
    customer_id_col = next((k for k, v in mapping.items() if v == "Customer ID"), None)
    if not customer_id_col:
        return {"error": "Customer ID mapping missing"}
    
    customer_ids = valid_df[customer_id_col].dropna().unique().tolist()
    
    # 2. Iterate through segments/tables and UPSERT
    with engine.begin() as conn:
        for table_name, schema_cols in TABLE_COLUMNS.items():
            table_mapping = {user_col: target_col for user_col, target_col in mapping.items() if target_col in schema_cols}
            
            # Ensure Customer ID is always included
            if customer_id_col not in table_mapping:
                table_mapping[customer_id_col] = "Customer ID"
            
            records = []
            for _, row in valid_df.iterrows():
                record = {}
                for col in schema_cols:
                    if col == "Count": record[col] = 1
                    elif "ID" in col and col != "Customer ID":
                        record[col] = f"AG-{table_name[:3]}-{row[customer_id_col]}"
                    else: record[col] = None
                
                for user_col, target_col in table_mapping.items():
                    record[target_col] = clean_value(row[user_col], target_col)
                records.append(record)

            if not records: continue

            # Postgres UPSERT SQL
            cols_escaped = [f'"{c}"' for c in schema_cols]
            placeholders = [f":{c.replace(' ', '_')}" for c in schema_cols]
            update_cols = [c for c in schema_cols if c != "Customer ID"]
            update_clause = ", ".join([f'"{c}" = EXCLUDED."{c}"' for c in update_cols])
            
            sql = f"""
                INSERT INTO "{table_name}" ({", ".join(cols_escaped)})
                VALUES ({", ".join(placeholders)})
                ON CONFLICT ("Customer ID") DO UPDATE SET
                {update_clause}
            """
            
            for rec in records:
                params = {k.replace(' ', '_'): v for k, v in rec.items()}
                conn.execute(text(sql), params)
                
    return {
        "new_customers": customer_ids, 
        "rejected_count": int(rejected_count),
        "rejected_invalid": int(rejected_invalid),
        "rejected_duplicate": int(rejected_duplicate)
    }

def update_merged_table(customer_ids: List[str], engine):
    """
    Synchronizes the 'merged' table for the given set of Customer IDs.
    This usually involves a complex JOIN or a REFRESH if it's a view.
    Since we are told all tables combined into 'merged', we will perform a SQL script to sync.
    """
    # Simple strategy: Delete from merged and re-insert by joining all tables
    # Note: Double quotes are needed for table names with spaces or cases
    id_list = ", ".join([f"'{cid}'" for cid in customer_ids])
    
    with engine.begin() as conn:
        # Delete existing entries from merged for these customers
        conn.execute(text(f"DELETE FROM merged WHERE \"Customer ID\" IN ({id_list})"))
        
        # Insert joined records
        join_query = f"""
        INSERT INTO merged ("Customer ID", "Gender", "Age", "Under 30", "Senior Citizen", "Married", "Dependents", "Number of Dependents", "Name", "email", "mobile_number", "Country", "State", "City", "Zip Code", "Latitude", "Longitude", "population", "Quarter", "Referred a Friend", "Number of Referrals", "Tenure in Months", "Offer", "Phone Service", "Avg Monthly Long Distance Charges", "Multiple Lines", "Internet Service", "Internet Type", "Avg Monthly GB Download", "Online Security", "Online Backup", "Device Protection Plan", "Premium Tech Support", "Streaming TV", "Streaming Movies", "Streaming Music", "Unlimited Data", "Contract", "Paperless Billing", "Payment Method", "Monthly Charge", "Total Charges", "Total Refunds", "Total Extra Data Charges", "Total Long Distance Charges", "Total Revenue", "Satisfaction Score", "Customer Status", "Churn Label", "Churn Value", "Churn Score", "CLTV", "Churn Category", "Churn Reason")
        SELECT 
            d."Customer ID", d."Gender", d."Age", d."Under 30", d."Senior Citizen", d."Married", d."Dependents", d."Number of Dependents", d."Name", d."email", d."mobile_number", 
            l."Country", l."State", l."City", l."Zip Code", l."Latitude", l."Longitude", 
            CAST(REPLACE(REPLACE(p."Population", ',', ''), ' ', '') AS INTEGER), 
            s."Quarter", s."Referred a Friend", s."Number of Referrals", s."Tenure in Months", s."Offer", s."Phone Service", s."Avg Monthly Long Distance Charges", s."Multiple Lines", s."Internet Service", s."Internet Type", s."Avg Monthly GB Download", s."Online Security", s."Online Backup", s."Device Protection Plan", s."Premium Tech Support", s."Streaming TV", s."Streaming Movies", s."Streaming Music", s."Unlimited Data", s."Contract", s."Paperless Billing", s."Payment Method", s."Monthly Charge", s."Total Charges", s."Total Refunds", s."Total Extra Data Charges", s."Total Long Distance Charges", s."Total Revenue",
            st."Satisfaction Score", st."Customer Status", st."Churn Label", st."Churn Value", st."Churn Score", st."CLTV", st."Churn Category", st."Churn Reason"
        FROM demographics d
        LEFT JOIN location l ON d."Customer ID" = l."Customer ID"
        LEFT JOIN population p ON l."Zip Code" = p."Zip Code"
        LEFT JOIN services s ON d."Customer ID" = s."Customer ID"
        LEFT JOIN status st ON d."Customer ID" = st."Customer ID"
        WHERE d."Customer ID" IN ({id_list})
        """
        conn.execute(text(join_query))

def run_churn_predictions(customer_ids: List[str], engine):
    """
    Runs predictions on new customers and stores the results in Churn_New, status, and merged.
    """
    if not customer_ids:
        return []
        
    # CRITICAL: Sync merged table FIRST so we can query unified data for prediction
    update_merged_table(customer_ids, engine)
    
    id_list = ", ".join([f"'{cid}'" for cid in customer_ids])
    query = f"SELECT * FROM merged WHERE \"Customer ID\" IN ({id_list})"
    df = pd.read_sql(query, engine)
    
    results = []
    for _, row in df.iterrows():
        try:
            # Map database columns to CustomerInput schema (which uses different field names in some cases)
            # From schemas.py: Gender, SeniorCitizen, Partner, Dependents, TenureMonths, etc.
            # From merged: "Gender", "Senior Citizen", "Married", "Dependents", "Tenure in Months", etc.
            
            customer_data = CustomerInput(
                Gender=row.get("Gender", "Male"),
                SeniorCitizen=bool(row.get("Senior Citizen", "No") == "Yes" or row.get("Senior Citizen", 0) == 1),
                Partner=bool(row.get("Married", "No") == "Yes"),
                Dependents=bool(row.get("Dependents", "No") == "Yes"),
                TenureMonths=int(row.get("Tenure in Months", 0)),
                PhoneService=bool(row.get("Phone Service", "No") == "Yes"),
                MultipleLines=bool(row.get("Multiple Lines", "No") == "Yes"),
                InternetService=row.get("Internet Service", "No"),
                OnlineSecurity=bool(row.get("Online Security", "No") == "Yes"),
                OnlineBackup=bool(row.get("Online Backup", "No") == "Yes"),
                DeviceProtection=bool(row.get("Device Protection Plan", "No") == "Yes"),
                TechSupport=bool(row.get("Premium Tech Support", "No") == "Yes"),
                StreamingTV=bool(row.get("Streaming TV", "No") == "Yes"),
                StreamingMovies=bool(row.get("Streaming Movies", "No") == "Yes"),
                Contract=row.get("Contract", "Month-to-month"),
                PaperlessBilling=bool(row.get("Paperless Billing", "No") == "Yes"),
                PaymentMethod=row.get("Payment Method", "Bank withdrawal"),
                MonthlyCharges=float(row.get("Monthly Charge", 0)),
                TotalCharges=float(row.get("Total Charges", 0)),
                Latitude=float(row.get("Latitude", 13.0827)),
                Longitude=float(row.get("Longitude", 80.2707))
            )
            
            prediction = predict_churn(customer_data)
            
            # Store in database
            reason = prediction["churn_reason"]
            
            with engine.begin() as conn:
                # Update status table
                conn.execute(text(f"""
                    UPDATE status 
                    SET "Churn Score" = :score, 
                        "Churn Category" = :main, 
                        "Churn Reason" = :reason,
                        "Churn Value" = :val,
                        "Churn Label" = :label
                    WHERE "Customer ID" = :cid
                """), {
                    "score": int(prediction["churn_probability"] * 100),
                    "main": reason.get("main_category"),
                    "reason": reason.get("reason"),
                    "val": prediction["churn_prediction"],
                    "label": "Yes" if prediction["churn_prediction"] == 1 else "No",
                    "cid": row["Customer ID"]
                })
                
                # Update Churn_New table
                # Ensure existing row or insert
                conn.execute(text(f"DELETE FROM \"Churn_New\" WHERE \"CustomerID\" = :cid"), {"cid": row["Customer ID"]})
                
                # Map columns for Churn_New based on user provided 7. Churn_new
                churn_new_data = {
                    "CustomerID": row["Customer ID"],
                    "Count": 1,
                    "Country": row.get("Country", "United States"),
                    "State": row.get("State", "California"),
                    "City": row.get("City"),
                    "Zip Code": row.get("Zip Code"),
                    "Lat Long": f"{row.get('Latitude')}, {row.get('Longitude')}",
                    "Latitude": row.get("Latitude"),
                    "Longitude": row.get("Longitude"),
                    "Gender": row.get("Gender"),
                    "Senior Citizen": row.get("Senior Citizen"),
                    "Partner": row.get("Married"),
                    "Dependents": row.get("Dependents"),
                    "Tenure Months": row.get("Tenure in Months"),
                    "Phone Service": row.get("Phone Service"),
                    "Multiple Lines": row.get("Multiple Lines"),
                    "Internet Service": row.get("Internet Service"),
                    "Online Security": row.get("Online Security"),
                    "Online Backup": row.get("Online Backup"),
                    "Device Protection": row.get("Device Protection Plan"),
                    "Tech Support": row.get("Premium Tech Support"),
                    "Streaming TV": row.get("Streaming TV"),
                    "Streaming Movies": row.get("Streaming Movies"),
                    "Contract": row.get("Contract"),
                    "Paperless Billing": row.get("Paperless Billing"),
                    "Payment Method": row.get("Payment Method"),
                    "Monthly Charges": row.get("Monthly Charge"),
                    "Total Charges": row.get("Total Charges"),
                    "Churn Label": "Yes" if prediction["churn_prediction"] == 1 else "No",
                    "Churn Value": prediction["churn_prediction"],
                    "Churn Score": int(prediction["churn_probability"] * 100),
                    "CLTV": row.get("CLTV", 0),
                    "Reason": reason.get("reason"),
                    "Main Category": reason.get("main_category"),
                    "Sub Category": reason.get("sub_category")
                }
                
                # Dynamic insert with sanitized placeholders
                sanitized_data = {k.replace(' ', '_'): v for k, v in churn_new_data.items()}
                cols = ", ".join([f'"{k}"' for k in churn_new_data.keys()])
                vals = ", ".join([f":{k.replace(' ', '_')}" for k in churn_new_data.keys()])
                conn.execute(text(f"INSERT INTO \"Churn_New\" ({cols}) VALUES ({vals})"), sanitized_data)
                
            results.append({"customer_id": row["Customer ID"], "status": "success"})
            
        except Exception as e:
            print(f"Error predicting for {row['Customer ID']}: {e}")
            results.append({"customer_id": row["Customer ID"], "status": "error", "message": str(e)})
            
    # Final sync to merged after updating status & Churn_New
    update_merged_table(customer_ids, engine)
    return results
