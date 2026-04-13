"""Module 3: Projects (7 tools)."""

import uuid

from sqlalchemy.orm import Session

from audit import log_audit
from models import Project, Section, Task, User
from schema import (
    CreateProjectArgs,
    DeleteProjectArgs,
    GetBoardViewArgs,
    GetProjectArgs,
    GetProjectListArgs,
    GetProjectTasksArgs,
    UpdateProjectArgs,
)


def _project_dict(p: Project) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "team_id": p.team_id,
        "owner_id": p.owner_id,
        "color": p.color,
        "icon": p.icon,
        "status": p.status,
        "default_view": p.default_view,
        "archived": p.archived,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _task_card(t: Task) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "assignee_id": t.assignee_id,
        "assignee_name": t.assignee.name if t.assignee else None,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "start_date": t.start_date.isoformat() if t.start_date else None,
        "completed": t.completed,
        "priority": t.priority,
        "position": t.position,
        "tags": [{"id": tl.tag.id, "name": tl.tag.name, "color": tl.tag.color} for tl in (t.tag_links or []) if tl.tag],
    }


def _next_project_id(db: Session) -> str:
    last = db.query(Project).order_by(Project.id.desc()).first()
    if last and last.id.startswith("prj_"):
        num = int(last.id.split("_")[1]) + 1
    else:
        num = 1
    return f"prj_{num:03d}"


def create_project(db: Session, args: CreateProjectArgs, current_user: User | None) -> dict:
    pid = _next_project_id(db)
    project = Project(
        id=pid,
        name=args.name,
        description=args.description,
        team_id=args.team_id,
        owner_id=args.owner_id or (current_user.id if current_user else None),
        color=args.color,
        icon=args.icon,
        default_view=args.default_view or "list",
    )
    db.add(project)
    log_audit(db, "projects", pid, "INSERT", None, _project_dict(project), current_user.id if current_user else None)
    db.commit()
    db.refresh(project)
    return {"is_error": False, "text": f"Project created: {pid}", "structured_content": _project_dict(project)}


def get_project(db: Session, args: GetProjectArgs, current_user: User | None) -> dict:
    p = db.query(Project).filter(Project.id == args.project_id).first()
    if not p:
        return {"is_error": True, "text": f"Project not found: {args.project_id}", "structured_content": None}
    d = _project_dict(p)
    d["sections"] = [{"id": s.id, "name": s.name, "position": s.position} for s in (p.sections or [])]
    d["member_count"] = len(p.members) if p.members else 0
    return {"is_error": False, "text": "Project retrieved", "structured_content": d}


def update_project(db: Session, args: UpdateProjectArgs, current_user: User | None) -> dict:
    p = db.query(Project).filter(Project.id == args.project_id).first()
    if not p:
        return {"is_error": True, "text": f"Project not found: {args.project_id}", "structured_content": None}
    old = _project_dict(p)
    for field in ["name", "description", "color", "icon", "status", "archived", "default_view"]:
        val = getattr(args, field, None)
        if val is not None:
            setattr(p, field, val)
    log_audit(db, "projects", p.id, "UPDATE", old, _project_dict(p), current_user.id if current_user else None)
    db.commit()
    db.refresh(p)
    return {"is_error": False, "text": "Project updated", "structured_content": _project_dict(p)}


def delete_project(db: Session, args: DeleteProjectArgs, current_user: User | None) -> dict:
    p = db.query(Project).filter(Project.id == args.project_id).first()
    if not p:
        return {"is_error": True, "text": f"Project not found: {args.project_id}", "structured_content": None}
    old = _project_dict(p)
    log_audit(db, "projects", p.id, "DELETE", old, None, current_user.id if current_user else None)
    db.delete(p)
    db.commit()
    return {"is_error": False, "text": f"Project deleted: {args.project_id}", "structured_content": {"id": args.project_id}}


def get_project_list(db: Session, args: GetProjectListArgs, current_user: User | None) -> dict:
    q = db.query(Project)
    if args.team_id:
        q = q.filter(Project.team_id == args.team_id)
    if args.owner_id:
        q = q.filter(Project.owner_id == args.owner_id)
    if args.archived is not None:
        q = q.filter(Project.archived == args.archived)
    total = q.count()
    projects = q.order_by(Project.name).offset(args.offset).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {total} projects",
        "structured_content": {"projects": [_project_dict(p) for p in projects], "total": total},
    }


def get_project_tasks(db: Session, args: GetProjectTasksArgs, current_user: User | None) -> dict:
    q = db.query(Task).filter(Task.project_id == args.project_id, Task.parent_task_id.is_(None))
    if args.section_id:
        q = q.filter(Task.section_id == args.section_id)
    if args.assignee_id:
        q = q.filter(Task.assignee_id == args.assignee_id)
    if args.completed is not None:
        q = q.filter(Task.completed == args.completed)
    total = q.count()
    tasks = q.order_by(Task.position).offset(args.offset).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {total} tasks in project",
        "structured_content": {"tasks": [_task_card(t) for t in tasks], "total": total},
    }


def get_board_view(db: Session, args: GetBoardViewArgs, current_user: User | None) -> dict:
    p = db.query(Project).filter(Project.id == args.project_id).first()
    if not p:
        return {"is_error": True, "text": f"Project not found: {args.project_id}", "structured_content": None}

    sections = db.query(Section).filter(Section.project_id == args.project_id).order_by(Section.position).all()
    columns = []
    for s in sections:
        tasks = db.query(Task).filter(
            Task.section_id == s.id, Task.parent_task_id.is_(None)
        ).order_by(Task.position).all()
        columns.append({
            "section_id": s.id,
            "section_name": s.name,
            "position": s.position,
            "tasks": [_task_card(t) for t in tasks],
            "task_count": len(tasks),
        })
    return {
        "is_error": False,
        "text": "Board view retrieved",
        "structured_content": {"project": _project_dict(p), "columns": columns},
    }


TOOLS = [
    {"name": "create_project", "description": "Create a new project.", "input_schema": CreateProjectArgs.model_json_schema(), "mutates_state": True, "handler": create_project},
    {"name": "get_project", "description": "Get a project by ID with sections.", "input_schema": GetProjectArgs.model_json_schema(), "mutates_state": False, "handler": get_project},
    {"name": "update_project", "description": "Update a project's fields.", "input_schema": UpdateProjectArgs.model_json_schema(), "mutates_state": True, "handler": update_project},
    {"name": "delete_project", "description": "Delete a project.", "input_schema": DeleteProjectArgs.model_json_schema(), "mutates_state": True, "handler": delete_project},
    {"name": "get_project_list", "description": "List projects with optional filters.", "input_schema": GetProjectListArgs.model_json_schema(), "mutates_state": False, "handler": get_project_list},
    {"name": "get_project_tasks", "description": "Get tasks in a project with optional filters.", "input_schema": GetProjectTasksArgs.model_json_schema(), "mutates_state": False, "handler": get_project_tasks},
    {"name": "get_board_view", "description": "Get board view data: sections as columns with nested task cards.", "input_schema": GetBoardViewArgs.model_json_schema(), "mutates_state": False, "handler": get_board_view},
]
