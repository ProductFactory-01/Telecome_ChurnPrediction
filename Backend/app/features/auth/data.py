import pandas as pd
from sqlalchemy import text
from app.database import get_db_engine
import logging

logger = logging.getLogger(__name__)

def create_users_table():
    engine = get_db_engine()
    if not engine:
        return
        
    query = """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    try:
        with engine.connect() as conn:
            conn.execute(text(query))
            conn.commit()
    except Exception as e:
        logger.error(f"Error creating users table: {e}")

def get_user_by_email(email: str):
    engine = get_db_engine()
    if not engine:
        return None
        
    query = "SELECT * FROM users WHERE email = :email"
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query), {"email": email}).mappings().first()
            return dict(result) if result else None
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        return None

def create_user(full_name: str, email: str, password_hash: str):
    engine = get_db_engine()
    if not engine:
        return None
        
    query = """
    INSERT INTO users (full_name, email, password_hash)
    VALUES (:full_name, :email, :password_hash)
    RETURNING id, full_name, email
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query), {
                "full_name": full_name,
                "email": email,
                "password_hash": password_hash
            }).mappings().first()
            conn.commit()
            return dict(result)
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return None
