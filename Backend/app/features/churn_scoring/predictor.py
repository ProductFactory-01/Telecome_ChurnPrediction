import os
import json
from langchain_core.prompts import ChatPromptTemplate
from service.llm import get_groq_llm
from .schemas import CustomerInput

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_fallback_prediction(data: CustomerInput) -> dict:
    """Fallback logic if LLM is unavailable or fails."""
    # Simple heuristic
    prob = 0.2
    if data.MonthlyCharges > 85 or data.SatisfactionScore < 3 or data.Latency > 80:
        prob += 0.4
    if data.Contract == "Month-to-month" or data.TenureMonths < 12:
        prob += 0.3
    
    prob = min(prob, 0.95)
    is_churn = 1 if prob > 0.5 else 0
    
    reason = {"main_category": None, "sub_category": None, "reason": None}
    
    if is_churn:
        if data.SatisfactionScore < 3 or data.Latency > 80:
            reason = {"main_category": "Customer Experience Issues", "sub_category": "Service Issue", "reason": "High latency and low satisfaction leading to flight risk."}
        elif data.MonthlyCharges > 85:
            reason = {"main_category": "Price-Sensitive", "sub_category": "Price Issue", "reason": f"High pricing of ${data.MonthlyCharges} drives competitor seeking."}
        else:
            reason = {"main_category": "Low Engagement", "sub_category": "Other", "reason": "Combination of short tenure and contract type indicates risk."}

    return {
        "churn_probability": round(prob, 4),
        "churn_prediction": is_churn,
        "risk_level": "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low",
        "churn_reason": reason,
    }


def predict_churn(customer: CustomerInput) -> dict:
    """Use purely GenAI to predict churn score and reason based on all inputs."""
    if not GROQ_API_KEY:
        print("⚠ No GROQ_API_KEY found, using fallback prediction.")
        return get_fallback_prediction(customer)
        
    prompt = {
        "customer_profile": customer.dict(),
        "task": (
            "You are an expert Telecom Data Scientist AI. "
            "FIRST, perform Feature Engineering on the profile by mentally calculating these derived metrics where data exists:\n"
            " - Tenure Group: Bin TenureMonths (0-12, 13-24, 25-48, 49+)\n"
            " - Avg Monthly Spend: TotalCharges / TenureMonths\n"
            " - Charge Deviation: MonthlyCharges - Avg Monthly Spend\n"
            " - Service Count: Sum of binary services (Phone, Internet, Security, Backup, Protection, TechSupport, Streaming, Unlimited Data)\n"
            " - Value-to-Spend Ratio: Service Count / MonthlyCharges\n"
            " - Network Quality Score: Weighted penalty based on PacketLoss, Latency, and Jitter\n"
            " - Call Quality Score: Penalty based on DroppedCalls and BlockedCalls\n"
            " - Internet Heavy User Flag: 1 if AvgMonthlyGBDownload > 50, else 0\n"
            " - Complaint Severity Index: Heavily weight ComplaintFrequency > 0\n"
            " - Contract Risk Score: Month-to-Month = High Risk, 1-Year = Med, 2-Year = Low\n"
            " - Age Group: Youth (18-30), Adult (31-55), Senior (56+)\n"
            "SECOND, allocate importance to each factor based on their impact. Make your prediction relying intensely on these engineered features rather than raw data.\n"
            "THIRD, return ONLY a strictly valid JSON object with the following keys:\n"
            "- churn_probability: a float between 0.0 and 1.0 (higher means higher risk).\n"
            "- churn_prediction: 1 if churn_probability > 0.5, else 0.\n"
            "- churn_reason: an object containing 'main_category', 'sub_category', and 'reason'. This MUST be provided for both 1 AND 0.\n"
            "  * If churn_prediction is 0, use categories like 'Stable', 'Loyal', or 'Low Risk' for main/sub category.\n"
            "  * If churn_prediction is 1, select the BEST 'main_category' and 'sub_category' from: [Price-Sensitive | Price Issue], [Plan & Product Mismatch | Competitor], [Customer Experience Issues | Service Issue], [Customer Experience Issues | Support Issue], [Geography | Service Issue].\n"
            "  * Make the 'reason' AT LEAST 20 words long. It MUST NOT contain any technical or data-science terminology (do not say 'weighted', 'derivation', 'bins', 'normalized', 'features'). Write it in plain, simple English like a standard customer support note."
        )
    }

    try:
        print("\n--- DEBUG: PROMPT PASSED TO LLM ---")
        print(json.dumps(prompt, indent=2))
        print("-----------------------------------\n")
        
        llm = get_groq_llm()
        system_prompt = "You are a specialized scoring AI. You ONLY output valid JSON. You never output conversational text."
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{user_data}")
        ])
        
        chain = prompt_template | llm
        response = chain.invoke({"user_data": json.dumps(prompt)})
        content = response.content.strip()
        
        print("\n--- DEBUG: RAW LLM RESPONSE ---")
        print(content)
        print("-------------------------------\n")
        
        # Extract JSON from markdown if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        parsed = json.loads(content)
        
        # Ensure we have the base keys expected by the router and UI
        prob = float(parsed.get("churn_probability", 0.0))
        is_churn = parsed.get("churn_prediction", 0)
        reason_data = parsed.get("churn_reason", {"main_category": None, "sub_category": None, "reason": None})
        
        # Validate structure guarantees
        if type(reason_data) is not dict:
            reason_data = {"main_category": None, "sub_category": None, "reason": None}
            
        print(f"✓ AI prediction success: {prob} Probability")
        
        return {
            "churn_probability": round(prob, 4),
            "churn_prediction": is_churn,
            "risk_level": "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low",
            "churn_reason": reason_data,
        }
        
    except Exception as e:
        print(f"⚠ AI prediction generation failed: {e}")
        return get_fallback_prediction(customer)
