from datetime import datetime, timedelta, timezone
import secrets

from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session as DBSession

from db import get_db
from models import User, Session as SessionModel


def create_session(db: DBSession, user_id: str) -> str:
    """Create a new session for the user, return session token."""
    token = f"sess_{secrets.token_hex(16)}"
    session = SessionModel(
        id=token,
        user_id=user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(session)
    db.commit()
    return token


def validate_session(db: DBSession, token: str) -> User | None:
    """Validate session token and return user, or None if invalid/expired."""
    session = db.query(SessionModel).filter(SessionModel.id == token).first()
    if not session:
        return None
    now = datetime.now(timezone.utc)
    expires = session.expires_at
    # SQLite returns naive datetimes; make comparison safe for both backends
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        db.delete(session)
        db.commit()
        return None
    user = db.query(User).filter(User.id == session.user_id).first()
    return user


def delete_session(db: DBSession, token: str):
    """Delete a session (logout)."""
    session = db.query(SessionModel).filter(SessionModel.id == token).first()
    if session:
        db.delete(session)
        db.commit()


def authenticate_user(db: DBSession, username: str, password: str) -> User | None:
    """Check username/password, return user or None."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if user.password_hash != password:
        return None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    return user


def get_session_token(request: Request) -> str | None:
    """Extract session token from cookie or Authorization header."""
    token = request.cookies.get("session_token")
    if token:
        return token
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        return auth[7:]
    return None


def get_current_user(request: Request, db: DBSession = Depends(get_db)) -> User | None:
    """FastAPI dependency: get current user from session. Returns None if not authenticated."""
    token = get_session_token(request)
    if not token:
        return None
    return validate_session(db, token)


def require_auth(request: Request, db: DBSession = Depends(get_db)) -> User:
    """FastAPI dependency: require authentication. Raises 401 if not authenticated."""
    user = get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
