"""Seed the database by reading JSON files and inserting directly via SQLAlchemy.

Usage:
  python seed_app.py                  # Uses DATABASE_URL env or default
  python seed_app.py --base-url URL   # Uses POST /step API instead of direct DB
"""

import json
import os
import sys

# Allow imports from the app directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text

from db import SessionLocal, engine, Base

# Import all models so metadata is populated
import models  # noqa: F401
from auth import hash_password


SEED_DIR = os.path.join(os.path.dirname(__file__), "..", "seed_data")

# Ordered to respect foreign key constraints
SEED_ORDER = [
    ("organization.json", "organizations"),
    ("users.json", "users"),
    ("teams.json", "teams"),
    ("team_members.json", "team_members"),
    ("projects.json", "projects"),
    ("project_members.json", "project_members"),
    ("sections.json", "sections"),
    ("user_task_sections.json", "user_task_sections"),
    ("tasks.json", "tasks"),
    ("subtasks.json", "tasks"),  # subtasks go into the tasks table
    ("task_projects.json", "task_projects"),
    ("tags.json", "tags"),
    ("task_tags.json", "task_tags"),
    ("custom_fields.json", "custom_fields"),
    ("custom_field_options.json", "custom_field_options"),
    ("project_custom_fields.json", "project_custom_fields"),
    ("custom_field_values.json", "task_custom_field_values"),
    ("comments.json", "comments"),
    ("comment_likes.json", "comment_likes"),
    ("mentions.json", "mentions"),
    ("task_followers.json", "task_followers"),
    ("dependencies.json", "task_dependencies"),
    ("notifications.json", "notifications"),
    ("attachments.json", "attachments"),
    ("saved_searches.json", "saved_searches"),
    ("project_status_updates.json", "project_status_updates"),
    ("dashboard_widgets.json", "dashboard_widgets"),
    ("goals.json", "goals"),
    ("portfolios.json", "portfolios"),
    ("portfolio_projects.json", "portfolio_projects"),
    ("templates.json", "project_templates"),
    ("messages.json", "messages"),
    ("message_replies.json", "message_replies"),
    ("forms.json", "forms"),
]


def load_json(filename: str) -> list[dict]:
    path = os.path.join(SEED_DIR, filename)
    if not os.path.exists(path):
        print(f"  SKIP: {filename} not found")
        return []
    with open(path) as f:
        data = json.load(f)
    if isinstance(data, dict):
        data = [data]
    return data


def seed_direct():
    """Seed using direct SQLAlchemy inserts."""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        total = 0
        for filename, table_name in SEED_ORDER:
            records = load_json(filename)
            if not records:
                continue

            # Use raw SQL insert to avoid ORM validation issues with seed data
            table = Base.metadata.tables.get(table_name)
            if table is None:
                print(f"  WARN: table '{table_name}' not found in metadata, skipping {filename}")
                continue

            inserted = 0
            for record in records:
                # Filter to only columns that exist in the table
                valid_cols = {c.name for c in table.columns}
                filtered = {k: v for k, v in record.items() if k in valid_cols}
                if not filtered:
                    continue

                # Hash passwords for users table
                if table_name == "users" and "password_hash" in filtered:
                    filtered["password_hash"] = hash_password(filtered["password_hash"])

                try:
                    db.execute(table.insert().values(**filtered))
                    inserted += 1
                except Exception as e:
                    db.rollback()
                    print(f"  ERROR inserting into {table_name}: {e}")
                    # Try to continue with remaining records
                    continue

            if inserted > 0:
                db.commit()
                total += inserted
                print(f"  {filename} -> {table_name}: {inserted} rows")

        print(f"\nSeed complete: {total} total rows inserted")
        return total

    finally:
        db.close()


def seed_via_api(base_url: str):
    """Seed using POST /step API calls (for Docker/remote usage)."""
    import requests

    # Wait for server health
    print("Waiting for server...")
    for _ in range(60):
        try:
            r = requests.get(f"{base_url}/health", timeout=5)
            if r.status_code == 200:
                break
        except requests.ConnectionError:
            pass
        import time
        time.sleep(1)
    else:
        print("Server not healthy after 60s")
        sys.exit(1)

    print("Server is healthy, resetting database...")
    requests.post(f"{base_url}/reset", timeout=30)

    # For API mode, we need to map seed data to tool calls
    # This is a simplified version — direct DB seeding is preferred
    print("API-mode seeding not fully implemented. Use direct DB seeding instead.")
    print("Running direct seed instead...")
    seed_direct()


def verify(db=None):
    """Print row counts per table."""
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False

    try:
        from sqlalchemy import inspect as sa_inspect
        inspector = sa_inspect(engine)
        table_names = inspector.get_table_names()
        print("\nVerification:")
        total = 0
        for table in sorted(table_names):
            count = db.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
            if count > 0:
                print(f"  {table}: {count}")
                total += count
        print(f"  TOTAL: {total}")
        return total > 0
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    if "--base-url" in sys.argv:
        idx = sys.argv.index("--base-url")
        base_url = sys.argv[idx + 1]
        seed_via_api(base_url)
    else:
        seed_direct()
        verify()
