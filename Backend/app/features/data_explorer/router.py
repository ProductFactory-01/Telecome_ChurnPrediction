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
            '"Satisfaction Score"', '"Churn Label"', '"Churn Category"', '"Churn Reason"', '"State"', '"City"',
            '"Number of Referrals"', '"Married"', '"Avg Monthly GB Download"', '"Unlimited Data"', '"Internet Type"'
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
        
        # Churn by contract (Count of churned vs stayed per contract)
        contract_data = df.groupby(["Contract", "Churn Label"]).size().unstack(fill_value=0)
        contract_labels = contract_data.index.tolist()
        contract_stayed = contract_data["No"].tolist() if "No" in contract_data.columns else [0]*len(contract_data)
        contract_churned = contract_data["Yes"].tolist() if "Yes" in contract_data.columns else [0]*len(contract_data)
        
        # Payment Method Churn (Specific to Billing section)
        pay_data = df.groupby(["Payment Method", "Churn Label"]).size().unstack(fill_value=0)
        pay_labels = pay_data.index.tolist()
        pay_stayed = pay_data["No"].tolist() if "No" in pay_data.columns else [0]*len(pay_data)
        pay_churned = pay_data["Yes"].tolist() if "Yes" in pay_data.columns else [0]*len(pay_data)

        # Monthly Charges Hist (Restoring for better view)
        bins_charge = [18, 40, 60, 80, 100, 120]
        labels_charge = ["$18-40", "$40-60", "$60-80", "$80-100", "$100+"]
        stayed_charge_counts = pd.cut(stayed_df["Monthly Charge"], bins=bins_charge, labels=labels_charge, right=False).value_counts().reindex(labels_charge).fillna(0).tolist()
        churned_charge_counts = pd.cut(churned_df["Monthly Charge"], bins=bins_charge, labels=labels_charge, right=False).value_counts().reindex(labels_charge).fillna(0).tolist()
        
        # Top Churn Reasons
        top_reasons = churned_df["Churn Reason"].value_counts().head(10)

        # Churn Categories (Keep for Intel section)
        churn_cat = churned_df["Churn Category"].value_counts()
        
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
        
        s_stayed = stayed_df.groupby(pd.cut(stayed_df["Tenure in Months"], bins=bins_tenure_s), observed=False)["Monthly Charge"].mean().fillna(0).round(1)
        s_churned = churned_df.groupby(pd.cut(churned_df["Tenure in Months"], bins=bins_tenure_c), observed=False)["Monthly Charge"].mean().fillna(0).round(1)
        
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
            
        # Regional Dissatisfaction by City
        dissatisfied_df = df[df["Satisfaction Score"] <= 2]
        top_cities_dissat = dissatisfied_df["City"].value_counts().head(5)
        
        # Dissatisfaction by Internet Type
        int_dissat = dissatisfied_df["Internet Service"].value_counts()

        # Churn Reasons as Complaints
        complaint_cats = churned_df["Churn Category"].value_counts().head(5)
        
        # Mock Sources for the real dissatisfaction count
        total_dissat = len(dissatisfied_df)
        sources = ["Call Center", "Web Portal", "Mobile App", "In-Store"]
        source_counts = [int(total_dissat * 0.45), int(total_dissat * 0.25), int(total_dissat * 0.20), int(total_dissat * 0.10)]

        # --- SUBSCRIBER INTEL (Demographics) ---
        # Senior Citizen Churn
        senior_churn = df.groupby(["Senior Citizen", "Churn Label"]).size().unstack(fill_value=0)
        senior_labels = ["Non-Senior", "Senior Citizen"] # Based on No/Yes
        senior_values = [
            (senior_churn.loc["No", "Yes"] / senior_churn.loc["No"].sum() * 100) if "No" in senior_churn.index else 0,
            (senior_churn.loc["Yes", "Yes"] / senior_churn.loc["Yes"].sum() * 100) if "Yes" in senior_churn.index else 0
        ]

        # Gender and Senior combined churn rates
        gender_senior_labels = []
        gender_senior_senior = []
        gender_senior_non_senior = []
        valid_gender_df = df[df["Gender"].notna()]
        for gender in valid_gender_df["Gender"].value_counts().index.tolist():
            gender_senior_labels.append(gender)

            non_senior_group = valid_gender_df[(valid_gender_df["Gender"] == gender) & (valid_gender_df["Senior Citizen"] == "No")]
            senior_group = valid_gender_df[(valid_gender_df["Gender"] == gender) & (valid_gender_df["Senior Citizen"] == "Yes")]

            non_senior_rate = 0 if len(non_senior_group) == 0 else (len(non_senior_group[non_senior_group["Churn Label"] == "Yes"]) / len(non_senior_group)) * 100
            senior_rate = 0 if len(senior_group) == 0 else (len(senior_group[senior_group["Churn Label"] == "Yes"]) / len(senior_group)) * 100

            gender_senior_non_senior.append(round(non_senior_rate, 1))
            gender_senior_senior.append(round(senior_rate, 1))
        
        # Internet Type Distribution
        int_type_dist = df["Internet Type"].value_counts().fillna("None")
        
        # High CLTV Segment (CLTV > 5000)
        high_cltv_count = len(df[df["CLTV"] > 5000])

        # --- USAGE & SERVICES (Behavior) ---
        # Service Adoption Rate (excluding non-internet users)
        internet_users = df[df["Internet Service"] != "No"]
        services = ["Online Security", "Online Backup", "Device Protection Plan", "Premium Tech Support", "Streaming TV", "Streaming Movies"]
        adoption_vals = [(len(internet_users[internet_users[s] == "Yes"]) / len(internet_users) * 100) if len(internet_users) > 0 else 0 for s in services]
        
        # GB Usage by Internet Type
        gb_usage = df.groupby("Internet Service")["Avg Monthly GB Download"].mean().round(1)
        
        # Churn rates for Usage & Services tab (legacy support)
        pay_churn = df.groupby("Payment Method")["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).round(1)
        int_churn = df.groupby("Internet Service")["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).round(1)

        # Churn rates for Usage & Services tab (legacy support)
        pay_churn = df.groupby("Payment Method")["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).round(1)
        int_churn = df.groupby("Internet Service")["Churn Label"].apply(lambda x: (x == "Yes").mean() * 100).round(1)

        result = {
            "crm_billing": {
                "kpis": {"subscribers": total_subscribers, "churn_rate": churn_rate, "avg_monthly_charges": avg_monthly_charges, "avg_cltv": avg_cltv},
                "churn_distribution": {"labels": ["No", "Yes"], "values": [len(stayed_df), churn_count]},
                "monthly_charges_hist": {
                    "labels": labels_charge,
                    "stayed": stayed_charge_counts,
                    "churned": churned_charge_counts
                },
                "churn_by_contract": {
                    "labels": contract_labels,
                    "stayed": contract_stayed,
                    "churned": contract_churned,
                },
                "churn_by_payment": {
                    "labels": pay_labels,
                    "stayed": pay_stayed,
                    "churned": pay_churned,
                },
                "top_churn_reasons": {
                    "labels": top_reasons.index.tolist(),
                    "values": top_reasons.tolist(),
                },
            },
            "complaints": {
                "kpis": {
                    "dissatisfied_customers": total_dissat,
                    "avg_satisfaction": round(df["Satisfaction Score"].mean(), 2),
                    "dissat_rate": round((total_dissat / len(df)) * 100, 1) if len(df) > 0 else 0,
                },
                "source_breakdown": {"labels": sources, "values": source_counts},
                "category_breakdown": {
                    "labels": complaint_cats.index.tolist(),
                    "values": complaint_cats.tolist(),
                },
                "regional_dissat": {
                    "labels": top_cities_dissat.index.tolist(),
                    "values": top_cities_dissat.tolist(),
                },
                "tech_dissat": {
                    "labels": int_dissat.index.tolist(),
                    "values": int_dissat.tolist(),
                },
            },
            "subscriber_intel": {
                "kpis": {
                    "senior_citizens": len(df[df["Senior Citizen"] == "Yes"]),
                    "high_cltv_ratio": round((high_cltv_count / len(df)) * 100, 1) if len(df) > 0 else 0,
                    "avg_tenure": round(df["Tenure in Months"].mean(), 1),
                },
                "age_distribution": {
                    "bin_labels": labels_age,
                    "stayed": stayed_age_counts,
                    "churned": churned_age_counts,
                },
                "satisfaction_distribution": {"scores": scores, "stayed": stayed_sat, "churned": churned_sat},
                "senior_impact": {"labels": senior_labels, "values": senior_values},
                "gender_senior_impact": {
                    "labels": gender_senior_labels,
                    "non_senior": gender_senior_non_senior,
                    "senior": gender_senior_senior,
                },
                "internet_type_dist": {"labels": int_type_dist.index.tolist(), "values": int_type_dist.tolist()},
            },
            "usage_services": {
                "kpis": {
                    "avg_gb_monthly": round(df["Avg Monthly GB Download"].mean(), 1),
                    "unlimited_data_adoption": round((len(df[df.get("Unlimited Data", "") == "Yes"]) / len(df)) * 100, 1) if "Unlimited Data" in df.columns else 0,
                },
                "tenure_vs_charges": {
                    "stayed": {"x": stayed_x, "y": stayed_y},
                    "churned": {"x": churned_x, "y": churned_y},
                },
                "service_adoption": {
                    "labels": ["Security", "Backup", "Protection", "Tech Support", "TV", "Movies"],
                    "values": [round(v, 1) for v in adoption_vals],
                },
                "gb_usage_by_type": {
                    "labels": gb_usage.index.tolist(),
                    "values": gb_usage.tolist(),
                },
                "churn_by_internet": {
                    "labels": int_churn.index.tolist(),
                    "values": int_churn.tolist(),
                },
            },
        }

        # Convert numpy int/float types to native python for JSON response
        import json
        import math
        
        def default_encoder(o):
            if isinstance(o, np.integer): return int(o)
            if isinstance(o, np.floating): return float(o)
            if isinstance(o, np.ndarray): return o.tolist()
            raise TypeError
            
        def remove_nan(obj):
            if isinstance(obj, dict):
                return {k: remove_nan(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [remove_nan(v) for v in obj]
            elif isinstance(obj, float) and math.isnan(obj):
                return None
            return obj
            
        return remove_nan(json.loads(json.dumps(result, default=default_encoder)))

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
