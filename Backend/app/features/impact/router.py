from fastapi import APIRouter
from app.db.mongodb import db as mongo_db
from app.database import get_db_engine
from sqlalchemy import text
from datetime import datetime
from collections import defaultdict

router = APIRouter()

# Channel cost metadata (mirrors outreach router)
CHANNEL_COSTS = {
    "sms": 0.80, "email": 0.25, "whatsapp": 0.05, "push": 0.05,
    "agent": 18.00, "live agent": 18.00, "telegram": 0.02, "inapp": 0.02,
}

CHANNEL_DISPLAY = {
    "sms": "SMS", "email": "Email", "whatsapp": "WhatsApp", "push": "Push",
    "agent": "Live Agent", "live agent": "Live Agent",
    "telegram": "Telegram", "inapp": "In-App",
}

# Default budget ceiling for utilization meter
BUDGET_CEILING = 5000.0


def _empty_response():
    """Return a zero-state response when no data is available."""
    return {
        "executive_summary": {
            "customers_retained": 0,
            "revenue_protected": 0,
            "campaign_roi": 0,
            "total_spend": 0,
        },
        "meters": {
            "retention_rate": {"value": 0, "target": 100},
            "delivery_rate": {"value": 0, "target": 100},
            "budget_utilization": {"value": 0, "target": 100},
        },
        "charts": {
            "retention_by_risk": {"labels": [], "targeted": [], "retained": []},
            "churn_score_shift": {"labels": [], "at_campaign": [], "current": []},
            "spend_vs_revenue": {"labels": [], "cumulative_spend": [], "cumulative_revenue_protected": []},
            "cost_by_channel": {"labels": [], "values": []},
            "offer_type_distribution": {"labels": [], "values": []},
            "retention_by_offer_type": {"labels": [], "targeted": [], "retained": []},
        },
        "campaign_log": [],
    }


def _get_current_status_map(customer_ids: list) -> dict:
    """Query PostgreSQL merged table to get current Customer Status and CLTV for given IDs."""
    engine = get_db_engine()
    if not engine or not customer_ids:
        return {}

    status_map = {}
    # Process in batches to avoid exceeding SQL parameter limits
    batch_size = 500
    for i in range(0, len(customer_ids), batch_size):
        batch = customer_ids[i : i + batch_size]
        try:
            placeholders = ", ".join([f":id_{j}" for j in range(len(batch))])
            query_str = f"""
                SELECT "Customer ID", "Customer Status", "Churn Score", "CLTV", "Total Revenue", "Satisfaction Score"
                FROM public."merged"
                WHERE "Customer ID" IN ({placeholders})
            """
            params = {f"id_{j}": cid for j, cid in enumerate(batch)}
            with engine.connect() as conn:
                result = conn.execute(text(query_str), params)
                for row in result:
                    m = row._mapping
                    status_map[str(m["Customer ID"])] = {
                        "status": m.get("Customer Status", "Unknown"),
                        "churn_score": float(m.get("Churn Score") or 0),
                        "cltv": float(m.get("CLTV") or 0),
                        "total_revenue": float(m.get("Total Revenue") or 0),
                        "satisfaction": float(m.get("Satisfaction Score") or 0),
                    }
        except Exception as e:
            print(f"[Impact] Postgres query error: {e}")

    return status_map


@router.get("/impact")
def get_impact_data():
    if mongo_db is None:
        return _empty_response()

    # ── Step 1: Fetch all offer campaigns ──
    offer_coll = mongo_db["offer_campaigns"]
    exec_coll = mongo_db["campaign_executions"]

    all_campaigns = list(offer_coll.find({}))
    all_executions = list(exec_coll.find({}))

    if not all_campaigns:
        return _empty_response()

    # Build execution lookup: offer_campaign_id → execution doc
    exec_lookup = {}
    for ex in all_executions:
        oc_id = str(ex.get("offer_campaign_id", ""))
        if oc_id not in exec_lookup:
            exec_lookup[oc_id] = []
        exec_lookup[oc_id].append(ex)

    # ── Step 2: Collect all targeted customer IDs and campaign-time data ──
    all_customer_ids = set()
    # campaign_time_data: { customer_id: { churn_score, cltv, risk_level, offer_type } }
    campaign_time_data = {}
    # Track per-risk-level and per-offer-type
    risk_targeted = defaultdict(set)       # risk_level → set(customer_ids)
    offer_type_targeted = defaultdict(set) # offer_type → set(customer_ids)

    for camp in all_campaigns:
        risk_level = camp.get("risk_level", "Unknown")
        offer_type = camp.get("recommendation", {}).get("title", "Unknown")
        customers = camp.get("customers", [])

        for cust in customers:
            cid = str(cust.get("customer_id", ""))
            if not cid:
                continue
            all_customer_ids.add(cid)
            risk_targeted[risk_level].add(cid)
            offer_type_targeted[offer_type].add(cid)
            # Store campaign-time snapshot (latest campaign wins if duplicate)
            campaign_time_data[cid] = {
                "churn_score": float(cust.get("churn_score") or 0),
                "cltv": float(cust.get("cltv") or 0),
                "monthly_charges": float(cust.get("monthly_charges") or 0),
                "total_charges": float(cust.get("total_charges") or 0),
                "risk_level": risk_level,
                "offer_type": offer_type,
            }

    # ── Step 3: Cross-reference with PostgreSQL for current status ──
    current_status = _get_current_status_map(list(all_customer_ids))

    # ── Step 4: Compute Executive Summary ──
    total_targeted = len(all_customer_ids)
    retained_ids = set()
    total_revenue_protected = 0.0

    for cid in all_customer_ids:
        current = current_status.get(cid)
        if current and current["status"] == "Stayed":
            retained_ids.add(cid)
            # Use CLTV as revenue protected, fallback to total_revenue
            rev = current.get("cltv") or current.get("total_revenue") or 0
            total_revenue_protected += rev

    total_retained = len(retained_ids)

    # Total campaign spend from executions
    total_spend = sum(ex.get("total_cost", 0.0) for ex in all_executions)

    # ROI
    campaign_roi = 0.0
    if total_spend > 0:
        campaign_roi = round(((total_revenue_protected - total_spend) / total_spend) * 100, 1)

    # ── Step 5: Performance Meters ──
    retention_rate = round((total_retained / total_targeted * 100), 1) if total_targeted > 0 else 0
    
    # Delivery rate: campaigns that have been notified / total campaigns
    notified_count = sum(1 for c in all_campaigns if c.get("notified_at") is not None)
    delivery_rate = round((notified_count / len(all_campaigns) * 100), 1) if all_campaigns else 0
    
    budget_utilization = round((total_spend / BUDGET_CEILING * 100), 1) if BUDGET_CEILING > 0 else 0

    # ── Step 6: Retention by Risk Level ──
    risk_labels = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]
    risk_targeted_counts = []
    risk_retained_counts = []
    for rl in risk_labels:
        targeted_set = risk_targeted.get(rl, set())
        retained_count = sum(1 for cid in targeted_set if cid in retained_ids)
        risk_targeted_counts.append(len(targeted_set))
        risk_retained_counts.append(retained_count)

    # ── Step 7: Churn Score Shift ──
    # Average churn score at campaign time vs current, grouped by risk level
    risk_campaign_scores = defaultdict(list)
    risk_current_scores = defaultdict(list)
    for cid, ct_data in campaign_time_data.items():
        rl = ct_data["risk_level"]
        risk_campaign_scores[rl].append(ct_data["churn_score"])
        current = current_status.get(cid)
        if current:
            risk_current_scores[rl].append(current["churn_score"])
        else:
            risk_current_scores[rl].append(ct_data["churn_score"])  # no update available

    churn_at_campaign = []
    churn_current = []
    for rl in risk_labels:
        camp_scores = risk_campaign_scores.get(rl, [])
        curr_scores = risk_current_scores.get(rl, [])
        churn_at_campaign.append(round(sum(camp_scores) / len(camp_scores), 1) if camp_scores else 0)
        churn_current.append(round(sum(curr_scores) / len(curr_scores), 1) if curr_scores else 0)

    # ── Step 8: Spend vs Revenue Protected (timeline) ──
    # Group by campaign created_at date
    date_spend = defaultdict(float)
    date_revenue = defaultdict(float)

    for camp in all_campaigns:
        camp_id = str(camp.get("_id", ""))
        created_at = camp.get("created_at")
        if not created_at:
            continue
        date_key = created_at.strftime("%Y-%m-%d") if isinstance(created_at, datetime) else str(created_at)[:10]

        # Spend for this campaign from its executions
        execs = exec_lookup.get(camp_id, [])
        camp_spend = sum(e.get("total_cost", 0.0) for e in execs)
        date_spend[date_key] += camp_spend

        # Revenue protected for this campaign's customers
        for cust in camp.get("customers", []):
            cid = str(cust.get("customer_id", ""))
            if cid in retained_ids:
                current = current_status.get(cid, {})
                date_revenue[date_key] += current.get("cltv", 0) or current.get("total_revenue", 0)

    # Build cumulative timeline
    all_dates = sorted(set(list(date_spend.keys()) + list(date_revenue.keys())))
    cum_spend = []
    cum_rev = []
    running_spend = 0.0
    running_rev = 0.0
    for d in all_dates:
        running_spend += date_spend.get(d, 0)
        running_rev += date_revenue.get(d, 0)
        cum_spend.append(round(running_spend, 2))
        cum_rev.append(round(running_rev, 2))

    # ── Step 9: Cost by Channel ──
    channel_costs = defaultdict(float)
    for ex in all_executions:
        channels = ex.get("channels", [])
        cost = ex.get("total_cost", 0.0)
        if channels:
            per_channel = cost / len(channels)
            for ch in channels:
                ch_key = ch.lower().strip()
                display = CHANNEL_DISPLAY.get(ch_key, ch.title())
                channel_costs[display] += per_channel
        else:
            channel_costs["Unknown"] += cost

    cost_channel_labels = list(channel_costs.keys())
    cost_channel_values = [round(v, 2) for v in channel_costs.values()]

    # ── Step 10: Offer Type Distribution ──
    offer_type_counts = defaultdict(int)
    for camp in all_campaigns:
        ot = camp.get("recommendation", {}).get("title", "Unknown")
        offer_type_counts[ot] += 1

    # ── Step 11: Retention by Offer Type ──
    offer_type_labels = list(offer_type_targeted.keys())
    offer_targeted_counts = []
    offer_retained_counts = []
    for ot in offer_type_labels:
        targeted_set = offer_type_targeted.get(ot, set())
        retained_count = sum(1 for cid in targeted_set if cid in retained_ids)
        offer_targeted_counts.append(len(targeted_set))
        offer_retained_counts.append(retained_count)

    # ── Step 12: Campaign Activity Log ──
    campaign_log = []
    for camp in all_campaigns:
        camp_id = str(camp.get("_id", ""))
        execs = exec_lookup.get(camp_id, [])
        
        latest_exec = None
        if execs:
            latest_exec = max(execs, key=lambda e: e.get("triggered_at", datetime.min))

        campaign_log.append({
            "document_name": camp.get("document_name", ""),
            "risk_level": camp.get("risk_level", ""),
            "main_category": camp.get("main_category", ""),
            "offer_type": camp.get("recommendation", {}).get("title", ""),
            "customer_count": camp.get("customer_count", 0),
            "channel": camp.get("notification_medium", "—"),
            "cost": round(sum(e.get("total_cost", 0) for e in execs), 2),
            "status": latest_exec.get("status", "pending") if latest_exec else "pending",
            "triggered_at": (
                latest_exec["triggered_at"].isoformat()
                if latest_exec and isinstance(latest_exec.get("triggered_at"), datetime)
                else None
            ),
        })

    # Sort log by triggered_at descending (most recent first)
    campaign_log.sort(key=lambda x: x.get("triggered_at") or "", reverse=True)

    # ── Build Response ──
    return {
        "executive_summary": {
            "customers_retained": total_retained,
            "revenue_protected": round(total_revenue_protected, 2),
            "campaign_roi": campaign_roi,
            "total_spend": round(total_spend, 2),
        },
        "meters": {
            "retention_rate": {"value": retention_rate, "target": 100},
            "delivery_rate": {"value": delivery_rate, "target": 100},
            "budget_utilization": {"value": min(budget_utilization, 100), "target": 100},
        },
        "charts": {
            "retention_by_risk": {
                "labels": risk_labels,
                "targeted": risk_targeted_counts,
                "retained": risk_retained_counts,
            },
            "churn_score_shift": {
                "labels": risk_labels,
                "at_campaign": churn_at_campaign,
                "current": churn_current,
            },
            "spend_vs_revenue": {
                "labels": all_dates,
                "cumulative_spend": cum_spend,
                "cumulative_revenue_protected": cum_rev,
            },
            "cost_by_channel": {
                "labels": cost_channel_labels,
                "values": cost_channel_values,
            },
            "offer_type_distribution": {
                "labels": list(offer_type_counts.keys()),
                "values": list(offer_type_counts.values()),
            },
            "retention_by_offer_type": {
                "labels": offer_type_labels,
                "targeted": offer_targeted_counts,
                "retained": offer_retained_counts,
            },
        },
        "campaign_log": campaign_log,
    }
