"""Module 5: Sections (5 tools)."""

import uuid

from sqlalchemy.orm import Session

from audit import log_audit
from models import Section, Task, User
from schema import (
    CreateSectionArgs,
    DeleteSectionArgs,
    MoveTaskToSectionArgs,
    ReorderSectionsArgs,
    UpdateSectionArgs,
)


def _section_dict(s: Section) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "project_id": s.project_id,
        "position": s.position,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def _next_section_id(db: Session) -> str:
    last = db.query(Section).order_by(Section.id.desc()).first()
    if last and last.id.startswith("sec_"):
        num = int(last.id.split("_")[1]) + 1
    else:
        num = 1
    return f"sec_{num:03d}"


def create_section(db: Session, args: CreateSectionArgs, current_user: User | None) -> dict:
    sid = _next_section_id(db)
    pos = args.position if args.position is not None else db.query(Section).filter(Section.project_id == args.project_id).count()
    section = Section(id=sid, name=args.name, project_id=args.project_id, position=pos)
    db.add(section)
    log_audit(db, "sections", sid, "INSERT", None, _section_dict(section), current_user.id if current_user else None)
    db.commit()
    db.refresh(section)
    return {"is_error": False, "text": f"Section created: {sid}", "structured_content": _section_dict(section)}


def update_section(db: Session, args: UpdateSectionArgs, current_user: User | None) -> dict:
    s = db.query(Section).filter(Section.id == args.section_id).first()
    if not s:
        return {"is_error": True, "text": f"Section not found: {args.section_id}", "structured_content": None}
    old = _section_dict(s)
    s.name = args.name
    log_audit(db, "sections", s.id, "UPDATE", old, _section_dict(s), current_user.id if current_user else None)
    db.commit()
    db.refresh(s)
    return {"is_error": False, "text": "Section updated", "structured_content": _section_dict(s)}


def delete_section(db: Session, args: DeleteSectionArgs, current_user: User | None) -> dict:
    s = db.query(Section).filter(Section.id == args.section_id).first()
    if not s:
        return {"is_error": True, "text": f"Section not found: {args.section_id}", "structured_content": None}
    old = _section_dict(s)
    log_audit(db, "sections", s.id, "DELETE", old, None, current_user.id if current_user else None)
    db.delete(s)
    db.commit()
    return {"is_error": False, "text": f"Section deleted: {args.section_id}", "structured_content": {"id": args.section_id}}


def reorder_sections(db: Session, args: ReorderSectionsArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else None
    for i, sid in enumerate(args.section_ids):
        s = db.query(Section).filter(Section.id == sid).first()
        if s:
            old_pos = s.position
            s.position = i
            log_audit(db, "sections", sid, "UPDATE", {"position": old_pos}, {"position": i}, uid)
    db.commit()
    return {"is_error": False, "text": f"Reordered {len(args.section_ids)} sections", "structured_content": {"section_ids": args.section_ids}}


def move_task_to_section(db: Session, args: MoveTaskToSectionArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}
    s = db.query(Section).filter(Section.id == args.section_id).first()
    if not s:
        return {"is_error": True, "text": f"Section not found: {args.section_id}", "structured_content": None}

    task.section_id = args.section_id
    task.project_id = s.project_id
    if args.position is not None:
        task.position = args.position
    log_audit(db, "tasks", task.id, "UPDATE", None, {"section_id": args.section_id, "position": task.position},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Task moved", "structured_content": {"task_id": args.task_id, "section_id": args.section_id}}


TOOLS = [
    {"name": "create_section", "description": "Create a new section in a project.", "input_schema": CreateSectionArgs.model_json_schema(), "mutates_state": True, "handler": create_section},
    {"name": "update_section", "description": "Update a section's name.", "input_schema": UpdateSectionArgs.model_json_schema(), "mutates_state": True, "handler": update_section},
    {"name": "delete_section", "description": "Delete a section.", "input_schema": DeleteSectionArgs.model_json_schema(), "mutates_state": True, "handler": delete_section},
    {"name": "reorder_sections", "description": "Reorder sections by position.", "input_schema": ReorderSectionsArgs.model_json_schema(), "mutates_state": True, "handler": reorder_sections},
    {"name": "move_task_to_section", "description": "Move a task to a different section.", "input_schema": MoveTaskToSectionArgs.model_json_schema(), "mutates_state": True, "handler": move_task_to_section},
]
