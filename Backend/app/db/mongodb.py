from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def _clean_env(value: str | None) -> str | None:
	if value is None:
		return None
	return value.strip().strip('"').strip("'")


mongo_uri = _clean_env(os.getenv("MONGO_URI"))
mongo_db_name = _clean_env(os.getenv("MONGO_DB")) or "churn_prediction"

client = None
db = None

if mongo_uri:
	try:
		client = MongoClient(mongo_uri)
		db = client[mongo_db_name]
	except Exception as e:
		# Keep app startup alive even if Mongo config is invalid.
		print(f"Warning: Failed to initialize MongoDB client: {e}")