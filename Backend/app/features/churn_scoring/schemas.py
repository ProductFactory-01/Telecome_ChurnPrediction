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
