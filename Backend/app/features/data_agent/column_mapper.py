import os
import json
import difflib
from typing import List, Dict
from service.llm import get_groq_llm
from langchain_core.prompts import ChatPromptTemplate

# Define our canonical schema columns grouped by domain
SCHEMA_COLUMNS = {
    "demographics": [
        "Customer ID", "Gender", "Age", "Under 30", "Senior Citizen", 
        "Married", "Dependents", "Number of Dependents", "Name", "email", "mobile_number"
    ],
    "location": [
        "Location ID", "Country", "State", "City", "Zip Code", "Lat Long", "Latitude", "Longitude"
    ],
    "services": [
        "Service ID", "Quarter", "Referred a Friend", "Number of Referrals", 
        "Tenure in Months", "Offer", "Phone Service", "Avg Monthly Long Distance Charges", 
        "Multiple Lines", "Internet Service", "Internet Type", "Avg Monthly GB Download", 
        "Online Security", "Online Backup", "Device Protection Plan", "Premium Tech Support", 
        "Streaming TV", "Streaming Movies", "Streaming Music", "Unlimited Data", 
        "Contract", "Paperless Billing", "Payment Method", "Monthly Charge", "Total Charges", 
        "Total Refunds", "Total Extra Data Charges", "Total Long Distance Charges", "Total Revenue"
    ],
    "status": [
        "Status ID", "Satisfaction Score", "Customer Status", "Churn Label", 
        "Churn Value", "Churn Score", "CLTV", "Churn Category", "Churn Reason"
    ]
}

ALL_TARGET_COLUMNS = []
for cols in SCHEMA_COLUMNS.values():
    ALL_TARGET_COLUMNS.extend(cols)
# Remove duplicates (like Customer ID which is everywhere, but we only need to map it once)
ALL_TARGET_COLUMNS = list(set(ALL_TARGET_COLUMNS))

def fuzzy_match(user_col: str, target_cols: List[str], threshold: float = 0.8) -> str:
    """Fallback fuzzy string matching."""
    matches = difflib.get_close_matches(user_col.lower(), [c.lower() for c in target_cols], n=1, cutoff=threshold)
    if matches:
        # Find original case
        for original in target_cols:
            if original.lower() == matches[0]:
                return original
    return None

async def get_column_mapping(csv_columns: List[str]) -> Dict:
    """
    Uses Groq LLM with a highly semantic prompt to map user CSV columns 
    to our database schema.
    """
    try:
        llm = get_groq_llm()
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an expert Telecom Data Engineer. Your task is to perform high-precision "
                "semantic mapping of CSV columns to a canonical Telecom Churn database schema. "
                "\n\n### MAPPING RULES ###\n"
                "1. If a column is a perfect semantic match, map it (e.g., 'Sex' maps to 'Gender').\n"
                "2. If a column is an alias for a subscriber detail, map it (e.g., 'Client Name' maps to 'Name').\n"
                "3. If a column represents a service field, map it (e.g., 'WebType' maps to 'Internet Type').\n"
                "4. If a column is a duplicate of a previously mapped field, map it to null.\n"
                "5. If a column has NO logical place in the schema, map it to null.\n"
                "\n\n### EXAMPLES (FEW-SHOT) ###\n"
                "- 'SubscriberID' -> 'Customer ID'\n"
                "- 'Client Name' -> 'Name'\n"
                "- 'MailAddress' -> 'email'\n"
                "- 'Sex' -> 'Gender'\n"
                "- 'GrandTotal' -> 'Total Charges'\n"
                "- 'MonthlyFee' -> 'Monthly Charge'\n"
                "- 'AgreementType' -> 'Contract'\n"
                "- 'LocationCity' -> 'City'\n"
                "\n\nReturn ONLY a clean JSON object where keys are the input CSV columns and values are the mapped target columns or null."
            )),
            ("user", (
                "Input CSV Columns: {csv_cols}\n\n"
                "Target Schema Columns: {target_cols}"
            ))
        ])
        
        chain = prompt | llm
        response = await chain.ainvoke({
            "csv_cols": ", ".join(csv_columns),
            "target_cols": ", ".join(ALL_TARGET_COLUMNS)
        })
        
        # Parse JSON response
        content = response.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        mapping = json.loads(content)
        
        # Clean up and ensure mapping is valid
        final_mapping = {}
        for k, v in mapping.items():
            if not v: # Explicit null/ignore
                final_mapping[k] = None
            elif v in ALL_TARGET_COLUMNS:
                final_mapping[k] = v
            else:
                # If AI suggested something slightly off, use fuzzy matching on the SUGGESTION
                match = fuzzy_match(v, ALL_TARGET_COLUMNS, threshold=0.6)
                final_mapping[k] = match
                    
        return final_mapping
        
    except Exception as e:
        print(f"AI Column Mapping error: {e}. Falling back to fuzzy matching.")
        # Fallback to fuzzy matching
        fallback = {}
        for col in csv_columns:
            match = fuzzy_match(col, ALL_TARGET_COLUMNS)
            if match:
                fallback[col] = match
        return fallback

def classify_columns_to_tables(mapping: Dict) -> Dict:
    """Groups mapped columns by their target table."""
    assignment = {table: [] for table in SCHEMA_COLUMNS.keys()}
    
    for user_col, target_col in mapping.items():
        if not target_col: continue
        
        # Find which table this column belongs to
        assigned = False
        for table, cols in SCHEMA_COLUMNS.items():
            if target_col in cols:
                assignment[table].append(user_col)
                assigned = True
                break
                
    return {k: v for k, v in assignment.items() if v}
