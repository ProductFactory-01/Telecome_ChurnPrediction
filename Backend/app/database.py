import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

_engine = None

def get_db_engine():
    global _engine
    if _engine is not None:
        return _engine
        
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    load_dotenv(env_path)
    
    db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    try:
        _engine = create_engine(db_url, pool_pre_ping=True) if db_url else None
    except Exception as e:
        print(f"Warning: Failed to initialize DB engine: {e}")
        _engine = None
        
    return _engine
