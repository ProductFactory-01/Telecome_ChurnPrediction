from fastapi import APIRouter

router = APIRouter()


@router.get("/role-views")
def get_role_views():
    return {
        "noc": {
            "kpis": [
                {"label": "Critical Churn Alerts", "value": "127", "variant": "red"},
                {"label": "Network Incidents", "value": "23", "variant": "amber"},
                {"label": "Signal-to-Action", "value": "< 5 min", "variant": "default"},
                {"label": "Restoration Rate", "value": "94.2%", "variant": "green"},
            ],
            "alerts": [
                {"type": "critical", "icon": "🔴", "title": "Mass Churn Cluster — ZIP 90210", "description": "15+ subscribers flagged high-risk in 2hrs — network outage correlation"},
                {"type": "warning", "icon": "🟡", "title": "Fiber Region NE-04 Degradation", "description": "Quality down 15% — 34 new high-risk flags"},
            ],
            "charts": {
                "region": {"labels": ["NE-01", "NE-02", "NE-04", "SW-01", "SW-02", "SE-01", "NW-01"], "high": [18, 12, 34, 22, 15, 9, 11], "medium": [45, 38, 52, 41, 33, 28, 30]},
                "alerts_30d": {"labels": ["D1", "D5", "D10", "D15", "D20", "D25", "D30"], "critical": [3, 5, 7, 4, 6, 3, 5], "warning": [8, 12, 15, 10, 14, 9, 11]},
            },
        },
        "crm": {
            "kpis": [
                {"label": "Active Campaigns", "value": "12", "variant": "amber"},
                {"label": "Offers Accepted Today", "value": "34", "variant": "green"},
                {"label": "Agent Handoff Queue", "value": "18", "variant": "default"},
                {"label": "Saved (MTD)", "value": "289", "variant": "purple"},
            ],
            "alerts": [
                {"type": "critical", "icon": "🔴", "title": "High-Value: Sub #4821 — Score 0.96", "description": "CLV $12,400 | Contract expires 3 days | Recommended: Premium upgrade + loyalty"},
                {"type": "warning", "icon": "🟡", "title": '"Spring Retention" underperforming', "description": "11% vs 20% target — switching to gamification recommended"},
            ],
            "charts": {
                "campaign": {"labels": ["Spring", "Win-Back", "Loyalty", "Upgrade", "Gamify", "Renewal"], "sent": [450, 320, 280, 190, 150, 380], "accepted": [52, 41, 58, 38, 42, 72]},
                "channels": {"labels": ["SMS", "Email", "Push", "Agent", "In-App"], "accept": [18, 9, 28, 25, 15], "efficiency": [22, 25, 30, 8, 20]},
            },
        },
        "finance": {
            "kpis": [
                {"label": "Revenue Protected (MTD)", "value": "$384K", "variant": "green"},
                {"label": "Revenue at Risk", "value": "$1.2M", "variant": "red"},
                {"label": "Retention ROI", "value": "8.2×", "variant": "amber"},
                {"label": "Cost per Save", "value": "$42", "variant": "default"},
            ],
            "charts": {
                "revenue": {"labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], "at_risk": [1400, 1350, 1280, 1200, 1120, 1050], "protected": [180, 220, 310, 384, 420, 480]},
                "clv_tier": {"labels": ["Premium", "High", "Medium", "Low"], "values": [58, 127, 289, 453]},
            },
        },
    }
