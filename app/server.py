"""FastAPI main app: /step dispatcher, /tools, /health, /reset, /snapshot, auth endpoints, static file serving."""

import os
import sys

# Ensure app directory is on the path for imports
sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import inspect as sa_inspect, text
from sqlalchemy.orm import Session as DBSession

from auth import (
    authenticate_user,
    create_session,
    delete_session,
    get_current_user,
    get_session_token,
    hash_password,
)
from db import Base, SessionLocal, engine, get_db
from models import User
from tools import dispatch, get_tools


# ---------------------------------------------------------------------------
# Lifespan: create tables on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models so Base.metadata is populated
    import models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Migrate: add enabled_views column if it doesn't exist
    with engine.connect() as conn:
        inspector = sa_inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("projects")]
        if "enabled_views" not in columns:
            conn.execute(text(
                "ALTER TABLE projects ADD COLUMN enabled_views TEXT[] "
                "DEFAULT ARRAY['overview', 'list', 'board', 'timeline', 'dashboard']"
            ))
            conn.commit()

        # Migrate: add bookmarked column to notifications if it doesn't exist
        notif_columns = [c["name"] for c in inspector.get_columns("notifications")]
        if "bookmarked" not in notif_columns:
            conn.execute(text(
                "ALTER TABLE notifications ADD COLUMN bookmarked BOOLEAN DEFAULT FALSE"
            ))
            conn.commit()

    yield


app = FastAPI(title="Asana Clone Tool Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class StepAction(BaseModel):
    tool_name: str
    parameters: dict = {}


class StepRequest(BaseModel):
    action: StepAction


class LoginRequest(BaseModel):
    username: str
    password: str


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# Tools registry
# ---------------------------------------------------------------------------

@app.get("/tools")
def tools():
    return {"tools": get_tools()}


# ---------------------------------------------------------------------------
# POST /step — the unified tool dispatcher
# ---------------------------------------------------------------------------

@app.post("/step")
def step(req: StepRequest, request: Request, db: DBSession = Depends(get_db)):
    current_user = get_current_user(request, db)
    try:
        result = dispatch(req.action.tool_name, db, req.action.parameters, current_user)
        return {
            "observation": {
                "is_error": result.get("is_error", False),
                "text": result.get("text", ""),
                "structured_content": result.get("structured_content"),
            },
            "reward": None,
            "done": False,
        }
    except Exception as e:
        return {
            "observation": {
                "is_error": True,
                "text": str(e),
                "structured_content": None,
            },
            "reward": None,
            "done": False,
        }


# ---------------------------------------------------------------------------
# POST /reset — truncate all tables
# ---------------------------------------------------------------------------

@app.post("/reset")
def reset(db: DBSession = Depends(get_db)):
    inspector = sa_inspect(engine)
    table_names = inspector.get_table_names()
    db.execute(text("SET session_replication_role = 'replica';"))
    for table in table_names:
        db.execute(text(f'TRUNCATE TABLE "{table}" CASCADE;'))
    db.execute(text("SET session_replication_role = 'origin';"))
    db.commit()
    return {"status": "reset", "tables_truncated": len(table_names)}


# ---------------------------------------------------------------------------
# GET /snapshot — dump entire DB as JSON
# ---------------------------------------------------------------------------

@app.get("/snapshot")
def snapshot(db: DBSession = Depends(get_db)):
    inspector = sa_inspect(engine)
    table_names = inspector.get_table_names()
    data = {}
    for table in sorted(table_names):
        rows = db.execute(text(f'SELECT * FROM "{table}"')).mappings().all()
        data[table] = [_serialize_row(dict(r)) for r in rows]
    return {"snapshot": data}


def _serialize_row(row: dict) -> dict:
    """Convert non-JSON-serializable values to strings."""
    import datetime
    from decimal import Decimal

    result = {}
    for k, v in row.items():
        if isinstance(v, (datetime.datetime, datetime.date)):
            result[k] = v.isoformat()
        elif isinstance(v, Decimal):
            result[k] = float(v)
        else:
            result[k] = v
    return result


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@app.post("/auth/login")
def login(req: LoginRequest, db: DBSession = Depends(get_db)):
    user = authenticate_user(db, req.username, req.password)
    if not user:
        return JSONResponse(status_code=401, content={"error": "Invalid credentials"})
    token = create_session(db, user.id)
    response = JSONResponse(content={
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
        },
    })
    response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=7 * 24 * 3600)
    return response


class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str


@app.post("/auth/register")
def register(req: RegisterRequest, db: DBSession = Depends(get_db)):
    # Validate input
    errors = []
    if len(req.username) < 3:
        errors.append("Username must be at least 3 characters")
    if not all(c.isalnum() or c in "._" for c in req.username):
        errors.append("Username can only contain letters, numbers, dots, and underscores")
    if len(req.password) < 8:
        errors.append("Password must be at least 8 characters")
    if not req.name.strip():
        errors.append("Name is required")
    if not req.email or "@" not in req.email:
        errors.append("Valid email is required")
    if errors:
        return JSONResponse(status_code=400, content={"error": errors[0]})

    # Check uniqueness
    if db.query(User).filter(User.username == req.username).first():
        return JSONResponse(status_code=409, content={"error": "Username already taken"})
    if db.query(User).filter(User.email == req.email).first():
        return JSONResponse(status_code=409, content={"error": "Email already taken"})

    # Generate next user ID
    from sqlalchemy import func as sa_func
    max_id = db.query(sa_func.max(User.id)).scalar()
    if max_id and max_id.startswith("usr_"):
        next_num = int(max_id.split("_")[1]) + 1
    else:
        next_num = 1
    user_id = f"usr_{next_num:03d}"

    # Create user
    user = User(
        id=user_id,
        username=req.username,
        password_hash=hash_password(req.password),
        name=req.name.strip(),
        email=req.email.strip().lower(),
        role="standard",
        organization_id="org_001",
    )
    db.add(user)
    db.commit()

    # Auto-login: create session
    token = create_session(db, user.id)
    response = JSONResponse(content={
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
        },
    })
    response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=7 * 24 * 3600)
    return response


@app.post("/auth/logout")
def logout(request: Request, db: DBSession = Depends(get_db)):
    token = get_session_token(request)
    if token:
        delete_session(db, token)
    response = JSONResponse(content={"status": "logged_out"})
    response.delete_cookie("session_token")
    return response


@app.get("/auth/me")
def me(request: Request, db: DBSession = Depends(get_db)):
    user = get_current_user(request, db)
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
        }
    }


# ---------------------------------------------------------------------------
# Static files — serve React frontend if dist exists
# ---------------------------------------------------------------------------

# Try multiple possible dist locations
_frontend_dist = None
for _candidate in [
    os.path.join(os.path.dirname(__file__), "frontend", "dist"),
    os.path.join(os.path.dirname(__file__), "frontend", "asana-clone", "dist"),
]:
    if os.path.isdir(_candidate):
        _frontend_dist = _candidate
        break

if _frontend_dist:
    from fastapi.responses import FileResponse

    @app.get("/{path:path}")
    def serve_spa(path: str):
        file_path = os.path.join(_frontend_dist, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_frontend_dist, "index.html"))
