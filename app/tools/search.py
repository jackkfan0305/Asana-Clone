"""Module 11: Search (4 tools)."""

import uuid

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from audit import log_audit
from models import Project, SavedSearch, Task, TaskTag, User
from schema import SaveSearchViewArgs, SearchAllArgs, SearchProjectsArgs, SearchTasksArgs


def search_tasks(db: Session, args: SearchTasksArgs, current_user: User | None) -> dict:
    q = db.query(Task)

    if args.query:
        pattern = f"%{args.query}%"
        q = q.filter(or_(Task.title.ilike(pattern), Task.description.ilike(pattern)))

    if args.assignee_id:
        q = q.filter(Task.assignee_id == args.assignee_id)
    if args.project_id:
        q = q.filter(Task.project_id == args.project_id)
    if args.completed is not None:
        q = q.filter(Task.completed == args.completed)
    if args.due_before:
        q = q.filter(Task.due_date <= args.due_before)
    if args.due_after:
        q = q.filter(Task.due_date >= args.due_after)
    if args.priority:
        q = q.filter(Task.priority == args.priority)
    if args.tags:
        q = q.join(TaskTag, Task.id == TaskTag.task_id).filter(TaskTag.tag_id.in_(args.tags))

    total = q.count()
    tasks = q.order_by(Task.updated_at.desc()).offset(args.offset).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {total} tasks",
        "structured_content": {
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "assignee_id": t.assignee_id,
                    "project_id": t.project_id,
                    "completed": t.completed,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "priority": t.priority,
                }
                for t in tasks
            ],
            "total": total,
        },
    }


def search_projects(db: Session, args: SearchProjectsArgs, current_user: User | None) -> dict:
    q = db.query(Project)
    if args.query:
        pattern = f"%{args.query}%"
        q = q.filter(or_(Project.name.ilike(pattern), Project.description.ilike(pattern)))
    if args.team_id:
        q = q.filter(Project.team_id == args.team_id)
    if args.archived is not None:
        q = q.filter(Project.archived == args.archived)
    projects = q.order_by(Project.name).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {len(projects)} projects",
        "structured_content": {
            "projects": [
                {"id": p.id, "name": p.name, "color": p.color, "status": p.status, "archived": p.archived}
                for p in projects
            ],
        },
    }


def search_all(db: Session, args: SearchAllArgs, current_user: User | None) -> dict:
    pattern = f"%{args.query}%"
    tasks = db.query(Task).filter(
        or_(Task.title.ilike(pattern), Task.description.ilike(pattern))
    ).limit(args.limit).all()
    projects = db.query(Project).filter(
        or_(Project.name.ilike(pattern), Project.description.ilike(pattern))
    ).limit(args.limit).all()
    users = db.query(User).filter(
        or_(User.name.ilike(pattern), User.email.ilike(pattern))
    ).limit(args.limit).all()

    return {
        "is_error": False,
        "text": f"Found {len(tasks)} tasks, {len(projects)} projects, {len(users)} users",
        "structured_content": {
            "tasks": [{"id": t.id, "title": t.title, "completed": t.completed} for t in tasks],
            "projects": [{"id": p.id, "name": p.name, "color": p.color} for p in projects],
            "users": [{"id": u.id, "name": u.name, "email": u.email, "avatar_url": u.avatar_url} for u in users],
        },
    }


def save_search_view(db: Session, args: SaveSearchViewArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else "usr_001"
    sid = f"ss_{uuid.uuid4().hex[:8]}"
    search = SavedSearch(id=sid, user_id=uid, name=args.name, filters_json=args.filters_json)
    db.add(search)
    log_audit(db, "saved_searches", sid, "INSERT", None, {"name": args.name}, uid)
    db.commit()
    return {"is_error": False, "text": f"Search saved: {sid}", "structured_content": {"id": sid, "name": args.name}}


TOOLS = [
    {"name": "search_tasks", "description": "Search tasks by text and filters.", "input_schema": SearchTasksArgs.model_json_schema(), "mutates_state": False, "handler": search_tasks},
    {"name": "search_projects", "description": "Search projects by text.", "input_schema": SearchProjectsArgs.model_json_schema(), "mutates_state": False, "handler": search_projects},
    {"name": "search_all", "description": "Search across tasks, projects, and users.", "input_schema": SearchAllArgs.model_json_schema(), "mutates_state": False, "handler": search_all},
    {"name": "save_search_view", "description": "Save a search as a named view.", "input_schema": SaveSearchViewArgs.model_json_schema(), "mutates_state": True, "handler": save_search_view},
]
