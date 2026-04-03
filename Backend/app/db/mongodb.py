from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
mongo_db_name = os.getenv("MONGO_DB", "churn_prediction") # Default to 'churn_prediction' if not set

client = MongoClient(mongo_uri)
db = client[mongo_db_name]