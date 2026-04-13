"""Module 1: Users & Auth (4 tools)."""

from sqlalchemy.orm import Session

from audit import log_audit
from models import User
from schema import (
    GetCurrentUserArgs,
    GetUsersArgs,
    GetUserProfileArgs,
    UpdateUserProfileArgs,
)


def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "name": u.name,
        "email": u.email,
        "avatar_url": u.avatar_url,
        "role": u.role,
        "organization_id": u.organization_id,
        "last_login": u.last_login.isoformat() if u.last_login else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def get_current_user(db: Session, args: GetCurrentUserArgs, current_user: User | None) -> dict:
    if not current_user:
        return {"is_error": True, "text": "Not authenticated", "structured_content": None}
    return {"is_error": False, "text": "Current user retrieved", "structured_content": _user_dict(current_user)}


def get_users(db: Session, args: GetUsersArgs, current_user: User | None) -> dict:
    q = db.query(User)
    if args.organization_id:
        q = q.filter(User.organization_id == args.organization_id)
    if args.role:
        q = q.filter(User.role == args.role)
    if args.search:
        pattern = f"%{args.search}%"
        q = q.filter((User.name.ilike(pattern)) | (User.email.ilike(pattern)))
    total = q.count()
    users = q.order_by(User.name).offset(args.offset).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {total} users",
        "structured_content": {"users": [_user_dict(u) for u in users], "total": total},
    }


def get_user_profile(db: Session, args: GetUserProfileArgs, current_user: User | None) -> dict:
    user = db.query(User).filter(User.id == args.user_id).first()
    if not user:
        return {"is_error": True, "text": f"User not found: {args.user_id}", "structured_content": None}
    return {"is_error": False, "text": "User profile retrieved", "structured_content": _user_dict(user)}


def update_user_profile(db: Session, args: UpdateUserProfileArgs, current_user: User | None) -> dict:
    user = db.query(User).filter(User.id == args.user_id).first()
    if not user:
        return {"is_error": True, "text": f"User not found: {args.user_id}", "structured_content": None}
    old = _user_dict(user)
    if args.name is not None:
        user.name = args.name
    if args.email is not None:
        user.email = args.email
    if args.avatar_url is not None:
        user.avatar_url = args.avatar_url
    log_audit(db, "users", user.id, "UPDATE", old, _user_dict(user), current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "User profile updated", "structured_content": _user_dict(user)}


TOOLS = [
    {"name": "get_current_user", "description": "Get the currently authenticated user.", "input_schema": GetCurrentUserArgs.model_json_schema(), "mutates_state": False, "handler": get_current_user},
    {"name": "get_users", "description": "List users with optional filters.", "input_schema": GetUsersArgs.model_json_schema(), "mutates_state": False, "handler": get_users},
    {"name": "get_user_profile", "description": "Get a user's profile by ID.", "input_schema": GetUserProfileArgs.model_json_schema(), "mutates_state": False, "handler": get_user_profile},
    {"name": "update_user_profile", "description": "Update a user's profile.", "input_schema": UpdateUserProfileArgs.model_json_schema(), "mutates_state": True, "handler": update_user_profile},
]
