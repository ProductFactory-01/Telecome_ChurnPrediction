import uuid
import time
import pandas as pd
from typing import Dict, Any

# Simple in-memory session store for uploaded CSVs
# Dict: { session_id: { "df": DataFrame, "timestamp": float } }
_SESSION_STORE: Dict[str, Any] = {}

# Session timeout in seconds (30 minutes)
SESSION_TIMEOUT = 1800

def store_session(df: pd.DataFrame) -> str:
    """Stores a dataframe in memory and returns a session ID."""
    session_id = str(uuid.uuid4())
    _SESSION_STORE[session_id] = {
        "df": df,
        "timestamp": time.time()
    }
    # Clean up old sessions
    _cleanup_sessions()
    return session_id

def get_session(session_id: str) -> pd.DataFrame:
    """Retrieves a dataframe by session ID. Returns None if not found or expired."""
    session = _SESSION_STORE.get(session_id)
    if session:
        # Check expiry
        if time.time() - session["timestamp"] < SESSION_TIMEOUT:
            return session["df"]
        else:
            del _SESSION_STORE[session_id]
            
    return None

def clear_session(session_id: str):
    """Removes a session from memory."""
    if session_id in _SESSION_STORE:
        del _SESSION_STORE[session_id]

def _cleanup_sessions():
    """Removes expired sessions from memory."""
    now = time.time()
    expired = [sid for sid, s in _SESSION_STORE.items() if now - s["timestamp"] > SESSION_TIMEOUT]
    for sid in expired:
        del _SESSION_STORE[sid]
