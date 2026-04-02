from fastapi import APIRouter

router = APIRouter()


@router.get("/eda")
def get_eda_data():
    return {
        "crm_billing": {
            "kpis": {"subscribers": 7043, "churn_rate": 26.54, "avg_monthly_charges": 64.76, "avg_cltv": 4872},
            "churn_distribution": {"labels": ["No", "Yes"], "values": [5174, 1869]},
            "monthly_charges_hist": {
                "bin_labels": ["18-30", "30-45", "45-60", "60-75", "75-90", "90-105", "105-120"],
                "stayed": [800, 650, 520, 480, 620, 380, 220],
                "churned": [120, 180, 220, 280, 350, 420, 300],
            },
            "churn_by_contract": {"labels": ["Month-to-month", "One year", "Two year"], "values": [42.7, 11.3, 2.8]},
            "top_churn_reasons": {
                "labels": ["Competitor made better offer", "Attitude of support person", "Price too high", "Long distance charges", "Lack of self-service", "Network reliability", "Product dissatisfaction", "Limited range of services", "Extra data charges", "Competitor had better devices"],
                "values": [841, 220, 211, 183, 162, 155, 148, 130, 115, 72],
            },
        },
        "complaints": {
            "kpis": {"total_tickets": 2224, "source": "Call Centre"},
            "status_breakdown": {"labels": ["Closed", "Open", "Pending", "Solved", "In Progress"], "values": [890, 445, 334, 333, 222]},
            "volume_over_time": {"labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], "values": [180, 210, 350, 420, 380, 320]},
            "top_states": {"labels": ["Georgia", "Florida", "California", "Tennessee", "Texas"], "values": [425, 312, 289, 245, 198]},
            "complaint_keywords": {
                "labels": ["service", "speed", "billing", "internet", "connection", "data", "charge", "poor", "slow", "outage"],
                "values": [340, 280, 250, 230, 210, 190, 170, 150, 130, 110],
            },
        },
        "subscriber_intel": {
            "age_distribution": {
                "bin_labels": ["18-25", "25-35", "35-45", "45-55", "55-65", "65+"],
                "stayed": [410, 980, 1200, 1050, 880, 654],
                "churned": [180, 420, 380, 340, 310, 239],
            },
            "satisfaction_distribution": {"scores": [1, 2, 3, 4, 5], "stayed": [520, 610, 1240, 1450, 1354], "churned": [580, 450, 380, 280, 179]},
            "churn_categories": {
                "labels": ["Competitor", "Dissatisfaction", "Price", "Attitude", "Other"],
                "values": [841, 321, 211, 220, 276],
            },
            "referral_churn": {"labels": ["Referred", "Not Referred"], "values": [8.3, 28.4]},
        },
        "usage_services": {
            "tenure_vs_charges": {
                "stayed": {"x": [1, 5, 12, 24, 36, 48, 60, 72], "y": [45, 55, 65, 70, 75, 80, 85, 90]},
                "churned": {"x": [1, 3, 6, 9, 12, 18, 24, 36], "y": [70, 75, 80, 85, 90, 95, 100, 105]},
            },
            "service_churn_rates": {
                "labels": ["Online Security", "Online Backup", "Device Protection", "Tech Support", "Streaming TV", "Streaming Movies"],
                "values": [41.8, 39.9, 39.1, 41.6, 30.1, 29.7],
            },
            "churn_by_payment": {
                "labels": ["Electronic check", "Mailed check", "Bank transfer", "Credit card"],
                "values": [45.3, 19.1, 16.6, 15.2],
            },
            "churn_by_internet": {
                "labels": ["DSL", "Fiber optic", "No Internet"],
                "values": [19.0, 41.9, 7.4],
            },
        },
    }
