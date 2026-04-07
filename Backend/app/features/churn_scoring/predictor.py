import os
import json
from langchain_core.prompts import ChatPromptTemplate
from service.llm import get_groq_llm
from .schemas import CustomerInput

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_fallback_prediction(data: CustomerInput) -> dict:
    """Fallback logic if LLM is unavailable or fails."""
    # STEP 1: INITIALIZE SCORE
    base_score = 50
    score = base_score
    
    # STEP 2: APPLY FEATURE WEIGHTS
    if data.SatisfactionScore <= 2:
        score += 20
    elif data.SatisfactionScore == 3:
        score += 12
    elif data.SatisfactionScore >= 4:
        score -= 10
        
    if data.Contract == "Month-to-month":
        score += 20
    elif data.Contract == "One year":
        score -= 15
    elif data.Contract == "Two year":
        score -= 25
        
    if data.TenureMonths < 6:
        score += 10
    elif 6 <= data.TenureMonths <= 12:
        score += 5
    elif data.TenureMonths > 12:
        score -= 10
        
    if data.ComplaintFrequency > 0:
        score += 15
        
    if data.PaymentDelay > 0:
        score += 10
        
    if data.Latency > 80 or data.PacketLoss > 1:
        score += 20
    else:
        score -= 10
        
    if data.MonthlyCharges > 85:
        score += 10
        
    if data.AvgMonthlyGBDownload < 5:
        score += 10
    elif data.AvgMonthlyGBDownload > 50:
        score -= 10
        
    # STEP 3: FINAL SCORE & Clamp
    prob = max(5, min(95, score))
    is_churn = 1 if prob > 50 else 0
    
    # STEP 6: CATEGORY RULES
    if data.Latency > 80 or data.PacketLoss > 1:
        reason = {"main_category": "Network", "sub_category": "Technical Issue", "reason": f"High latency of {data.Latency}ms and packet drop issues are significantly degrading customer experience."}
    elif data.ComplaintType == "Billing" or data.ComplaintFrequency > 0:
        reason = {"main_category": "Billing", "sub_category": "Price Issue", "reason": f"Customer has filed {data.ComplaintFrequency} complaints regarding billing, which is the primary churn driver."}
    elif data.SatisfactionScore <= 3:
        reason = {"main_category": "Customer Experience", "sub_category": "Support Issue", "reason": "General dissatisfaction and low interaction scores indicate a breakdown in service relationship."}
    elif data.MonthlyCharges > 85:
        reason = {"main_category": "Price-Sensitive", "sub_category": "Price Issue", "reason": f"High pricing of ${data.MonthlyCharges} drives competitor seeking."}
    else:
        reason = {"main_category": "Low Engagement", "sub_category": "Other", "reason": "Combination of short tenure and contract type indicates risk."}

    return {
        "churn_probability": round(prob, 4),
        "churn_prediction": is_churn,
        "risk_level": "High" if prob > 70 else "Medium" if prob > 40 else "Low",
        "churn_reason": reason,
    }


def predict_churn(customer: CustomerInput) -> dict:
    """Use purely GenAI to predict churn score and reason based on all inputs."""
    if not GROQ_API_KEY:
        print("⚠ No GROQ_API_KEY found, using fallback prediction.")
        return get_fallback_prediction(customer)
        
    prompt = {
        "customer_profile": customer.dict(),
        "task": """You are a deterministic churn scoring engine. Output ONLY valid JSON. No markdown, no explanation, no extra text.

══════════════════════════════════════════════════
SCORING ALGORITHM — EXECUTE EVERY STEP IN ORDER
══════════════════════════════════════════════════

STEP 1 — BASE SCORE
  score = 50

──────────────────────────────────────────────────
STEP 2 — APPLY ALL ADJUSTMENTS (none can be skipped)
──────────────────────────────────────────────────

[A] CONTRACT TYPE
  Month-to-month → +20
  One year       → -15
  Two year       → -25

[B] SATISFACTION SCORE
  <= 2  → +20
  = 3  → +12
  >= 4  → -10

[C] TENURE (months)
  < 6     → +10
  6–12    → +5
  > 12    → -10

[D] NETWORK QUALITY
  Latency > 80ms OR PacketLoss > 1%  → +20
  Latency <= 80ms AND PacketLoss <= 1% → -10

[E] COMPLAINT FREQUENCY
  > 0  → +15
  = 0  → 0

[F] PAYMENT DELAY (days)
  > 0  → +10
  = 0  → 0

[G] MONTHLY CHARGES ($)
  > 85  → +10
  <= 85  → 0

[H] AVG MONTHLY DATA USAGE (GB)
  < 5   → +10
  > 50  → -10
  5–50  → 0

[I] DROPPED CALLS
  > 5   → +10
  1–5   → +5
  = 0   → 0

[J] JITTER (ms)
  > 30  → +10
  > 15  → +5
  <= 15  → 0

[K] SIGNAL STRENGTH (%)
  < 40  → +15
  40–60 → +5
  > 60  → -5

[L] THROUGHPUT (Mbps)
  < 10  → +10
  10–25 → +5
  > 25  → -5

[M] PLAN CHANGES
  > 2   → +10
  1–2   → +5
  = 0   → 0

[N] DEVICE CAPABILITY
  2G    → +10
  3G    → +5
  4G    → 0
  5G    → -5

[O] COMPLAINT TYPE
  Billing   → +10
  Technical → +8
  Service   → +6
  None      → 0

[P] INTERNET TYPE
  DSL        → +5
  Fiber optic → 0
  Cable      → 0
  None       → +10

[Q] PAYMENT METHOD
  Electronic check → +8
  Mailed check     → +5
  Bank transfer    → 0
  Credit card      → -5

[R] AGE
  < 25  → +5
  25–60 → 0
  > 60  → +8   (seniors at higher churn risk)

[S] SENIOR CITIZEN
  Yes → +8
  No  → 0

[T] PARTNER
  No  → +5
  Yes → 0

[U] DEPENDENTS
  > 0  → -5   (family plans less likely to churn)
  = 0  → +3

[V] PAPERLESS BILLING
  Yes → 0
  No  → +3

[W] PHONE SERVICE
  No  → +5
  Yes → 0

[X] MULTI-LINE
  Yes → -3
  No  → 0

[Y] TECH SUPPORT
  No  → +5
  Yes → -5

[Z] ONLINE SECURITY
  No  → +5
  Yes → -5

[AA] ONLINE BACKUP
  No  → +3
  Yes → -3

[AB] DEVICE PROTECTION
  No  → +3
  Yes → -3

[AC] STREAMING TV
  Yes → -3   (engaged, less likely to churn)
  No  → 0

[AD] STREAMING MOVIES
  Yes → -3
  No  → 0

[AE] STREAMING MUSIC
  Yes → -3
  No  → 0

[AF] UNLIMITED DATA
  Yes → -5
  No  → +5

[AG] MARRIED
  Yes → -3
  No  → +3

[AH] LIFETIME REVENUE (auto-calculated: TenureMonths * MonthlyCharges)
  > 2000  → -10  (high-value long-term customer, lower churn risk)
  500–2000 → -5
  < 500   → +5

──────────────────────────────────────────────────
STEP 3 — FINAL SCORE
──────────────────────────────────────────────────
  final_score = score + sum(all adjustments above)
  Clamp: if < 5 → 5 | if > 95 → 95

──────────────────────────────────────────────────
STEP 4 — CHURN PREDICTION
──────────────────────────────────────────────────
  churn_prediction = 1 if final_score > 50 else 0

──────────────────────────────────────────────────
STEP 5 — RISK LEVEL
──────────────────────────────────────────────────
  > 70  → "High"
  41–70 → "Medium"
  <= 40  → "Low"

──────────────────────────────────────────────────
STEP 6 — MAIN CATEGORY (pick FIRST match)
──────────────────────────────────────────────────
  1. Latency>80 OR PacketLoss>1 OR DroppedCalls>5 OR Jitter>30 OR Throughput<10
       → main="Network", sub="Technical Issue"
  2. ComplaintFrequency>0 OR ComplaintType="Billing" OR PaymentDelay>0
       → main="Billing", sub="Price Issue"
  3. SatisfactionScore<=3 OR TechSupport=No OR OnlineSecurity=No
       → main="Customer Experience", sub="Support Issue"
  4. MonthlyCharges>85 OR PaymentMethod="Electronic check"
       → main="Price-Sensitive", sub="Price Issue"
  5. AvgMonthlyGBDownload<5 OR StreamingTV=No AND StreamingMovies=No AND StreamingMusic=No
       → main="Low Engagement", sub="Usage Issue"
  6. default
       → main="General Risk", sub="Other"

──────────────────────────────────────────────────
STEP 7 — REASON
──────────────────────────────────────────────────
  Write ONE sentence naming the top 2–3 actual contributing factors with their values.
  Example: "Customer has high latency (120ms) and a month-to-month contract with low satisfaction (score: 2), making churn highly likely."

══════════════════════════════════════════════════
OUTPUT — STRICT JSON ONLY
══════════════════════════════════════════════════
{
  "churn_probability": <number, 5-95>,
  "churn_prediction": <0 or 1>,
  "risk_level": <"Low" | "Medium" | "High">,
  "score_breakdown": {
    "base_score": 50,
    "adjustments": {
      "contract": <+-number>,
      "satisfaction": <+-number>,
      "tenure": <+-number>,
      "network_quality": <+-number>,
      "complaint_frequency": <+-number>,
      "payment_delay": <+-number>,
      "monthly_charges": <+-number>,
      "data_usage": <+-number>,
      "dropped_calls": <+-number>,
      "jitter": <+-number>,
      "signal_strength": <+-number>,
      "throughput": <+-number>,
      "plan_changes": <+-number>,
      "device_capability": <+-number>,
      "complaint_type": <+-number>,
      "internet_type": <+-number>,
      "payment_method": <+-number>,
      "age": <+-number>,
      "senior_citizen": <+-number>,
      "partner": <+-number>,
      "dependents": <+-number>,
      "paperless_billing": <+-number>,
      "phone_service": <+-number>,
      "multi_line": <+-number>,
      "tech_support": <+-number>,
      "online_security": <+-number>,
      "online_backup": <+-number>,
      "device_protection": <+-number>,
      "streaming_tv": <+-number>,
      "streaming_movies": <+-number>,
      "streaming_music": <+-number>,
      "unlimited_data": <+-number>,
      "married": <+-number>,
      "lifetime_revenue": <+-number>
    },
    "final_score": <number>
  },
  "churn_reason": {
    "main_category": <string>,
    "sub_category": <string>,
    "reason": <string>
  }
}"""
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
            
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            print(f"Failed to parse JSON: {content}")
            raise Exception("Invalid JSON generated by LLM")
        
        # Ensure we have the base keys expected by the router and UI
        prob = float(parsed.get("churn_probability", 0.0))
        is_churn = parsed.get("churn_prediction", 0)
        reason_data = parsed.get("churn_reason", {"main_category": None, "sub_category": None, "reason": None})
        score_breakdown = parsed.get("score_breakdown", {})
        
        # Validate structure guarantees
        if type(reason_data) is not dict:
            reason_data = {"main_category": None, "sub_category": None, "reason": None}
            
        print(f"✓ AI prediction success: {prob} Probability")
        
        risk_label = "High" if prob > 70 else "Medium" if prob > 40 else "Low"
        print(f"Risk Label: {risk_label} ({prob}%)")
        
        return {
            "churn_probability": round(prob, 4),
            "churn_prediction": is_churn,
            "risk_level": risk_label,
            "churn_reason": reason_data,
            "score_breakdown": score_breakdown,
        }
        
    except Exception as e:
        print(f"⚠ AI prediction generation failed: {e}")
        return get_fallback_prediction(customer)
