import json
from app.database import get_db_engine
from app.features.offer_engine.router import save_offer_cohort_document, SaveOfferPlanRequest

def test_save_with_mobile():
    # Attempt to save a mini cohort for a customer known to be in the DB
    # Based on previous turns, '0196-VULGZ' is a valid ID
    request = SaveOfferPlanRequest(
        selected_main_category="Geography",
        selected_sub_category="Service Issue",
        selected_risk_level="Level 1",
        customers=[{"customer_id": "0196-VULGZ"}],
        selected_recommendation={"title": "Test Offer", "offer_type": "Discount", "offer_summary": "Test Summary"}
    )
    
    try:
        response = save_offer_cohort_document(request)
        print("Save Response:", response)
        
        from app.db.mongodb import db as mongo_db
        doc = mongo_db["offer_campaigns"].find_one({"document_name": response["document_name"]})
        if doc:
            cust = doc["customers"][0]
            print(f"Enriched Customer: {cust.get('name')}, {cust.get('email')}, Mobile: {cust.get('mobile_number')}")
            if "mobile_number" in cust and cust["mobile_number"]:
                print("SUCCESS: Mobile number enriched and saved!")
            else:
                print("FAILURE: Mobile number missing or empty in saved document.")
        else:
            print("FAILURE: Document not found in MongoDB.")
            
    except Exception as e:
        print("Error during test:", e)

if __name__ == "__main__":
    test_save_with_mobile()
