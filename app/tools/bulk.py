"""Module 16: Bulk Operations (5 tools)."""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from audit import log_audit
from models import Task, TaskTag, User
from schema import (
    BulkAssignTasksArgs,
    BulkCompleteTasksArgs,
    BulkDeleteTasksArgs,
    BulkMoveTasksArgs,
    BulkUpdateTasksArgs,
)


def bulk_update_tasks(db: Session, args: BulkUpdateTasksArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else None
    updated = 0
    for tid in args.task_ids:
        task = db.query(Task).filter(Task.id == tid).first()
        if not task:
            continue
        if "assignee_id" in args.updates:
            task.assignee_id = args.updates["assignee_id"]
        if "due_date" in args.updates:
            task.due_date = args.updates["due_date"]
        if "priority" in args.updates:
            task.priority = args.updates["priority"]
        if "add_tags" in args.updates:
            for tag_id in args.updates["add_tags"]:
                existing = db.query(TaskTag).filter(TaskTag.task_id == tid, TaskTag.tag_id == tag_id).first()
                if not existing:
                    db.add(TaskTag(task_id=tid, tag_id=tag_id))
        if "remove_tags" in args.updates:
            for tag_id in args.updates["remove_tags"]:
                link = db.query(TaskTag).filter(TaskTag.task_id == tid, TaskTag.tag_id == tag_id).first()
                if link:
                    db.delete(link)
        updated += 1

    log_audit(db, "tasks", ",".join(args.task_ids), "UPDATE", None, {"bulk_updates": args.updates}, uid)
    db.commit()
    return {"is_error": False, "text": f"Updated {updated} tasks", "structured_content": {"updated_count": updated}}


def bulk_move_tasks(db: Session, args: BulkMoveTasksArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else None
    moved = 0
    for i, tid in enumerate(args.task_ids):
        task = db.query(Task).filter(Task.id == tid).first()
        if task:
            old_section = task.section_id
            task.section_id = args.section_id
            task.position = (args.position_start or 0) + i
            log_audit(db, "tasks", tid, "UPDATE", {"section_id": old_section}, {"section_id": args.section_id}, uid)
            moved += 1
    db.commit()
    return {"is_error": False, "text": f"Moved {moved} tasks", "structured_content": {"moved_count": moved, "section_id": args.section_id}}


def bulk_delete_tasks(db: Session, args: BulkDeleteTasksArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else None
    deleted = 0
    for tid in args.task_ids:
        task = db.query(Task).filter(Task.id == tid).first()
        if task:
            log_audit(db, "tasks", tid, "DELETE", {"title": task.title}, None, uid)
            db.delete(task)
            deleted += 1
    db.commit()
    return {"is_error": False, "text": f"Deleted {deleted} tasks", "structured_content": {"deleted_count": deleted}}


def bulk_complete_tasks(db: Session, args: BulkCompleteTasksArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else None
    count = 0
    now = datetime.now(timezone.utc)
    for tid in args.task_ids:
        task = db.query(Task).filter(Task.id == tid).first()
        if task:
            old_completed = task.completed
            task.completed = args.completed
            if args.completed:
                task.completed_at = now
                task.completed_by = uid
            else:
                task.completed_at = None
                task.completed_by = None
            log_audit(db, "tasks", tid, "UPDATE", {"completed": old_completed}, {"completed": args.completed}, uid)
            count += 1
    db.commit()
    return {"is_error": False, "text": f"{'Completed' if args.completed else 'Uncompleted'} {count} tasks", "structured_content": {"count": count, "completed": args.completed}}


def bulk_assign_tasks(db: Session, args: BulkAssignTasksArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else None
    count = 0
    for tid in args.task_ids:
        task = db.query(Task).filter(Task.id == tid).first()
        if task:
            old_assignee = task.assignee_id
            task.assignee_id = args.assignee_id
            log_audit(db, "tasks", tid, "UPDATE", {"assignee_id": old_assignee}, {"assignee_id": args.assignee_id}, uid)
            count += 1
    db.commit()
    return {"is_error": False, "text": f"Assigned {count} tasks to {args.assignee_id}", "structured_content": {"assigned_count": count, "assignee_id": args.assignee_id}}


TOOLS = [
    {"name": "bulk_update_tasks", "description": "Bulk update multiple tasks.", "input_schema": BulkUpdateTasksArgs.model_json_schema(), "mutates_state": True, "handler": bulk_update_tasks},
    {"name": "bulk_move_tasks", "description": "Bulk move tasks to a section.", "input_schema": BulkMoveTasksArgs.model_json_schema(), "mutates_state": True, "handler": bulk_move_tasks},
    {"name": "bulk_delete_tasks", "description": "Bulk delete tasks.", "input_schema": BulkDeleteTasksArgs.model_json_schema(), "mutates_state": True, "handler": bulk_delete_tasks},
    {"name": "bulk_complete_tasks", "description": "Bulk complete or uncomplete tasks.", "input_schema": BulkCompleteTasksArgs.model_json_schema(), "mutates_state": True, "handler": bulk_complete_tasks},
    {"name": "bulk_assign_tasks", "description": "Bulk assign tasks to a user.", "input_schema": BulkAssignTasksArgs.model_json_schema(), "mutates_state": True, "handler": bulk_assign_tasks},
]
