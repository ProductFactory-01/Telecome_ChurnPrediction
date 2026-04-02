from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from app.database import get_db_engine

router = APIRouter()

def clean_none(val):
    """Helper to convert nan to None for JSON serialization."""
    if pd.isna(val):
        return None
    return val

@router.get("/eda")
def get_eda_data():
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        # Load merged table data to pandas df for comprehensive aggregation
        # We only query the columns we need to optimize memory and speed
        cols_to_load = [
            '"Customer ID"', '"Gender"', '"Age"', '"Senior Citizen"', '"Referred a Friend"', 
            '"Tenure in Months"', '"Contract"', '"Payment Method"', '"Internet Service"', 
            '"Online Security"', '"Online Backup"', '"Device Protection Plan"', '"Premium Tech Support"', 
            '"Streaming TV"', '"Streaming Movies"', '"Monthly Charge"', '"CLTV"', 
            '"Satisfaction Score"', '"Churn Label"', '"Churn Category"', '"Churn Reason"'
        ]
        
        query = f"SELECT {', '.join(cols_to_load)} FROM merged"
        df = pd.read_sql(query, engine)
        
        # Clean column names to remove double quotes pandas might keep
        df.columns = [c.replace('"', '') for c in df.columns]
        
        total_subscribers = len(df)
        churned_df = df[df["Churn Label"] == "Yes"]
        stayed_df = df[df["Churn Label"] == "No"]
        
        churn_count = len(churned_df)
        churn_rate = round((churn_count / total_subscribers) * 100, 2) if total_subscribers else 0
        
        ###############################################
        # 1. CRM & Billing
        ###############################################
        avg_monthly_charges = round(df["Monthly Charge"].mean(), 2)
        avg_cltv = round(df["CLTV"].mean())
        
        # Monthly Charges Hist
        bins_charge = [18, 30, 45, 60, 75, 90, 105, 120]
        labels_charge = ["18-30", "30-45", "45-60", "60-75", "75-90", "90-105", "105-120"]
        
        stayed_charge_counts = pd.cut(stayed_df["Monthly Charge"], bins=bins_charge, labels=labels_charge, right=False).value_counts().reindex(labels_charge).fillna(0).tolist()
        churned_charge_counts = pd.cut(churned_df["Monthly Charge"], bins=bins_charge, labels=labels_charge, right=False).value_counts().reindex(labels_charge).fillna(0).tolist()
        
        # Churn by contract
        contract_counts = df.groupby("Contract")["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).round(1)
        contract_labels = contract_counts.index.tolist()
        contract_values = contract_counts.tolist()
        
        # Top Churn Reasons
        top_reasons = churned_df["Churn Reason"].value_counts().head(10)
        
        ###############################################
        # 2. Subscriber Intel
        ###############################################
        bins_age = [18, 25, 35, 45, 55, 65, 100]
        labels_age = ["18-25", "25-35", "35-45", "45-55", "55-65", "65+"]
        
        stayed_age_counts = pd.cut(stayed_df["Age"].dropna(), bins=bins_age, labels=labels_age, right=False).value_counts().reindex(labels_age).fillna(0).tolist()
        churned_age_counts = pd.cut(churned_df["Age"].dropna(), bins=bins_age, labels=labels_age, right=False).value_counts().reindex(labels_age).fillna(0).tolist()
        
        # Satisfaction
        scores = [1, 2, 3, 4, 5]
        stayed_sat = stayed_df["Satisfaction Score"].value_counts().reindex(scores).fillna(0).tolist()
        churned_sat = churned_df["Satisfaction Score"].value_counts().reindex(scores).fillna(0).tolist()
        
        # Churn Categories
        churn_cat = churned_df["Churn Category"].value_counts()
        
        # Referral
        ref_groups = df.groupby("Referred a Friend")["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).round(1)
        
        ###############################################
        # 3. Usage & Services
        ###############################################
        # Tenure vs Charges (Sampled 8 points over tenure binned)
        # We"ll use groupby tenure bins
        bins_tenure_s = [1, 5, 12, 24, 36, 48, 60, 73]
        bins_tenure_c = [1, 3, 6, 9, 12, 18, 24, 37]
        
        s_stayed = stayed_df.groupby(pd.cut(stayed_df["Tenure in Months"], bins=bins_tenure_s))["Monthly Charge"].mean().fillna(0).round(1)
        s_churned = churned_df.groupby(pd.cut(churned_df["Tenure in Months"], bins=bins_tenure_c))["Monthly Charge"].mean().fillna(0).round(1)
        
        stayed_x = [int(i.right) for i in s_stayed.index]
        stayed_y = s_stayed.tolist()
        churned_x = [int(i.right) for i in s_churned.index]
        churned_y = s_churned.tolist()
        
        # Service Churn Rates
        services = ["Online Security", "Online Backup", "Device Protection Plan", "Premium Tech Support", "Streaming TV", "Streaming Movies"]
        service_churn_labels = ["Online Security", "Online Backup", "Device Protection", "Tech Support", "Streaming TV", "Streaming Movies"]
        service_churn_vals = []
        for srv in services:
            # users who have the service
            users_with_service = df[df[srv] == "Yes"]
            rate = 0 if len(users_with_service) == 0 else (len(users_with_service[users_with_service["Churn Label"] == "Yes"]) / len(users_with_service)) * 100
            service_churn_vals.append(round(rate, 1))
            
        # Payment Method
        pay_churn = df.groupby("Payment Method")["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).round(1)
        
        # Internet
        int_churn = df.groupby("Internet Service")["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).round(1)

        result = {
            "crm_billing": {
                "kpis": {"subscribers": total_subscribers, "churn_rate": churn_rate, "avg_monthly_charges": avg_monthly_charges, "avg_cltv": avg_cltv},
                "churn_distribution": {"labels": ["No", "Yes"], "values": [len(stayed_df), churn_count]},
                "monthly_charges_hist": {
                    "bin_labels": labels_charge,
                    "stayed": stayed_charge_counts,
                    "churned": churned_charge_counts,
                },
                "churn_by_contract": {"labels": contract_labels, "values": contract_values},
                "top_churn_reasons": {
                    "labels": top_reasons.index.tolist(),
                    "values": top_reasons.tolist(),
                },
            },
            "complaints": {  # Placeholder as we don't have this table
                "kpis": {"total_tickets": 2224, "source": "Call Centre (Mock)"},
                "status_breakdown": {"labels": ["Closed", "Open", "Pending", "Solved", "In Progress"], "values": [890, 445, 334, 333, 222]},
                "volume_over_time": {"labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], "values": [180, 210, 350, 420, 380, 320]},
                "top_states": {"labels": ["California", "Texas", "Florida", "New York", "Illinois"], "values": [425, 312, 289, 245, 198]},
                "complaint_keywords": {
                    "labels": ["service", "speed", "billing", "internet", "connection", "data", "charge", "poor", "slow", "outage"],
                    "values": [340, 280, 250, 230, 210, 190, 170, 150, 130, 110],
                },
            },
            "subscriber_intel": {
                "age_distribution": {
                    "bin_labels": labels_age,
                    "stayed": stayed_age_counts,
                    "churned": churned_age_counts,
                },
                "satisfaction_distribution": {"scores": scores, "stayed": stayed_sat, "churned": churned_sat},
                "churn_categories": {
                    "labels": churn_cat.index.tolist(),
                    "values": churn_cat.tolist(),
                },
                "referral_churn": {"labels": ["Referred", "Not Referred"], "values": [ref_groups.get("Yes", 0), ref_groups.get("No", 0)]},
            },
            "usage_services": {
                "tenure_vs_charges": {
                    "stayed": {"x": stayed_x, "y": stayed_y},
                    "churned": {"x": churned_x, "y": churned_y},
                },
                "service_churn_rates": {
                    "labels": service_churn_labels,
                    "values": service_churn_vals,
                },
                "churn_by_payment": {
                    "labels": pay_churn.index.tolist(),
                    "values": pay_churn.tolist(),
                },
                "churn_by_internet": {
                    "labels": int_churn.index.tolist(),
                    "values": int_churn.tolist(),
                },
            },
        }

        # Convert numpy int/float types to native python for JSON response
        import json
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
