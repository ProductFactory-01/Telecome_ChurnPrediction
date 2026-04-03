from fastapi import APIRouter, Query, HTTPException, Body
from app.db.mongodb import db as mongo_db
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()

OUTREACH_CHANNELS = [
    {"key": "sms", "icon": "💬", "title": "SMS", "accept_rate": 18, "cost_per_contact": 0.80, "selected": False},
    {"key": "email", "icon": "📧", "title": "Email", "accept_rate": 9, "cost_per_contact": 0.25, "selected": False},
    {"key": "push", "icon": "📱", "title": "App Push", "accept_rate": 28, "cost_per_contact": 0.05, "selected": False},
    {"key": "agent", "icon": "🧑‍💼", "title": "Live Agent", "accept_rate": 25, "cost_per_contact": 18.00, "selected": False},
    {"key": "inapp", "icon": "📲", "title": "In-App Banner", "accept_rate": 15, "cost_per_contact": 0.02, "selected": False},
]


@router.get("/outreach")
def get_outreach_data():
    if mongo_db is None:
        return {
            "channels": OUTREACH_CHANNELS,
            "kpis": {"campaigns_triggered": 0, "messages_sent": 0, "avg_response_time": "--", "total_contact_cost": 0},
            "charts": {
                "channel_performance": {"labels": ["SMS", "Email", "App Push", "Live Agent", "In-App"], "accept_rate": [18, 9, 28, 25, 15], "cost_efficiency": [22, 25, 30, 8, 28]},
                "timeline": {"labels": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"], "messages_sent": [0]*9},
            },
        }

    # Aggregate active campaigns
    campaign_coll = mongo_db["campaign_executions"]
    count = campaign_coll.count_documents({})
    total_messages = 0
    total_cost = 0.0
    for c in campaign_coll.find():
        total_messages += c.get("messages_sent", 0)
        total_cost += c.get("total_cost", 0.0)

    return {
        "channels": OUTREACH_CHANNELS,
        "kpis": {
            "campaigns_triggered": count,
            "messages_sent": total_messages,
            "avg_response_time": "1.2h" if count > 0 else "--",
            "total_contact_cost": round(total_cost, 2),
        },
        "charts": {
            "channel_performance": {
                "labels": ["SMS", "Email", "App Push", "Live Agent", "In-App"],
                "accept_rate": [18, 9, 28, 25, 15],
                "cost_efficiency": [22, 25, 30, 8, 28],
            },
            "timeline": {
                "labels": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
                "messages_sent": [0, 0, 0, 150, 420, 310, 890, 410, 100],
            },
        },
    }


@router.post("/outreach/trigger")
def trigger_outreach(payload: dict = Body(...)):
    if mongo_db is None:
        raise HTTPException(status_code=500, detail="MongoDB not connected")
    
    campaign_id = payload.get("campaign_id")
    selected_channels = payload.get("channels", [])
    
    offer_coll = mongo_db["offer_campaigns"]
    campaign = offer_coll.find_one({"_id": ObjectId(campaign_id)})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign strategy not found")
        
    cust_count = campaign.get("customer_count", 0)
    
    # Simple cost calculation
    avg_cost = sum(c["cost_per_contact"] for c in OUTREACH_CHANNELS if c["key"] in selected_channels)
    total_cost = avg_cost * cust_count
    
    execution_doc = {
        "offer_campaign_id": ObjectId(campaign_id),
        "triggered_at": datetime.now(timezone.utc),
        "channels": selected_channels,
        "messages_sent": cust_count * len(selected_channels),
        "total_cost": total_cost,
        "status": "completed"
    }
    
    mongo_db["campaign_executions"].insert_one(execution_doc)
    
    return {"status": "triggered", "messages_sent": execution_doc["messages_sent"], "total_cost": total_cost}


@router.post("/outreach/preview")
def preview_outreach(payload: dict):
    return {"preview_count": 4210, "channels": ["sms", "push"]}


@router.post("/outreach/active-campaign")
def get_active_campaign(
    payload: dict = Body(...)
):
    if mongo_db is None:
        raise HTTPException(status_code=500, detail="MongoDB not connected")
    
    main_category = payload.get("main_category")
    sub_category = payload.get("sub_category")
    risk_level = payload.get("risk_level")
    
    try:
        coll = mongo_db["offer_campaigns"]
        
        # Sort by created_at descending to get the latest
        cursor = coll.find({
            "main_category": main_category,
            "sub_category": sub_category,
            "risk_level": risk_level
        }).sort("created_at", -1).limit(1)
        
        campaigns = list(cursor)
        if not campaigns:
            return {"active_strategy": None}
            
        latest = campaigns[0]
        # Convert ObjectId to string for JSON serialization
        latest["_id"] = str(latest["_id"])
        
        return {"active_strategy": latest}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
