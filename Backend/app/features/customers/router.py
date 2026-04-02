from fastapi import APIRouter, HTTPException, Query
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Static mock data for now — will be replaced with DB queries later
MOCK_CUSTOMERS = [
    {"customer_id": "0002-ORFBO", "Name": "John Smith", "gender": "Female", "tenure": 9, "churn_label": "Yes"},
    {"customer_id": "0003-MKNFE", "Name": "Sarah Johnson", "gender": "Male", "tenure": 9, "churn_label": "No"},
    {"customer_id": "0004-TLHLJ", "Name": "Michael Brown", "gender": "Male", "tenure": 4, "churn_label": "Yes"},
    {"customer_id": "0011-IGKFF", "Name": "Emma Wilson", "gender": "Male", "tenure": 13, "churn_label": "Yes"},
    {"customer_id": "0013-EXCHZ", "Name": "James Davis", "gender": "Female", "tenure": 3, "churn_label": "Yes"},
    {"customer_id": "0013-MHZWF", "Name": "Olivia Martinez", "gender": "Female", "tenure": 9, "churn_label": "Yes"},
    {"customer_id": "0013-SMEOE", "Name": "Robert Garcia", "gender": "Female", "tenure": 71, "churn_label": "No"},
    {"customer_id": "0014-BMAQU", "Name": "Lisa Anderson", "gender": "Male", "tenure": 72, "churn_label": "No"},
    {"customer_id": "0015-UOCOJ", "Name": "David Thomas", "gender": "Female", "tenure": 7, "churn_label": "No"},
    {"customer_id": "0016-QLJIS", "Name": "Jennifer Taylor", "gender": "Female", "tenure": 65, "churn_label": "No"},
    {"customer_id": "0017-DINOC", "Name": "Chris Lee", "gender": "Male", "tenure": 54, "churn_label": "No"},
    {"customer_id": "0017-IUDMW", "Name": "Patricia White", "gender": "Female", "tenure": 20, "churn_label": "Yes"},
    {"customer_id": "0018-NYIRU", "Name": "Daniel Harris", "gender": "Male", "tenure": 8, "churn_label": "Yes"},
    {"customer_id": "0019-EFAEP", "Name": "Nancy Clark", "gender": "Female", "tenure": 72, "churn_label": "No"},
    {"customer_id": "0020-INWCK", "Name": "Mark Lewis", "gender": "Male", "tenure": 1, "churn_label": "Yes"},
    {"customer_id": "0020-POEFU", "Name": "Karen Robinson", "gender": "Female", "tenure": 40, "churn_label": "No"},
    {"customer_id": "0021-IKXGC", "Name": "Steven Walker", "gender": "Male", "tenure": 5, "churn_label": "Yes"},
    {"customer_id": "0022-TCJCI", "Name": "Betty Hall", "gender": "Female", "tenure": 48, "churn_label": "No"},
    {"customer_id": "0023-HGHWL", "Name": "Edward Allen", "gender": "Male", "tenure": 12, "churn_label": "No"},
    {"customer_id": "0024-JRCLV", "Name": "Sandra Young", "gender": "Female", "tenure": 33, "churn_label": "No"},
]

MOCK_CUSTOMER_DETAIL = {
    "Customer ID": "0002-ORFBO",
    "Name": "John Smith",
    "Gender": "Female",
    "Age": 34,
    "Senior Citizen": "No",
    "Married": "Yes",
    "Dependents": "No",
    "Number of Dependents": 0,
    "City": "Los Angeles",
    "State": "California",
    "Country": "United States",
    "Zip Code": 90001,
    "Latitude": 33.9425,
    "Longitude": -118.2551,
    "Population": 36264,
    "Tenure in Months": 9,
    "Contract": "Month-to-month",
    "Payment Method": "Electronic check",
    "Monthly Charge": 65.6,
    "Total Charges": 593.3,
    "Total Revenue": 593.3,
    "Total Refunds": 0.0,
    "Total Extra Data Charges": 0.0,
    "Paperless Billing": "Yes",
    "Phone Service": "Yes",
    "Multiple Lines": "No",
    "Internet Service": "Yes",
    "Internet Type": "Fiber optic",
    "Online Security": "No",
    "Online Backup": "No",
    "Device Protection Plan": "No",
    "Premium Tech Support": "No",
    "Streaming TV": "Yes",
    "Streaming Movies": "No",
    "Streaming Music": "No",
    "Unlimited Data": "No",
    "Avg Monthly GB Download": 15,
    "Churn Label": "Yes",
    "Churn Score": 82,
    "CLTV": 3239,
    "Churn Category": "Competitor",
    "Churn Reason": "Competitor made better offer",
    "Referred a Friend": "No",
    "Number of Referrals": 0,
    "Offer": "None",
    "Satisfaction Score": 3,
    "email": "john.smith@email.com",
    "mobile_number": "+1-555-0123",
}


@router.get("/customers")
async def get_customers(page: int = 1, limit: int = 10, search: str = ""):
    filtered = MOCK_CUSTOMERS
    if search:
        filtered = [c for c in MOCK_CUSTOMERS if search.lower() in (c.get("Name") or "").lower()]

    total = len(filtered)
    start = (page - 1) * limit
    end = start + limit
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "customers": filtered[start:end],
    }


@router.get("/customers/{customer_id}")
async def get_customer_details(customer_id: str):
    # Return mock detail for any ID, updating the ID field
    detail = {**MOCK_CUSTOMER_DETAIL, "Customer ID": customer_id}
    return detail
