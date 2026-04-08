import pandas as pd
from typing import List, Dict, Tuple
from sqlalchemy import text

MANDATORY_ML_FIELDS = [
    "Gender", "Senior Citizen", "Married", "Dependents", "Tenure in Months",
    "Phone Service", "Multiple Lines", "Internet Service", "Online Security",
    "Online Backup", "Device Protection Plan", "Premium Tech Support", "Streaming TV",
    "Streaming Movies", "Contract", "Paperless Billing", "Payment Method",
    "Monthly Charge", "Total Charges", "Latitude", "Longitude"
]

def validate_csv_structure(df: pd.DataFrame, mapping: Dict) -> List[str]:
    """Checks if basic requirements like Customer ID are met."""
    errors = []
    
    # Check if 'Customer ID' is mapped
    customer_id_col = None
    for user_col, target_col in mapping.items():
        if target_col == "Customer ID":
            customer_id_col = user_col
            break
            
    if not customer_id_col:
        errors.append("Critical: 'Customer ID' column not mapped. Cannot identify subscribers.")
        
    return errors

def check_duplicates(df: pd.DataFrame, mapping: Dict, engine) -> Tuple[pd.DataFrame, List[Dict]]:
    """
    Checks each row for existing Customer ID in the database.
    Returns the DataFrame with 'is_duplicate' flag and logs.
    """
    logs = []
    
    # Find the user's column that maps to 'Customer ID'
    customer_id_col = next((k for k, v in mapping.items() if v == "Customer ID"), None)
    if not customer_id_col:
        return df, [{"time": "ERROR", "tag": "warn", "message": "No Customer ID mapping found."}]
        
    customer_ids = df[customer_id_col].dropna().unique().tolist()
    if not customer_ids:
        return df, [{"time": "INFO", "tag": "info", "message": "No Customer IDs found in CSV."}]
        
    # Query existing IDs
    placeholders = ", ".join(["%s"] * len(customer_ids))
    query = f'SELECT "Customer ID" FROM source WHERE "Customer ID" IN ({placeholders})'
    try:
        existing_ids = pd.read_sql(query, engine, params=tuple(customer_ids))["Customer ID"].tolist()
    except Exception as e:
        print(f"Error checking duplicates: {e}")
        existing_ids = []
        
    df['is_duplicate'] = df[customer_id_col].isin(existing_ids)
    
    dup_count = df['is_duplicate'].sum()
    if dup_count > 0:
        logs.append({
            "tag": "warn", 
            "message": f"Found {dup_count} existing subscriber(s) — they will be updated/skipped based on confirmation."
        })
    else:
        logs.append({
            "tag": "ok",
            "message": "All subscriber IDs are new — ready for fresh ingestion."
        })
        
    return df, logs

def validate_ml_readiness(mapping: Dict) -> Tuple[bool, List[str]]:
    """Checks if all mandatory fields for churn prediction are present in the mapping."""
    mapped_targets = list(mapping.values())
    missing = [f for f in MANDATORY_ML_FIELDS if f not in mapped_targets]
    
    if not missing:
        return True, []
    else:
        return False, missing

def validate_row_readiness(df: pd.DataFrame, mapping: Dict) -> pd.DataFrame:
    """
    Checks each row for completeness. 
    Adds 'is_valid' and 'rejection_reason' columns.
    """
    # 1. Identify which CSV columns correspond to mandatory fields
    reverse_mapping = {v: k for k, v in mapping.items()}
    mandatory_user_cols = {f: reverse_mapping.get(f) for f in MANDATORY_ML_FIELDS}
    
    def check_row(row):
        missing_fields = []
        for field, user_col in mandatory_user_cols.items():
            if not user_col or pd.isna(row.get(user_col)) or str(row.get(user_col)).strip() == "":
                missing_fields.append(field)
        
        if missing_fields:
            return False, f"Missing: {', '.join(missing_fields)}"
        return True, ""

    results = df.apply(check_row, axis=1)
    df['is_valid'] = [r[0] for r in results]
    df['rejection_reason'] = [r[1] for r in results]
    
    return df
