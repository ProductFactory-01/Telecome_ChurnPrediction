"""Static data for Data Agent (Agent 1) tab."""

DATA_SOURCES = [
    {"key": "crm", "icon": "👤", "title": "CRM Profiles", "description": "Demographics, contract details, account history", "records": 7043, "active": True},
    {"key": "billing", "icon": "💳", "title": "Billing & Usage", "description": "Monthly charges, total revenue, payment methods", "records": 7043, "active": True},
    {"key": "network", "icon": "📡", "title": "Network Quality", "description": "Signal strength, latency, outage history", "records": 5891, "active": False},
    {"key": "sentiment", "icon": "💬", "title": "Social Sentiment", "description": "NPS scores, social mentions, complaint tone", "records": 3412, "active": False},
    {"key": "complaints", "icon": "📋", "title": "Customer Complaints", "description": "Ticket logs, resolution times, escalations", "records": 2224, "active": True},
    {"key": "callcenter", "icon": "📞", "title": "Call Centre Logs", "description": "Interaction history, call duration, CSAT", "records": 4567, "active": False},
]

DATA_AGENT_KPIS = {
    "sources_connected": 3,
    "records_unified": 16310,
    "merge_completeness": 72,
    "unique_subscribers": 7043,
}
