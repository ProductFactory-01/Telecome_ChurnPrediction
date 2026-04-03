from typing import List, Optional, Dict
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
import json
import re
from service.llm import get_groq_llm
from app.database import get_db_engine
from app.db.mongodb import db as mongo_db
from .data import TAXONOMY, RISK_LEVELS, OFFER_EFFECTIVENESS, ACCEPTANCE_BY_RISK
from sqlalchemy import text # Ensure text is available for queries

router = APIRouter()

# --- Models ---

class OfferGenerationRequest(BaseModel):
    selected_main_category: str
    selected_sub_category: str
    selected_risk_level: str
    customers: List[dict] = []
    taxonomy: List[dict] = []

class SaveOfferPlanRequest(BaseModel):
    customers: List[dict]
    selected_main_category: str
    selected_sub_category: str
    selected_risk_level: str
    selected_recommendation: dict

# --- Utilities ---

def normalize_text(value) -> str:
    return str(value or "").strip().lower()

def normalize_level_label(value: str) -> str:
    normalized = normalize_text(value).replace("_", " ")
    mapping = {
        "level 0": "Level 1",
        "level 1": "Level 1",
        "1": "Level 1",
        "level 2": "Level 2",
        "2": "Level 2",
        "level 3": "Level 3",
        "3": "Level 3",
        "level 4": "Level 4",
        "4": "Level 4",
        "level 5": "Level 5",
        "5": "Level 5",
    }
    return mapping.get(normalized, value.title() if isinstance(value, str) else value)

def derive_risk_level(churn_score) -> str:
    try:
        score = float(churn_score)
    except (TypeError, ValueError):
        score = 0.0

    if 80 <= score <= 100:
        return "Level 1"
    if 60 <= score < 80:
        return "Level 2"
    if 40 <= score < 60:
        return "Level 3"
    if 20 <= score < 40:
        return "Level 4"
    return "Level 5"

def get_risk_score_range(selected_risk_level: str) -> tuple[int, int]:
    normalized_level = normalize_level_label(selected_risk_level)
    ranges = {
        "Level 1": (65, 100), # Adjusted to capture scores >= 65
        "Level 2": (45, 64),
        "Level 3": (30, 44),
        "Level 4": (15, 29),
        "Level 5": (0, 14),
    }
    return ranges.get(normalized_level, (0, 100))

def build_customer_lookup(customers: List[dict]) -> Dict[str, dict]:
    return {
        str(c.get("customer_id") or c.get("Customer ID")): c 
        for c in customers 
        if (c.get("customer_id") or c.get("Customer ID"))
    }

def enrich_offer_rows(llm_offers: List[dict], lookup: Dict[str, dict]) -> List[dict]:
    enriched = []
    for off in llm_offers:
        cid = str(off.get("customer_id", "")).strip()
        if cid in lookup:
            original = lookup[cid]
            enriched.append({**original, **off})
    return enriched

def fallback_offer_template(selected_sub_category: str, risk_level: str) -> str:
    sub = normalize_text(selected_sub_category)
    if "price" in sub or "cost" in sub:
        return "Discount: 15% off for 6 months"
    if "service" in sub or "issue" in sub:
        return "Custom Bundle: Premium Support + Tech Pack for 3 months"
    return "Loyalty Points: 1000 bonus points credited to account"


def save_offer_cohort_document(payload: SaveOfferPlanRequest):
    """Save a new finalized cohort and plan to MongoDB, enriched with Name/Email from Postgres."""
    if mongo_db is None:
        raise HTTPException(status_code=500, detail="MongoDB not connected")
    
    engine = get_db_engine()
    customer_data_map = {}
    
    # Enrichment step
    if engine and payload.customers:
        try:
            # Get IDs and filter out empty ones
            cids = [str(c.get("customer_id") or c.get("Customer ID", "")) for c in payload.customers]
            cids = [id for id in cids if id.strip()]
            
            if cids:
                # Query Postgres 'merged' table for Name and Email
                query = text("SELECT \"Customer ID\", \"Name\", \"email\" FROM public.\"merged\" WHERE \"Customer ID\" IN :cids")
                with engine.connect() as conn:
                    result = conn.execute(query, {"cids": tuple(cids)})
                    for row in result:
                        m = row._mapping
                        customer_data_map[str(m["Customer ID"])] = {"name": m["Name"], "email": m["email"]}
        except Exception as e:
            print(f"Postgres Enrichment Error: {e}")

    # Enrich customer list
    enriched_customers = []
    for c in payload.customers:
        cid = str(c.get("customer_id") or c.get("Customer ID", ""))
        extra = customer_data_map.get(cid, {
            "name": c.get("name") or f"Customer {cid}", 
            "email": c.get("email") or f"{cid.lower()}@client.com"
        })
        enriched_customers.append({**c, **extra})

    try:
        coll = mongo_db["offer_campaigns"]
        timestamp = datetime.now(timezone.utc)
        
        # Append timestamp to doc_name to make every save unique
        normalized_level = normalize_level_label(payload.selected_risk_level).lower().replace(" ", "")
        main_key = "".join(c for c in payload.selected_main_category if c.isalnum())
        time_suffix = timestamp.strftime("%Y%m%d_%H%M%S")
        doc_name = f"{normalized_level}_{main_key}_{time_suffix}"
        
        doc = {
            "document_name": doc_name,
            "main_category": payload.selected_main_category,
            "sub_category": payload.selected_sub_category,
            "risk_level": payload.selected_risk_level,
            "recommendation": payload.selected_recommendation,
            "customer_count": len(enriched_customers),
            "customers": enriched_customers,
            "notify_user": False,
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        # Use insert_one instead of update_one to preserve history
        coll.insert_one(doc)
        
        return {"document_name": doc_name, "customer_count": len(enriched_customers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")

# --- Endpoints ---

@router.get("/offer-engine")
def get_offer_engine_data():
    if mongo_db is None:
        return {
            "kpis": {"offers_generated": 0, "total_customers": 0},
            "charts": {"effectiveness": [], "timeline": []},
            "taxonomy": TAXONOMY,
            "risk_levels": RISK_LEVELS
        }
    
    try:
        coll = mongo_db["offer_campaigns"]
        all_campaigns = list(coll.find({}, {"recommendation": 1, "customer_count": 1, "created_at": 1}))
        
        # Calculate KPIs
        offers_generated = len(all_campaigns)
        total_customers = sum(c.get("customer_count", 0) for c in all_campaigns)
        
        # Process Offer Type Effectiveness (Title counts)
        # Ensure all required labels are present even with 0 counts
        required_labels = ["Discount", "Custom Bundle", "Loyalty Points", "Gamification", "Plan Upgrade"]
        effectiveness_map = {label: 0 for label in required_labels}
        
        for c in all_campaigns:
            title = c.get("recommendation", {}).get("title", "Unknown")
            if title in effectiveness_map:
                effectiveness_map[title] += 1
            else:
                # Still track unknown titles if any exist in DB
                effectiveness_map[title] = effectiveness_map.get(title, 0) + 1
        
        effectiveness_data = [
            {"label": k, "value": v} for k, v in effectiveness_map.items()
        ]
        
        # Process Timeline (By Date)
        timeline_map = {}
        for c in all_campaigns:
            dt = c.get("created_at")
            if dt:
                # Format to YYYY-MM-DD
                date_key = dt.strftime("%Y-%m-%d")
                timeline_map[date_key] = timeline_map.get(date_key, 0) + c.get("customer_count", 0)
        
        timeline_data = sorted([
            {"date": k, "count": v} for k, v in timeline_map.items()
        ], key=lambda x: x["date"])

        return {
            "taxonomy": TAXONOMY,
            "risk_levels": RISK_LEVELS,
            "kpis": {
                "offers_generated": offers_generated,
                "total_customers": total_customers
            },
            "charts": {
                "effectiveness": effectiveness_data,
                "timeline": timeline_data
            },
        }
    except Exception as e:
        print(f"Error fetching offer engine summary: {e}")
        return {
            "taxonomy": TAXONOMY,
            "risk_levels": RISK_LEVELS,
            "kpis": {"offers_generated": 0, "total_customers": 0},
            "charts": {"effectiveness": [], "timeline": []},
        }

@router.get("/offer-engine/customers")
async def get_offer_engine_customers(limit: int = Query(default=500, ge=1, le=5000)):
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database engine not initialized")
        
    query = text(
        """
        SELECT
            c."CustomerID" AS customer_id,
            m."Name" as name,
            m."email" as email,
            c."Country" AS country,
            c."State" AS state,
            c."City" AS city,
            c."Zip Code" AS zip_code,
            c."Gender" AS gender,
            c."Senior Citizen" AS senior_citizen,
            c."Partner" AS partner,
            c."Dependents" AS dependents,
            c."Tenure Months" AS tenure_months,
            c."Internet Service" AS internet_service,
            c."Contract" AS contract,
            c."Payment Method" AS payment_method,
            c."Monthly Charges" AS monthly_charges,
            c."Total Charges" AS total_charges,
            c."Churn Label" AS churn_label,
            c."Churn Value" AS churn_value,
            c."Churn Score" AS churn_score,
            c."CLTV" AS cltv,
            c."Reason" AS churn_reason,
            c."Main Category" AS main_category,
            c."Sub Category" AS sub_category
        FROM public."Churn_New" c
        LEFT JOIN public."merged" m ON c."CustomerID" = m."Customer ID"
        WHERE c."Churn Value" = 1
        ORDER BY c."CustomerID"
        LIMIT :limit;
        """
    )
    try:
        with engine.connect() as connection:
            result = connection.execute(query, {"limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/offer-engine/match-customers")
async def match_offer_customers(payload: OfferGenerationRequest):
    engine = get_db_engine()
    if not engine:
        raise HTTPException(status_code=500, detail="Database engine not initialized")

    min_score, max_score = get_risk_score_range(payload.selected_risk_level)
    query = text(
        """
        SELECT
            c."CustomerID" AS customer_id,
            m."Name" as name,
            m."email" as email,
            c."Country" AS country,
            c."State" AS state,
            c."City" AS city,
            c."Zip Code" AS zip_code,
            c."Gender" AS gender,
            c."Senior Citizen" AS senior_citizen,
            c."Partner" AS partner,
            c."Dependents" AS dependents,
            c."Tenure Months" AS tenure_months,
            c."Internet Service" AS internet_service,
            c."Contract" AS contract,
            c."Payment Method" AS payment_method,
            c."Monthly Charges" AS monthly_charges,
            c."Total Charges" AS total_charges,
            c."Churn Label" AS churn_label,
            c."Churn Value" AS churn_value,
            c."Churn Score" AS churn_score,
            c."CLTV" AS cltv,
            c."Reason" AS churn_reason,
            c."Main Category" AS main_category,
            c."Sub Category" AS sub_category
        FROM public."Churn_New" c
        LEFT JOIN public."merged" m ON c."CustomerID" = m."Customer ID"
        WHERE c."Churn Value" = 1
          AND c."Main Category" = :main_category
          AND c."Sub Category" = :sub_category
          AND c."Churn Score" >= :min_score
          AND c."Churn Score" <= :max_score
        ORDER BY c."Churn Score" DESC, c."CustomerID"
        LIMIT 5000;
        """
    )
    try:
        with engine.connect() as connection:
            result = connection.execute(
                query,
                {
                    "main_category": payload.selected_main_category,
                    "sub_category": payload.selected_sub_category,
                    "min_score": int(min_score),
                    "max_score": int(max_score),
                },
            )
            rows = []
            for row in result:
                # Robustly convert Row to plain dict
                mapped = {key: value for key, value in row._mapping.items()}
                mapped["risk_level"] = normalize_level_label(payload.selected_risk_level)
                mapped["rationale"] = "Matched directly from database records."
                rows.append(mapped)
            return {"offers": rows}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/offer-engine/generate-offers")
async def generate_offer_plans(payload: OfferGenerationRequest):
    # Ensure we use an ID-based lookup to merge LLM response with ORIGINAL data
    customer_lookup = build_customer_lookup(payload.customers)
    
    prompt = {
        "selected_main_category": payload.selected_main_category,
        "selected_sub_category": payload.selected_sub_category,
        "selected_risk_level": payload.selected_risk_level,
        "customers": [
            {
                "customer_id": c.get("customer_id"),
                "churn_score": c.get("churn_score"),
                "churn_reason": c.get("churn_reason")
            } for c in payload.customers[:50]
        ],
        "task": (
            "For each customer, create one concretely planned_offer and a brief rationale. "
            "Return strict JSON: {\"offers\": [{\"customer_id\": \"...\", \"planned_offer\": \"...\", \"rationale\": \"...\"}]}."
        ),
    }

    try:
        llm = get_groq_llm().bind(response_format={"type": "json_object"})
        messages = [
            ("system", "You are a retention strategy analyst. Return only valid JSON. Be specific and data-driven."),
            ("human", json.dumps(prompt)),
        ]
        response = llm.invoke(messages)
        parsed = json.loads(response.content)
    except Exception:
        parsed = None
    
    offers_from_llm = []
    if parsed and "offers" in parsed:
        offers_from_llm = parsed["offers"]
    else:
        # Fallback if LLM fails
        offers_from_llm = [
            {
                "customer_id": c.get("customer_id"), 
                "planned_offer": fallback_offer_template(payload.selected_sub_category, payload.selected_risk_level), 
                "rationale": "Fallback logic applied due to AI unavailability."
            }
            for c in payload.customers[:50]
        ]

    # Merge suggestions with FULL original customer data
    enriched_offers = enrich_offer_rows(offers_from_llm, customer_lookup)
    
    
    return {"offers": enriched_offers}


def get_fallback_recommendations(main_cat: str, sub_cat: str, risk_level: str) -> List[dict]:
    """Provide high-quality default strategic plans if AI is unavailable."""
    cat = normalize_text(main_cat)
    
    # Base templates that fit most categories
    plans = [
        {
            "plan_id": "fallback_1",
            "title": "Discount",
            "offer_type": "Discount",
            "offer_summary": "15% monthly discount for 6 months with no contract extension.",
            "projected_reduction_pct": 22,
            "projected_target_level": "Level 3",
            "why_it_fits": f"Standard value-recovery plan for {main_cat} customers in the {sub_cat} segment."
        },
        {
            "plan_id": "fallback_2",
            "title": "Loyalty Points",
            "offer_type": "Loyalty Points",
            "offer_summary": "5,000 bonus loyalty points redeemable for service add-ons or bill credits.",
            "projected_reduction_pct": 12,
            "projected_target_level": "Level 4",
            "why_it_fits": "Engagement-focused strategy to improve brand affinity for moderate-risk cohorts."
        },
        {
            "plan_id": "fallback_3",
            "title": "Custom Bundle",
            "offer_type": "Custom Bundle",
            "offer_summary": "Complimentary premium support and 1 month of free streaming service.",
            "projected_reduction_pct": 18,
            "projected_target_level": "Level 3",
            "why_it_fits": "Value-add bundle designed to alleviate service concerns and improve perceived value."
        }
    ]
    
    # Simple customization based on category
    if "price" in cat:
        plans[0]["projected_reduction_pct"] = 30
        plans[0]["offer_summary"] = "25% discount for 12 months to directly address price sensitivity."
    elif "experience" in cat or "service" in cat:
        plans[2]["projected_reduction_pct"] = 25
        plans[2]["offer_summary"] = "Priority support routing and 3 months of free speed boost."

    return plans


@router.post("/offer-engine/recommendations")
async def generate_offer_recommendations(payload: OfferGenerationRequest):
    prompt = {
        "selected_main_category": payload.selected_main_category,
        "selected_sub_category": payload.selected_sub_category,
        "selected_risk_level": payload.selected_risk_level,
        "risk_definition": {
            "Level 1": "highest churn risk",
            "Level 2": "lower than Level 1 but still high risk",
            "Level 3": "moderate churn risk",
            "Level 4": "lower risk",
            "Level 5": "lowest churn risk"
        },
        "rules": {
            "allowed_offer_types": [
                "Discount",
                "Custom Bundle",
                "Loyalty Points",
                "Gamification",
                "Plan Upgrade",
            ],
            "required_output": [
                "plan_id",
                "title",
                "offer_type",
                "offer_summary",
                "projected_reduction_pct",
                "projected_target_level",
                "why_it_fits",
            ],
        },
        "task": (
            "Create exactly 3 distinct retention plan recommendations for this selected churn-risk segment. "
            "Create exactly 3 distinct retention plan recommendations using only the selected_main_category, selected_sub_category, and selected_risk_level. "
            "Do not rely on individual customer records to decide the plan. "
            "Each recommendation must be category-level, not customer-level. "
            "Each recommendation title must exactly match one allowed offer type. "
            "Each recommendation must use one allowed offer type and contain concrete values such as discount percentage, loyalty points, bundle contents, or upgrade duration. "
            "Each recommendation must include a projected_reduction_pct as an integer percentage and a projected_target_level using only Level 1 through Level 5. "
            "Projected target level must never be Level 0 or any label outside Level 1 through Level 5. "
            "The target should move the cohort toward Level 5, and if the cohort is already at Level 5 then the target stays Level 5. "
            "Choose plans that make sense for the selected category and sub category. "
            "Higher-risk levels such as Level 1 and Level 2 should generally get stronger retention interventions than Level 4 or Level 5. "
            "The why_it_fits field must clearly explain why that retention plan was chosen for the selected category, selected sub category, and selected risk level. "
            "Return strict JSON only in the shape {\"recommendations\":[...]}."
        ),
    }

    try:
        llm = get_groq_llm().bind(response_format={"type": "json_object"})
        messages = [
            ("system", "You are a retention strategy analyst. Return only valid JSON. Produce exactly 3 concrete cohort-level recommendations with no extra text."),
            ("human", json.dumps(prompt)),
        ]
        response = llm.invoke(messages)
        parsed = json.loads(response.content)
    except Exception:
        parsed = None
    
    # --- Robust Fallback Logic ---
    if parsed is None:
        print(f"WARN: LLM recommendation failed for {payload.selected_main_category}. Using pre-defined tactical plans.")
        cleaned_recommendations = get_fallback_recommendations(
            payload.selected_main_category, 
            payload.selected_sub_category, 
            payload.selected_risk_level
        )
    else:
        recommendations = parsed.get("recommendations", [])
        if not isinstance(recommendations, list) or len(recommendations) != 3:
            # Revert to fallback if AI returned garbage
            cleaned_recommendations = get_fallback_recommendations(
                payload.selected_main_category, 
                payload.selected_sub_category, 
                payload.selected_risk_level
            )
        else:
            cleaned_recommendations = []
            for index, recommendation in enumerate(recommendations, start=1):
                normalized_offer_type = recommendation.get("offer_type") or recommendation.get("title")
                if normalized_offer_type not in {"Discount", "Custom Bundle", "Loyalty Points", "Gamification", "Plan Upgrade"}:
                    normalized_offer_type = "Discount" # Force valid type for fallback resilience

                target_level = normalize_level_label(recommendation.get("projected_target_level"))
                if target_level not in {"Level 1", "Level 2", "Level 3", "Level 4", "Level 5"}:
                    target_level = "Level 3"

                cleaned_recommendations.append(
                    {
                        "plan_id": recommendation.get("plan_id") or f"plan_{index}",
                        "title": normalized_offer_type,
                        "offer_type": normalized_offer_type,
                        "offer_summary": recommendation.get("offer_summary") or "Strategic retention intervention.",
                        "projected_reduction_pct": recommendation.get("projected_reduction_pct") or 15,
                        "projected_target_level": target_level,
                        "why_it_fits": recommendation.get("why_it_fits") or "AI-generated recommendation for the cohort.",
                    }
                )

    # Defend against duplicates even in AI output
    unique_types = []
    final_recommendations = []
    for rec in cleaned_recommendations:
        if rec["offer_type"] not in unique_types:
            unique_types.append(rec["offer_type"])
            final_recommendations.append(rec)
    
    # If duplicates reduced us to < 3, pad with Loyalty points or Custom Bundle
    if len(final_recommendations) < 3:
        final_recommendations = get_fallback_recommendations(
            payload.selected_main_category, payload.selected_sub_category, payload.selected_risk_level
        )

    return {
        "recommendations": sorted(
            final_recommendations,
            key=lambda item: int(re.sub(r'[^0-9]', '', str(item.get("projected_reduction_pct") or "0")) or 0),
            reverse=True,
        )
    }


@router.post("/offer-engine/save-offer")
async def save_offer_plan(payload: SaveOfferPlanRequest):
    return save_offer_cohort_document(payload)