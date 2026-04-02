from fastapi import APIRouter

router = APIRouter()

OUTREACH_CHANNELS = [
    {"key": "sms", "icon": "💬", "title": "SMS", "accept_rate": 18, "cost_per_contact": 0.80, "selected": True},
    {"key": "email", "icon": "📧", "title": "Email", "accept_rate": 9, "cost_per_contact": 0.25, "selected": False},
    {"key": "push", "icon": "📱", "title": "App Push", "accept_rate": 28, "cost_per_contact": 0.05, "selected": True},
    {"key": "agent", "icon": "🧑‍💼", "title": "Live Agent", "accept_rate": 25, "cost_per_contact": 18.00, "selected": False},
    {"key": "inapp", "icon": "📲", "title": "In-App Banner", "accept_rate": 15, "cost_per_contact": 0.02, "selected": False},
]


@router.get("/outreach")
def get_outreach_data():
    return {
        "channels": OUTREACH_CHANNELS,
        "kpis": {
            "campaigns_triggered": 0,
            "messages_sent": 0,
            "avg_response_time": "--",
            "total_contact_cost": 0,
        },
        "charts": {
            "channel_performance": {
                "labels": ["SMS", "Email", "App Push", "Live Agent", "In-App"],
                "accept_rate": [18, 9, 28, 25, 15],
                "cost_efficiency": [22, 25, 30, 8, 28],
            },
            "timeline": {
                "labels": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
                "messages_sent": [0, 0, 0, 0, 0, 0, 0, 0, 0],
            },
        },
    }


@router.post("/outreach/trigger")
def trigger_outreach(payload: dict):
    return {"status": "triggered", "messages_sent": 0}


@router.post("/outreach/preview")
def preview_outreach(payload: dict):
    return {"preview_count": 4210, "channels": ["sms", "push"]}
