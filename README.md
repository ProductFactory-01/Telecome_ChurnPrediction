# Customer360 AI: Telecom Churn Prediction & Retention Engine

A premium, enterprise-grade AI platform designed for telecommunications companies to proactively identify at-risk subscribers and execute hyper-personalized retention strategies.

## 🚀 Product Vision
Customer360 AI transforms raw telecom data (CDR, SMS, Data Sessions) into actionable retention campaigns. By combining deterministic Machine Learning (XGBoost) with Generative AI (LLMs), the platform doesn't just predict *who* will leave, but also suggests *what* will make them stay.

---

## 🛠️ Technology Stack

### Backend (Intelligence Layer)
- **Framework**: FastAPI (High-performance Python API)
- **AI/LLM**: LangChain, Groq Cloud (Llama 3 / Mixtral)
- **Machine Learning**: XGBoost, Scikit-learn, Pandas, NumPy
- **Database**: SQLAlchemy (SQLite for development, compatible with PostgreSQL)
- **Inference**: Joblib for model serialization

### Frontend (Experience Layer)
- **Framework**: Next.js 15+ (App Router), React 19
- **Styling**: Tailwind CSS 4 (Modern utility-first CSS)
- **Animations**: Framer Motion (Premium interaction design)
- **Visualizations**: Chart.js, React-ChartJS-2
- **Icons**: Lucide React

---

## 🔄 End-to-End Workflow

1.  **Data Ingestion (Data Agent)**: Ingest disconnected datasets (Calls, SMS, Billing) using an AI-guided pipeline.
2.  **Churn Prediction (Churn Scoring)**: The ML engine analyzes usage patterns to assign a churn probability (0-100%) to every subscriber.
3.  **Strategic Matching (Offer Engine)**: High-risk customers are segmented by churn drivers (e.g., "Network Issues" or "High Pricing").
4.  **Generative Retention (Outreach)**: AI generates personalized communication scripts (WhatsApp/Email) tailored to the specific reason for churn.
5.  **Loop Management (Live Impact)**: Real-time monitoring of retention campaign success and revenue protected.

---

## 📱 Page-by-Page Feature Glossary

### 1. Overview Dashboard
- **Total Churn KPI**: Live tracking of churned vs. active subscribers.
- **Risk Distribution**: Circular charts showing the breakdown of High, Medium, and Low risk cohorts.
- **Revenue at Risk**: Financial impact analysis of current churn trends.

### 2. Customer360 Data Agent
- **AI Upload Wizard**: Personalized drag-and-drop zone for CSV/Excel datasets.
- **Source Management**: Monitor connectivity for CDR, Billing, SMS, and Network streams.
- **Data Completeness**: Real-time health checks on ingested data dimensions.

### 3. Churn Scoring & Simulator
- **Risk Profiling**: Individual subscriber drill-down with detailed probability scores.
- **Feature Importance**: View exactly which factors (Contract, Tenure, Charges) are driving the risk.
- **Live Simulator**: "What-if" analysis to see how changing a customer's plan or contract affects their churn risk.

### 4. Personalised Offer Engine
- **Strategy Taxonomy**: Select churn drivers (Pricing, Network, Competitor) to filter audiences.
- **AI Offer Generator**: GenAI crafts 3 unique retention strategies (Discounts, Upgrades, Gamification) for the selected cohort.
- **Revenue Protection**: Estimates the amount of monthly revenue saved by the proposed offer.

### 5. Automated Outreach Agent
- **Script Generation**: Instantly create WhatsApp messages, Email templates, or Call Center scripts.
- **Tone Personalization**: Adjust communication style (Empathetic, Professional, Persuasive).
- **Campaign Execution**: Batch process outreach for entire cohorts with one click.

### 6. Live Impact Tracking
- **Campaign ROI**: Track the conversion rate of "Suggested Offers" to "Accepted Plans".
- **Agent Performance**: Monitor which AI strategies are performing best in the field.
- **Milestone Tracking**: Visual roadmap of retention goals and achievements.

---

## 🛠️ Setup & Installation

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure Environment: Create a `.env` file with:
   ```env
   GROQ_API_KEY=your_key_here
   DATABASE_URL=sqlite:///./telecom_churn.db
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Frontend/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:3000`.

---

## 🔐 Key Environment Variables

| Variable | Description |
| :--- | :--- |
| `GROQ_API_KEY` | Required for AI Offer & Outreach generation. |
| `DATABASE_URL` | Connection string for the persistence layer. |
| `NEXT_PUBLIC_API_URL` | Frontend pointer to the FastAPI backend (Default: http://localhost:8000). |

---

> [!TIP]
> **Pro Tip**: Use the **Data Explorer** tab to run custom SQL-like queries against the subscriber base for ad-hoc analysis.
