"""Module 9: Tags (5 tools)."""

import uuid

from sqlalchemy.orm import Session

from audit import log_audit
from models import Tag, Task, TaskTag, User
from schema import (
    AddTagToTaskArgs,
    CreateTagArgs,
    FilterTasksByTagArgs,
    GetTagsArgs,
    RemoveTagFromTaskArgs,
)


def _tag_dict(t: Tag) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "color": t.color,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


def create_tag(db: Session, args: CreateTagArgs, current_user: User | None) -> dict:
    tid = f"tag_{uuid.uuid4().hex[:8]}"
    tag = Tag(id=tid, name=args.name, color=args.color)
    db.add(tag)
    log_audit(db, "tags", tid, "INSERT", None, {"name": args.name, "color": args.color},
              current_user.id if current_user else None)
    db.commit()
    db.refresh(tag)
    return {"is_error": False, "text": f"Tag created: {tid}", "structured_content": _tag_dict(tag)}


def add_tag_to_task(db: Session, args: AddTagToTaskArgs, current_user: User | None) -> dict:
    existing = db.query(TaskTag).filter(TaskTag.task_id == args.task_id, TaskTag.tag_id == args.tag_id).first()
    if existing:
        return {"is_error": False, "text": "Tag already on task", "structured_content": {"task_id": args.task_id, "tag_id": args.tag_id}}
    db.add(TaskTag(task_id=args.task_id, tag_id=args.tag_id))
    log_audit(db, "task_tags", f"{args.task_id}:{args.tag_id}", "INSERT", None,
              {"task_id": args.task_id, "tag_id": args.tag_id}, current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Tag added to task", "structured_content": {"task_id": args.task_id, "tag_id": args.tag_id}}


def remove_tag_from_task(db: Session, args: RemoveTagFromTaskArgs, current_user: User | None) -> dict:
    link = db.query(TaskTag).filter(TaskTag.task_id == args.task_id, TaskTag.tag_id == args.tag_id).first()
    if not link:
        return {"is_error": True, "text": "Tag not on task", "structured_content": None}
    log_audit(db, "task_tags", f"{args.task_id}:{args.tag_id}", "DELETE",
              {"task_id": args.task_id, "tag_id": args.tag_id}, None, current_user.id if current_user else None)
    db.delete(link)
    db.commit()
    return {"is_error": False, "text": "Tag removed from task", "structured_content": {"task_id": args.task_id, "tag_id": args.tag_id}}


def get_tags(db: Session, args: GetTagsArgs, current_user: User | None) -> dict:
    q = db.query(Tag)
    if args.search:
        q = q.filter(Tag.name.ilike(f"%{args.search}%"))
    tags = q.order_by(Tag.name).limit(args.limit).all()
    return {"is_error": False, "text": f"Found {len(tags)} tags", "structured_content": {"tags": [_tag_dict(t) for t in tags]}}


def filter_tasks_by_tag(db: Session, args: FilterTasksByTagArgs, current_user: User | None) -> dict:
    q = db.query(Task).join(TaskTag, Task.id == TaskTag.task_id).filter(TaskTag.tag_id == args.tag_id)
    if args.project_id:
        q = q.filter(Task.project_id == args.project_id)
    if args.completed is not None:
        q = q.filter(Task.completed == args.completed)
    total = q.count()
    tasks = q.order_by(Task.position).offset(args.offset).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {total} tasks with tag",
        "structured_content": {
            "tasks": [
                {"id": t.id, "title": t.title, "assignee_id": t.assignee_id, "completed": t.completed, "due_date": t.due_date.isoformat() if t.due_date else None}
                for t in tasks
            ],
            "total": total,
        },
    }


TOOLS = [
    {"name": "create_tag", "description": "Create a new tag.", "input_schema": CreateTagArgs.model_json_schema(), "mutates_state": True, "handler": create_tag},
    {"name": "add_tag_to_task", "description": "Add a tag to a task.", "input_schema": AddTagToTaskArgs.model_json_schema(), "mutates_state": True, "handler": add_tag_to_task},
    {"name": "remove_tag_from_task", "description": "Remove a tag from a task.", "input_schema": RemoveTagFromTaskArgs.model_json_schema(), "mutates_state": True, "handler": remove_tag_from_task},
    {"name": "get_tags", "description": "List tags with optional search.", "input_schema": GetTagsArgs.model_json_schema(), "mutates_state": False, "handler": get_tags},
    {"name": "filter_tasks_by_tag", "description": "Get tasks that have a specific tag.", "input_schema": FilterTasksByTagArgs.model_json_schema(), "mutates_state": False, "handler": filter_tasks_by_tag},
]
