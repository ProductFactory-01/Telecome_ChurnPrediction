import os
import json
from langchain_core.prompts import ChatPromptTemplate
from service.llm import get_groq_llm
from .schemas import CustomerInput

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# ---------------------------------------------------------------------------
# Fallback: pure rule-based predictor (used only when LLM is unavailable)
# ---------------------------------------------------------------------------

def get_fallback_prediction(data: CustomerInput) -> dict:
    """Lightweight rule-based fallback. Used only when the LLM is unreachable."""
    score = 50

    if data.Contract == "Month-to-month":
        score += 20
    elif data.Contract == "One year":
        score -= 15
    elif data.Contract == "Two year":
        score -= 25

    if data.SatisfactionScore <= 2:
        score += 20
    elif data.SatisfactionScore == 3:
        score += 12
    elif data.SatisfactionScore >= 4:
        score -= 10

    if data.TenureMonths < 6:
        score += 10
    elif data.TenureMonths <= 12:
        score += 5
    else:
        score -= 10

    if data.Latency > 80 or data.PacketLoss > 1:
        score += 20
    else:
        score -= 10

    if data.ComplaintFrequency > 0:
        score += 15
    if data.PaymentDelay > 0:
        score += 10
    if data.MonthlyCharges > 85:
        score += 10

    if data.AvgMonthlyGBDownload < 5:
        score += 10
    elif data.AvgMonthlyGBDownload > 50:
        score -= 10

    prob = max(5, min(95, score))
    is_churn = 1 if prob > 50 else 0
    risk_label = "High" if prob > 70 else "Medium" if prob > 40 else "Low"

    if data.Latency > 80 or data.PacketLoss > 1:
        reason = {
            "main_category": "Network",
            "sub_category": "Technical Issue",
            "reason": f"High latency ({data.Latency}ms) or packet loss is degrading the customer experience.",
        }
    elif data.ComplaintFrequency > 0 or data.ComplaintType == "Billing":
        reason = {
            "main_category": "Billing",
            "sub_category": "Price Issue",
            "reason": f"Customer raised {data.ComplaintFrequency} complaints; billing friction is the primary driver.",
        }
    elif data.SatisfactionScore <= 3:
        reason = {
            "main_category": "Customer Experience",
            "sub_category": "Support Issue",
            "reason": f"Low satisfaction score ({data.SatisfactionScore}/5) signals a deteriorating service relationship.",
        }
    elif data.MonthlyCharges > 85:
        reason = {
            "main_category": "Price-Sensitive",
            "sub_category": "Price Issue",
            "reason": f"Monthly charge of ${data.MonthlyCharges} may push the customer toward cheaper alternatives.",
        }
    else:
        reason = {
            "main_category": "General Risk",
            "sub_category": "Other",
            "reason": "Short tenure and contract type together indicate elevated churn risk.",
        }

    return {
        "churn_probability": round(float(prob), 4),
        "churn_prediction": is_churn,
        "risk_level": risk_label,
        "churn_reason": reason,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_customer_summary(c: CustomerInput) -> str:
    """Convert customer fields into a compact, readable summary for the LLM."""
    lifetime_revenue = c.TenureMonths * c.MonthlyCharges
    lines = [
        f"Contract: {c.Contract} | Tenure: {c.TenureMonths} months | Monthly charges: ${c.MonthlyCharges} | Lifetime revenue: ${lifetime_revenue:.0f}",
        f"Satisfaction score: {c.SatisfactionScore}/5 | Paperless billing: {c.PaperlessBilling} | Payment delay: {c.PaymentDelay} days",
        f"Internet: {c.InternetService} ({c.InternetType}) | Latency: {c.Latency}ms | Jitter: {c.Jitter}ms | Packet loss: {c.PacketLoss}% | Signal: {c.SignalStrength}% | Throughput: {c.Throughput} Mbps",
        f"Dropped calls: {c.DroppedCalls} | Blocked calls: {c.BlockedCalls}",
        f"Complaint frequency: {c.ComplaintFrequency} | Complaint type: {c.ComplaintType}",
        f"Avg monthly data: {c.AvgMonthlyGBDownload} GB | Unlimited data: {c.UnlimitedData}",
        f"Streaming TV: {c.StreamingTV} | Streaming movies: {c.StreamingMovies} | Streaming music: {c.StreamingMusic}",
        f"Phone service: {c.PhoneService} | Multi-line: {c.MultipleLines} | Device: {c.DeviceCapability}",
        f"Tech support: {c.TechSupport} | Online security: {c.OnlineSecurity} | Online backup: {c.OnlineBackup} | Device protection: {c.DeviceProtection}",
        f"Age: {c.Age} | Senior citizen: {c.SeniorCitizen} | Partner: {c.Partner} | Married: {c.Married} | Dependents: {c.NumberOfDependents}",
        f"Offer: {c.Offer} | Plan changes: {c.PlanChangeTracking}",
    ]
    return "\n".join(lines)


SYSTEM_PROMPT = """\
You are an expert telecom churn analyst. Given a customer profile, predict whether the customer will churn.

Reason holistically across ALL provided parameters, but prioritize the following high-impact signals in your analysis:
1. Network Quality (Latency, Jitter, Packet Loss, Throughput)
2. Pricing and Billing (Monthly Charges, Payment Delays, Contract Type)
3. Customer Feedback (Complaint Frequency, Complaint Type, Satisfaction Score)

Identify the specific factors contributing to the risk from across the entire profile.

Output ONLY a single valid JSON object. No markdown, no preamble, no explanation outside the JSON.

JSON schema:
{{
  "churn_probability": <integer 5-95>,
  "churn_prediction": <0 or 1>,
  "risk_level": <"Low" | "Medium" | "High">,
  "impact_analysis": [
    {{ 
      "factor": <string, e.g. "Monthly Charges">, 
      "impact": <integer -40 to 40, positive is bad>, 
      "description": <string, e.g. "High monthly charge of $110 compared to average."> 
    }},
    ... (provide 4-6 most significant factors)
  ],
  "churn_reason": {{
    "main_category": <"Network" | "Billing" | "Customer Experience" | "Price-Sensitive" | "Low Engagement" | "General Risk">,
    "sub_category": <e.g. "Technical Issue" | "Price Issue" | "Support Issue" | "Usage Issue" | "Other">,
    "reason": <one sentence naming the 2-3 strongest churn signals with their actual values>
  }}
}}

Rules:
- churn_probability: genuine likelihood of churn; clamp to 5-95.
- churn_prediction: 1 if churn_probability > 50, else 0.
- risk_level: > 70 → "High", 41-70 → "Medium", <= 40 → "Low".
- main_category: pick the single strongest driver category.
- impact: Genuine contribution to the final risk. Positive values increase churn risk, negative values decrease it.
- No 'base score' or 'fixed algorithm' logic—use holistic AI reasoning.
- reason: must reference real field values (e.g. "satisfaction 2/5", "latency 110ms").\
"""

USER_TEMPLATE = """\
Predict churn for this telecom customer:

{customer_summary}
"""


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def predict_churn(customer: CustomerInput) -> dict:
    """Use an LLM to reason holistically about customer churn risk."""
    if not GROQ_API_KEY:
        print("⚠  No GROQ_API_KEY found — using fallback prediction.")
        return get_fallback_prediction(customer)

    customer_summary = _build_customer_summary(customer)

    try:
        print("\n--- DEBUG: CUSTOMER SUMMARY SENT TO LLM ---")
        print(customer_summary)
        print("-------------------------------------------\n")

        llm = get_groq_llm()

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("user", USER_TEMPLATE),
        ])

        chain = prompt_template | llm
        response = chain.invoke({"customer_summary": customer_summary})
        content = response.content.strip()

        print("\n--- DEBUG: RAW LLM RESPONSE ---")
        print(content)
        print("-------------------------------\n")

        # Strip markdown fences if the model adds them despite instructions
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()

        parsed = json.loads(content)

        prob       = max(5, min(95, int(parsed["churn_probability"])))
        is_churn   = 1 if prob > 50 else 0
        risk_label = "High" if prob > 70 else "Medium" if prob > 40 else "Low"
        reason_data = parsed.get("churn_reason", {
            "main_category": "General Risk",
            "sub_category":  "Other",
            "reason":        "Unable to determine specific reason.",
        })

        if not isinstance(reason_data, dict):
            reason_data = {"main_category": None, "sub_category": None, "reason": None}

        print(f"✓ AI prediction: {prob}% churn probability | Risk: {risk_label}")

        return {
            "churn_probability": round(float(prob), 4),
            "churn_prediction":  is_churn,
            "risk_level":        risk_label,
            "impact_analysis":   parsed.get("impact_analysis", []),
            "churn_reason":      reason_data,
        }

    except Exception as e:
        print(f"⚠  AI prediction failed ({e}) — using fallback.")
        return get_fallback_prediction(customer)