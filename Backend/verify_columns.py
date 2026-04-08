import pandas as pd
from app.database import get_db_engine

def check_merged_columns():
    engine = get_db_engine()
    if not engine:
        print("Engine failed")
        return
    try:
        df = pd.read_sql('SELECT * FROM source LIMIT 1', engine)
        print("Columns in source:", df.columns.tolist())
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_merged_columns()
