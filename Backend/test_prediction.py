from app.features.churn_scoring.predictor import predict_churn
from app.features.churn_scoring.schemas import CustomerInput
import json
import os

def test_billing_prediction():
    # Setup a customer with Billing complaint and good network
    customer = CustomerInput(
        Gender="Male",
        SeniorCitizen=False,
        Partner=True,
        Dependents=False,
        TenureMonths=6,
        PhoneService=True,
        MultipleLines=False,
        InternetService="Fiber optic",
        OnlineSecurity=False,
        OnlineBackup=False,
        DeviceProtection=False,
        TechSupport=False,
        StreamingTV=False,
        StreamingMovies=False,
        Contract="Month-to-month",
        PaperlessBilling=True,
        PaymentMethod="Electronic check",
        MonthlyCharges=75.0,
        TotalCharges=450.0,
        Latitude=13.0827,
        Longitude=80.2707,
        Age=35,
        SatisfactionScore=3,
        Latency=45.0,
        SignalStrength=65.0,
        ComplaintType="Billing",
        ComplaintFrequency=2,
        PaymentDelay=5
    )

    print("Running prediction for Billing complaint...")
    result = predict_churn(customer)
    print("\n--- Prediction Result ---")
    print(json.dumps(result, indent=2))

    reason = result["churn_reason"]
    print(f"\nMain Category: {reason['main_category']}")
    print(f"Sub Category: {reason['sub_category']}")
    
    if reason["main_category"] == "Billing":
        print("✅ SUCCESS: Category is 'Billing'")
    else:
        print("❌ FAILURE: Category is NOT 'Billing'")

def test_network_prediction():
    # Setup a customer with High Latency and Low Satisfaction
    customer = CustomerInput(
        Gender="Male",
        SeniorCitizen=False,
        Partner=True,
        Dependents=False,
        TenureMonths=6,
        PhoneService=True,
        MultipleLines=False,
        InternetService="Fiber optic",
        OnlineSecurity=False,
        OnlineBackup=False,
        DeviceProtection=False,
        TechSupport=False,
        StreamingTV=False,
        StreamingMovies=False,
        Contract="Month-to-month",
        PaperlessBilling=True,
        PaymentMethod="Electronic check",
        MonthlyCharges=75.0,
        TotalCharges=450.0,
        Latitude=13.0827,
        Longitude=80.2707,
        Age=35,
        SatisfactionScore=2,
        Latency=145.0,
        SignalStrength=65.0,
        ComplaintType="None",
        ComplaintFrequency=0,
        PaymentDelay=0
    )

    print("\nRunning prediction for Network Issue (High Latency)...")
    result = predict_churn(customer)
    print("\n--- Prediction Result ---")
    print(json.dumps(result, indent=2))

    reason = result["churn_reason"]
    print(f"\nMain Category: {reason['main_category']}")
    print(f"Sub Category: {reason['sub_category']}")
    
    if reason["main_category"] in ["Network", "Customer Experience"]:
        print("✅ SUCCESS: Category is 'Network' or 'Customer Experience'")
    else:
        print("❌ FAILURE: Category unexpectedly fell back")

if __name__ == "__main__":
    test_billing_prediction()
    test_network_prediction()
