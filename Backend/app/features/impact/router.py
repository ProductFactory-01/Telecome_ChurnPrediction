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

# Configurable targets
BUDGET_CEILING = 5000.0
REVENUE_TARGET = 2_400_000
SUBSCRIBERS_TARGET = 1761


def _empty_response():
    """Return a zero-state response when no data is available."""
    return {
        "hero_kpis": {
            "churn_rate_reduction": 0,
            "offer_acceptance_rate": 0,
            "clv_increase": 0,
            "outreach_cost_reduction": 0,
        },
        "secondary_kpis": {
            "churn_identification_rate": {"value": 0, "min": 60, "stretch": 75},
            "offer_uplift": {"value": 0, "min": 20, "stretch": 35},
            "revenue_protected": {"value": 0, "target": REVENUE_TARGET},
            "subscribers_retained": {"value": 0, "target": SUBSCRIBERS_TARGET},
        },
        "roi_summary": {
            "revenue_protected": 0,
            "subscribers_retained": 0,
            "detection_accuracy": 91,
            "signal_to_action": None,
        },
        "charts": {
            "retention_by_risk": {"labels": [], "targeted": [], "retained": []},
            "churn_score_shift": {"labels": [], "at_campaign": [], "current": []},
            "spend_vs_revenue": {"labels": [], "cumulative_spend": [], "cumulative_revenue_protected": []},
            "cost_by_channel": {"labels": [], "values": []},
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


def _get_baseline_churn_rate() -> float:
    """Get the overall churn rate from the Churn_New table as a baseline."""
    engine = get_db_engine()
    if not engine:
        return 26.5  # industry fallback

    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN "Churn Value" = 1 THEN 1 ELSE 0 END) as churned
                FROM public."Churn_New"
            """))
            row = result.fetchone()
            if row and row[0] > 0:
                return round((row[1] / row[0]) * 100, 1)
    except Exception as e:
        print(f"[Impact] Baseline churn rate error: {e}")

    return 26.5


def _get_total_churned_count() -> int:
    """Get total number of churned customers from Churn_New."""
    engine = get_db_engine()
    if not engine:
        return 0

    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT COUNT(*) FROM public."Churn_New" WHERE "Churn Value" = 1
            """))
            row = result.fetchone()
            return row[0] if row else 0
    except Exception as e:
        print(f"[Impact] Total churned count error: {e}")
        return 0


@router.get("/impact")
def get_impact_data():
    if mongo_db is None:
        return _empty_response()

    # ── Step 1: Fetch all offer campaigns & executions ──
    offer_coll = mongo_db["offer_campaigns"]
    exec_coll = mongo_db["campaign_executions"]

    all_campaigns = list(offer_coll.find({}))
    all_executions = list(exec_coll.find({}))

    if not all_campaigns:
        return _empty_response()

    # Build execution lookup: offer_campaign_id → execution docs
    exec_lookup = {}
    for ex in all_executions:
        oc_id = str(ex.get("offer_campaign_id", ""))
        if oc_id not in exec_lookup:
            exec_lookup[oc_id] = []
        exec_lookup[oc_id].append(ex)

    # ── Step 2: Collect all targeted customer IDs and campaign-time data ──
    all_customer_ids = set()
    campaign_time_data = {}
    risk_targeted = defaultdict(set)
    offer_type_targeted = defaultdict(set)

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

    # ── Step 4: Core computations ──
    total_targeted = len(all_customer_ids)
    retained_ids = set()
    total_revenue_protected = 0.0
    retained_cltv_sum = 0.0
    campaign_cltv_sum = 0.0

    for cid in all_customer_ids:
        ct = campaign_time_data.get(cid, {})
        campaign_cltv_sum += ct.get("cltv", 0)

        current = current_status.get(cid)
        if current and current["status"] == "Stayed":
            retained_ids.add(cid)
            rev = current.get("cltv") or current.get("total_revenue") or 0
            total_revenue_protected += rev
            retained_cltv_sum += current.get("cltv", 0)

    total_retained = len(retained_ids)
    total_spend = sum(ex.get("total_cost", 0.0) for ex in all_executions)
    total_messages = sum(ex.get("messages_sent", 0) for ex in all_executions)

    # ── Step 5: Hero KPIs ──
    # Churn Rate Reduction: % of at-risk customers saved from churning
    churn_rate_reduction = round((total_retained / total_targeted * 100), 1) if total_targeted > 0 else 0

    # Offer Acceptance Rate: proxy = delivery rate × retention rate
    notified_count = sum(1 for c in all_campaigns if c.get("notified_at") is not None)
    delivery_rate = (notified_count / len(all_campaigns)) if all_campaigns else 0
    retention_rate = (total_retained / total_targeted) if total_targeted > 0 else 0
    offer_acceptance_rate = round(delivery_rate * retention_rate * 100, 1)

    # CLV Increase: % increase in avg CLTV (retained vs at-campaign)
    avg_cltv_at_campaign = (campaign_cltv_sum / total_targeted) if total_targeted > 0 else 0
    avg_cltv_retained = (retained_cltv_sum / total_retained) if total_retained > 0 else 0
    clv_increase = 0.0
    if avg_cltv_at_campaign > 0 and total_retained > 0:
        clv_increase = round(((avg_cltv_retained - avg_cltv_at_campaign) / avg_cltv_at_campaign) * 100, 1)

    # Outreach Cost Reduction: efficiency = 1 - (spend / revenue_saved) → % savings
    outreach_cost_reduction = 0.0
    if total_revenue_protected > 0:
        outreach_cost_reduction = round((1 - (total_spend / total_revenue_protected)) * 100, 1)

    # ── Step 6: Secondary KPIs ──
    total_churned_in_system = _get_total_churned_count()
    churn_identification_rate = 0.0
    if total_churned_in_system > 0:
        churn_identification_rate = round((total_targeted / total_churned_in_system) * 100, 1)

    baseline_churn_rate = _get_baseline_churn_rate()
    targeted_churn_rate = ((total_targeted - total_retained) / total_targeted * 100) if total_targeted > 0 else baseline_churn_rate
    offer_uplift = round(baseline_churn_rate - targeted_churn_rate, 1)

    # ── Step 7: Signal-to-Action latency ──
    signal_to_action = None
    latencies = []
    for camp in all_campaigns:
        camp_id = str(camp.get("_id", ""))
        created = camp.get("created_at")
        execs = exec_lookup.get(camp_id, [])
        for ex in execs:
            triggered = ex.get("triggered_at")
            if created and triggered and isinstance(created, datetime) and isinstance(triggered, datetime):
                delta = (triggered - created).total_seconds() / 3600  # hours
                if delta >= 0:
                    latencies.append(delta)
    if latencies:
        avg_latency = sum(latencies) / len(latencies)
        if avg_latency < 1:
            signal_to_action = f"{int(avg_latency * 60)}m"
        else:
            signal_to_action = f"{avg_latency:.1f}h"

    # ── Step 8: Charts — Retention by Risk Level ──
    risk_labels = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]
    risk_targeted_counts = []
    risk_retained_counts = []
    for rl in risk_labels:
        ts = risk_targeted.get(rl, set())
        rc = sum(1 for cid in ts if cid in retained_ids)
        risk_targeted_counts.append(len(ts))
        risk_retained_counts.append(rc)

    # ── Step 9: Charts — Churn Score Shift ──
    risk_campaign_scores = defaultdict(list)
    risk_current_scores = defaultdict(list)
    for cid, ct_data in campaign_time_data.items():
        rl = ct_data["risk_level"]
        risk_campaign_scores[rl].append(ct_data["churn_score"])
        current = current_status.get(cid)
        risk_current_scores[rl].append(current["churn_score"] if current else ct_data["churn_score"])

    churn_at_campaign = []
    churn_current = []
    for rl in risk_labels:
        cs = risk_campaign_scores.get(rl, [])
        cu = risk_current_scores.get(rl, [])
        churn_at_campaign.append(round(sum(cs) / len(cs), 1) if cs else 0)
        churn_current.append(round(sum(cu) / len(cu), 1) if cu else 0)

    # ── Step 10: Charts — Spend vs Revenue Protected ──
    date_spend = defaultdict(float)
    date_revenue = defaultdict(float)
    for camp in all_campaigns:
        camp_id = str(camp.get("_id", ""))
        created_at = camp.get("created_at")
        if not created_at:
            continue
        date_key = created_at.strftime("%Y-%m-%d") if isinstance(created_at, datetime) else str(created_at)[:10]
        execs = exec_lookup.get(camp_id, [])
        date_spend[date_key] += sum(e.get("total_cost", 0.0) for e in execs)
        for cust in camp.get("customers", []):
            cid = str(cust.get("customer_id", ""))
            if cid in retained_ids:
                current = current_status.get(cid, {})
                date_revenue[date_key] += current.get("cltv", 0) or current.get("total_revenue", 0)

    all_dates = sorted(set(list(date_spend.keys()) + list(date_revenue.keys())))
    cum_spend, cum_rev = [], []
    rs, rr = 0.0, 0.0
    for d in all_dates:
        rs += date_spend.get(d, 0)
        rr += date_revenue.get(d, 0)
        cum_spend.append(round(rs, 2))
        cum_rev.append(round(rr, 2))

    # ── Step 11: Charts — Cost by Channel ──
    channel_costs = defaultdict(float)
    for ex in all_executions:
        channels = ex.get("channels", [])
        cost = ex.get("total_cost", 0.0)
        if channels:
            per_ch = cost / len(channels)
            for ch in channels:
                display = CHANNEL_DISPLAY.get(ch.lower().strip(), ch.title())
                channel_costs[display] += per_ch
        else:
            channel_costs["Unknown"] += cost

    # ── Step 12: Charts — Retention by Offer Type ──
    offer_type_labels = list(offer_type_targeted.keys())
    offer_targeted_counts = []
    offer_retained_counts = []
    for ot in offer_type_labels:
        ts = offer_type_targeted.get(ot, set())
        rc = sum(1 for cid in ts if cid in retained_ids)
        offer_targeted_counts.append(len(ts))
        offer_retained_counts.append(rc)

    # ── Step 13: Campaign Activity Log ──
    campaign_log = []
    for camp in all_campaigns:
        camp_id = str(camp.get("_id", ""))
        execs = exec_lookup.get(camp_id, [])
        latest_exec = max(execs, key=lambda e: e.get("triggered_at", datetime.min)) if execs else None

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
    campaign_log.sort(key=lambda x: x.get("triggered_at") or "", reverse=True)

    # ── Build Response ──
    return {
        "hero_kpis": {
            "churn_rate_reduction": churn_rate_reduction,
            "offer_acceptance_rate": offer_acceptance_rate,
            "clv_increase": clv_increase,
            "outreach_cost_reduction": outreach_cost_reduction,
        },
        "secondary_kpis": {
            "churn_identification_rate": {
                "value": min(churn_identification_rate, 100),
                "min": 60,
                "stretch": 75,
            },
            "offer_uplift": {
                "value": offer_uplift,
                "min": 20,
                "stretch": 35,
            },
            "revenue_protected": {
                "value": round(total_revenue_protected, 2),
                "target": REVENUE_TARGET,
            },
            "subscribers_retained": {
                "value": total_retained,
                "target": SUBSCRIBERS_TARGET,
            },
        },
        "roi_summary": {
            "revenue_protected": round(total_revenue_protected, 2),
            "subscribers_retained": total_retained,
            "detection_accuracy": 91,
            "signal_to_action": signal_to_action,
            "total_spend":total_spend,
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
                "labels": list(channel_costs.keys()),
                "values": [round(v, 2) for v in channel_costs.values()],
            },
            "retention_by_offer_type": {
                "labels": offer_type_labels,
                "targeted": offer_targeted_counts,
                "retained": offer_retained_counts,
            },
        },
        "campaign_log": campaign_log,
    }
