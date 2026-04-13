"""Pytest fixtures for tool server tests.

Uses SQLite in-memory database — no Docker or Postgres needed.
Patches JSONB/ARRAY types to work with SQLite.
"""

import os
import sys

# Set SQLite before any app imports
os.environ["DATABASE_URL"] = "sqlite:///test_asana.db"

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Patch PostgreSQL-specific types for SQLite compatibility
from sqlalchemy import JSON, String, event
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, TIMESTAMP

# Replace JSONB with JSON for SQLite
import sqlalchemy.dialects.postgresql as pg_dialect
pg_dialect.JSONB = JSON  # type: ignore

# Patch ARRAY to use JSON (store as JSON arrays in SQLite)
pg_dialect.ARRAY = lambda *args, **kwargs: JSON()  # type: ignore

# Now import app modules (they'll use patched types)
# We need to reload models since they import JSONB/ARRAY at module level
# Actually, since we haven't imported them yet, the patch will take effect

import importlib
# Force re-evaluation: clear any cached imports
for mod_name in list(sys.modules.keys()):
    if mod_name in ('models', 'db', 'schema', 'auth', 'audit', 'server') or mod_name.startswith('tools'):
        del sys.modules[mod_name]

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    from db import Base
    import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(autouse=True)
def clean_tables(engine):
    """Clean all tables before each test."""
    from db import Base
    from sqlalchemy import inspect as sa_inspect

    with engine.connect() as conn:
        inspector = sa_inspect(engine)
        for table_name in inspector.get_table_names():
            conn.execute(Base.metadata.tables[table_name].delete())
        conn.commit()
    yield


@pytest.fixture
def db_session(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def client(engine):
    """FastAPI test client with isolated DB session."""
    from server import app
    from db import get_db

    Session = sessionmaker(bind=engine)

    def override_get_db():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
