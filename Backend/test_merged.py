from app.database import get_db_engine
from sqlalchemy import text

try:
    engine = get_db_engine()
    with engine.connect() as conn:
        res = conn.execute(text('SELECT "Customer ID", "Name", "email" FROM public."merged" LIMIT 1'))
        row = res.fetchone()
        if hasattr(row, '_mapping'):
            print(dict(row._mapping))
        else:
            print("Row found:", row)
except Exception as e:
    print(f"Error: {e}")
