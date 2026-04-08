from pydantic import BaseModel


class CustomerInput(BaseModel):
    Gender: str
    SeniorCitizen: bool
    Partner: bool
    Dependents: bool
    TenureMonths: int
    PhoneService: bool
    MultipleLines: bool
    InternetService: str
    OnlineSecurity: bool
    OnlineBackup: bool
    DeviceProtection: bool
    TechSupport: bool
    StreamingTV: bool
    StreamingMovies: bool
    Contract: str
    PaperlessBilling: bool
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float
    Latitude: float = 13.0827
    Longitude: float = 80.2707
    
    # New core fields for comprehensive Churn LLM Prediction
    Age: int = 35
    Married: bool = False
    NumberOfDependents: int = 0
    Offer: str = "None"
    InternetType: str = "Fiber optic"
    AvgMonthlyGBDownload: float = 21.0
    UnlimitedData: bool = True
    SatisfactionScore: int = 3
    DroppedCalls: int = 0
    BlockedCalls: int = 0
    Latency: float = 45.0
    Jitter: float = 5.0
    PacketLoss: float = 0.0
    SignalStrength: float = 65.0
    Throughput: float = 100.0
    Complaint: str = "None"
    ComplaintFrequency: int = 0
    Under30: bool = False
    StreamingMusic: bool = False
    PaymentDelay: int = 0
    DeviceCapability: str = "4G"
    PlanChangeTracking: int = 0
    ComplaintType: str = "None"
    HexId: str = ""
