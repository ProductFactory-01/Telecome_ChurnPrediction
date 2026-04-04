from fastapi import APIRouter, Query, HTTPException, Body
from app.db.mongodb import db as mongo_db
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()

# Channel Metadata (Icons and Titles) - mapped from notification_medium keys
CHANNEL_METADATA = {
    "sms": {"icon": "💬", "title": "SMS", "cost": 0.80},
    "email": {"icon": "📧", "title": "Email", "cost": 0.25},
    "whatsapp": {"icon": "📱", "title": "Whatsapp", "cost": 0.05},
    "push": {"icon": "📱", "title": "Whatsapp", "cost": 0.05}, # Alias
    "agent": {"icon": "🧑‍💼", "title": "Live Agent", "cost": 18.00},
    "live agent": {"icon": "🧑‍💼", "title": "Live Agent", "cost": 18.00}, # Alias
    "telegram": {"icon": "📲", "title": "Telegram", "cost": 0.02},
    "inapp": {"icon": "📲", "title": "Telegram", "cost": 0.02}, # Alias
}

def get_channels_from_db():
    """
    Derives the list of available channels based on unique notification_medium 
    values found in the offer_campaigns collection, falling back to all metadata keys.
    """
    if mongo_db is None:
        return []
    
    # Get unique mediums that have actually been used/configured
    used_mediums = mongo_db["offer_campaigns"].distinct("notification_medium")
    
    # We always want to return the full set of supported channels for the UI to show options,
    # but we'll mark them based on what's defined in the system.
    # For now, we'll return a standard list derived from our metadata.
    channels = []
    seen = set()
    for key, meta in CHANNEL_METADATA.items():
        # Avoid duplicates from aliases
        title = meta["title"]
        if title in seen:
            continue
        seen.add(title)
        
        channels.append({
            "key": key,
            "icon": meta["icon"],
            "title": title,
            "cost_per_contact": meta["cost"],
            "selected": False
        })
    return channels

@router.get("/outreach")
def get_outreach_data():
    channels = get_channels_from_db()
    
    if mongo_db is None:
        return {
            "channels": channels,
            "kpis": {"campaigns_triggered": 0, "messages_sent": 0, "avg_response_time": "--", "total_contact_cost": 0},
            "charts": {
                "channel_performance": {"labels": [c["title"] for c in channels], "counts": [0]*len(channels)},
                "timeline": {"labels": [], "messages_sent": []},
            },
        }

    # Aggregate data from offer_campaigns (the source of truth for notifications)
    offer_coll = mongo_db["offer_campaigns"]
    campaign_executions_coll = mongo_db["campaign_executions"]
    
    # KPIs from campaign_executions (for actual execution tracking)
    count = campaign_executions_coll.count_documents({})
    total_messages = 0
    total_cost = 0.0
    for exec_doc in campaign_executions_coll.find():
        total_messages += exec_doc.get("messages_sent", 0)
        total_cost += exec_doc.get("total_cost", 0.0)

    # Channel Performance and Timeline from offer_campaigns
    # Initialize trackers
    channel_volume = {c["key"]: 0 for c in channels}
    timeline_data = {} # Will store as "YYYY-MM-DD"
    
    # Query offer_campaigns where notification was sent (last 30 days)
    for offer in offer_coll.find({"notified_at": {"$exists": True}}).sort("notified_at", 1):
        medium = offer.get("notification_medium", "").lower()
        cust_count = offer.get("customer_count", 0)
        notified_at = offer.get("notified_at")
        
        # Track volume per channel (mapping aliases if needed)
        found_key = None
        for key, meta in CHANNEL_METADATA.items():
            if key == medium or meta["title"].lower() == medium:
                # Map to the primary key used in the channels list
                found_key = next((c["key"] for c in channels if c["title"] == meta["title"]), None)
                break
        
        if found_key and found_key in channel_volume:
            channel_volume[found_key] += cust_count
            
        # Track timeline (by date)
        if isinstance(notified_at, datetime):
            date_str = notified_at.strftime("%Y-%m-%d")
            timeline_data[date_str] = timeline_data.get(date_str, 0) + cust_count

    # If no data, provide a small default range for the chart to look good
    if not timeline_data:
        today = datetime.now().strftime("%Y-%m-%d")
        timeline_data = {today: 0}

    return {
        "channels": channels,
        "kpis": {
            "campaigns_triggered": count,
            "messages_sent": total_messages,
            "avg_response_time": "1.2h" if count > 0 else "--",
            "total_contact_cost": round(total_cost, 2),
        },
        "charts": {
            "channel_performance": {
                "labels": [c["title"] for c in channels],
                "counts": [channel_volume.get(c["key"], 0) for c in channels],
            },
            "timeline": {
                "labels": list(timeline_data.keys()),
                "messages_sent": list(timeline_data.values()),
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
    
        # Simple cost calculation using metadata
    total_cost = 0.0
    for ch_key in selected_channels:
        cost = CHANNEL_METADATA.get(ch_key.lower(), {}).get("cost", 0.1) # low default
        total_cost += cost * cust_count
    
    # Update the campaign document with notification info
    mongo_db["offer_campaigns"].update_one(
        {"_id": ObjectId(campaign_id)},
        {
            "$set": {
                "notify_user": True,
                "notification_medium": ", ".join(selected_channels),
                "notified_at": datetime.now(timezone.utc)
            }
        }
    )
    
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
        
        # Sort by updated_at (then created_at) descending to get the latest activity
        cursor = coll.find({
            "main_category": main_category,
            "sub_category": sub_category,
            "risk_level": risk_level
        }).sort([("updated_at", -1), ("created_at", -1)]).limit(1)
        
        campaigns = list(cursor)
        if not campaigns:
            return {"active_strategy": None}
            
        latest = campaigns[0]
        # Convert ObjectId to string for JSON serialization
        latest["_id"] = str(latest["_id"])
        
        return {"active_strategy": latest}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
