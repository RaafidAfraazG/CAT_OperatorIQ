import sys
import os

# Add backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine
from app.db.models import Base

def create_tables():
    print("=== Creating Database Tables ===")
    print("Dropping existing tables (if any) to ensure clean schema...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables defined in models...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # List created tables
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\nTotal tables created in PostgreSQL: {len(tables)}")
    for t in sorted(tables):
        print(f" - {t}")

if __name__ == "__main__":
    create_tables()
