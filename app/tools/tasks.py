"""Module 2: Tasks (9 tools)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from audit import log_audit
from models import (
    ActivityLog,
    Notification,
    Task,
    TaskFollower,
    TaskTag,
    User,
)
from schema import (
    CompleteTaskArgs,
    CreateTaskArgs,
    DeleteTaskArgs,
    DuplicateTaskArgs,
    GetMyTasksArgs,
    GetTaskArgs,
    GetTaskDetailArgs,
    ReorderTasksArgs,
    UpdateTaskArgs,
)


def _task_dict(t: Task) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "assignee_id": t.assignee_id,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "start_date": t.start_date.isoformat() if t.start_date else None,
        "completed": t.completed,
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        "parent_task_id": t.parent_task_id,
        "section_id": t.section_id,
        "project_id": t.project_id,
        "position": t.position,
        "priority": t.priority,
        "task_type": t.task_type,
        "created_by": t.created_by,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    }


def _next_task_id(db: Session) -> str:
    last = db.query(Task).order_by(Task.id.desc()).first()
    if last and last.id.startswith("tsk_"):
        num = int(last.id.split("_")[1]) + 1
    else:
        num = 1
    return f"tsk_{num:03d}"


def create_task(db: Session, args: CreateTaskArgs, current_user: User | None) -> dict:
    task_id = _next_task_id(db)
    max_pos = db.query(Task).filter(Task.section_id == args.section_id).count() if args.section_id else 0
    task = Task(
        id=task_id,
        title=args.title,
        description=args.description,
        assignee_id=args.assignee_id,
        project_id=args.project_id,
        section_id=args.section_id,
        due_date=args.due_date,
        start_date=args.start_date,
        priority=args.priority,
        parent_task_id=args.parent_task_id,
        position=max_pos,
        created_by=current_user.id if current_user else None,
    )
    db.add(task)

    # Add tags
    if args.tags:
        for tag_id in args.tags:
            db.add(TaskTag(task_id=task_id, tag_id=tag_id))

    # Add creator as follower
    if current_user:
        db.add(TaskFollower(task_id=task_id, user_id=current_user.id))

    # Activity log
    db.add(ActivityLog(
        id=f"act_{uuid.uuid4().hex[:8]}",
        task_id=task_id,
        project_id=args.project_id,
        user_id=current_user.id if current_user else "system",
        action="created",
    ))

    # Notification for assignee
    if args.assignee_id and (not current_user or args.assignee_id != current_user.id):
        db.add(Notification(
            id=f"ntf_{uuid.uuid4().hex[:8]}",
            user_id=args.assignee_id,
            type="task_assigned",
            task_id=task_id,
            project_id=args.project_id,
            actor_id=current_user.id if current_user else None,
            title=f"You were assigned to '{args.title}'",
        ))

    log_audit(db, "tasks", task_id, "INSERT", None, _task_dict(task), current_user.id if current_user else None)
    db.commit()
    db.refresh(task)
    return {"is_error": False, "text": f"Task created: {task_id}", "structured_content": _task_dict(task)}


def get_task(db: Session, args: GetTaskArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}
    return {"is_error": False, "text": "Task retrieved", "structured_content": _task_dict(task)}


def get_task_detail(db: Session, args: GetTaskDetailArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}

    detail = _task_dict(task)
    detail["subtasks"] = [_task_dict(s) for s in (task.subtasks or [])]
    detail["comments"] = [
        {
            "id": c.id,
            "author_id": c.author_id,
            "author_name": c.author.name if c.author else None,
            "body": c.body,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "likes_count": len(c.likes) if c.likes else 0,
        }
        for c in (task.comments or [])
    ]
    detail["followers"] = [
        {"user_id": f.user_id, "user_name": f.user.name if f.user else None}
        for f in (task.follower_links or [])
    ]
    detail["tags"] = [
        {"id": tl.tag.id, "name": tl.tag.name, "color": tl.tag.color}
        for tl in (task.tag_links or []) if tl.tag
    ]
    detail["dependencies"] = [
        {"depends_on_task_id": d.depends_on_task_id, "dependency_type": d.dependency_type}
        for d in (task.dependencies or [])
    ]
    detail["attachments"] = [
        {"id": a.id, "filename": a.filename, "url": a.url, "mime_type": a.mime_type}
        for a in (task.attachments or [])
    ]
    # Assignee name
    if task.assignee:
        detail["assignee_name"] = task.assignee.name
    # Project name
    if task.project:
        detail["project_name"] = task.project.name

    return {"is_error": False, "text": "Task detail retrieved", "structured_content": detail}


def update_task(db: Session, args: UpdateTaskArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}

    old = _task_dict(task)
    uid = current_user.id if current_user else "system"

    fields = ["title", "description", "assignee_id", "due_date", "start_date", "priority", "completed", "section_id", "project_id"]
    for field in fields:
        val = getattr(args, field, None)
        if val is not None:
            old_val = getattr(task, field)
            setattr(task, field, val)
            if str(old_val) != str(val):
                db.add(ActivityLog(
                    id=f"act_{uuid.uuid4().hex[:8]}",
                    task_id=task.id,
                    project_id=task.project_id,
                    user_id=uid,
                    action="updated",
                    field_changed=field,
                    old_value=str(old_val) if old_val is not None else None,
                    new_value=str(val),
                ))

    if args.completed is True and not old["completed"]:
        task.completed_at = datetime.now(timezone.utc)
        task.completed_by = uid
    elif args.completed is False:
        task.completed_at = None
        task.completed_by = None

    # Notify new assignee
    if args.assignee_id and args.assignee_id != old.get("assignee_id"):
        if not current_user or args.assignee_id != current_user.id:
            db.add(Notification(
                id=f"ntf_{uuid.uuid4().hex[:8]}",
                user_id=args.assignee_id,
                type="task_assigned",
                task_id=task.id,
                project_id=task.project_id,
                actor_id=uid,
                title=f"You were assigned to '{task.title}'",
            ))

    # Notify followers of any update
    for fl in (task.follower_links or []):
        if fl.user_id != uid and fl.user_id != args.assignee_id:
            db.add(Notification(
                id=f"ntf_{uuid.uuid4().hex[:8]}",
                user_id=fl.user_id,
                type="project_update",
                task_id=task.id,
                project_id=task.project_id,
                actor_id=uid,
                title=f"'{task.title}' was updated",
            ))

    log_audit(db, "tasks", task.id, "UPDATE", old, _task_dict(task), uid)
    db.commit()
    db.refresh(task)
    return {"is_error": False, "text": "Task updated", "structured_content": _task_dict(task)}


def delete_task(db: Session, args: DeleteTaskArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}
    old = _task_dict(task)
    log_audit(db, "tasks", task.id, "DELETE", old, None, current_user.id if current_user else None)
    db.delete(task)
    db.commit()
    return {"is_error": False, "text": f"Task deleted: {args.task_id}", "structured_content": {"id": args.task_id}}


def complete_task(db: Session, args: CompleteTaskArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}
    old = _task_dict(task)
    uid = current_user.id if current_user else "system"
    task.completed = args.completed
    if args.completed:
        task.completed_at = datetime.now(timezone.utc)
        task.completed_by = uid
    else:
        task.completed_at = None
        task.completed_by = None

    db.add(ActivityLog(
        id=f"act_{uuid.uuid4().hex[:8]}",
        task_id=task.id,
        project_id=task.project_id,
        user_id=uid,
        action="completed" if args.completed else "uncompleted",
    ))

    # Notify followers
    for fl in (task.follower_links or []):
        if fl.user_id != uid:
            db.add(Notification(
                id=f"ntf_{uuid.uuid4().hex[:8]}",
                user_id=fl.user_id,
                type="task_completed",
                task_id=task.id,
                project_id=task.project_id,
                actor_id=uid,
                title=f"'{task.title}' was {'completed' if args.completed else 'reopened'}",
            ))

    log_audit(db, "tasks", task.id, "UPDATE", old, _task_dict(task), uid)
    db.commit()
    db.refresh(task)
    return {"is_error": False, "text": f"Task {'completed' if args.completed else 'uncompleted'}", "structured_content": _task_dict(task)}


def get_my_tasks(db: Session, args: GetMyTasksArgs, current_user: User | None) -> dict:
    uid = args.user_id or (current_user.id if current_user else None)
    if not uid:
        return {"is_error": True, "text": "No user specified", "structured_content": None}

    q = db.query(Task).filter(Task.assignee_id == uid)
    if not args.include_completed:
        q = q.filter(Task.completed == False)

    tasks = q.order_by(Task.position).all()
    grouped: dict = {}
    if args.group_by == "section":
        for t in tasks:
            key = t.section_id or "no_section"
            grouped.setdefault(key, []).append(_task_dict(t))
    elif args.group_by == "priority":
        for t in tasks:
            key = t.priority or "none"
            grouped.setdefault(key, []).append(_task_dict(t))
    elif args.group_by == "due_date":
        for t in tasks:
            key = t.due_date.isoformat() if t.due_date else "no_date"
            grouped.setdefault(key, []).append(_task_dict(t))
    else:
        grouped["all"] = [_task_dict(t) for t in tasks]

    return {
        "is_error": False,
        "text": f"Found {len(tasks)} tasks for user {uid}",
        "structured_content": {"tasks": grouped, "total": len(tasks)},
    }


def reorder_tasks(db: Session, args: ReorderTasksArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else None
    for i, tid in enumerate(args.task_ids):
        task = db.query(Task).filter(Task.id == tid).first()
        if task:
            old_pos = task.position
            task.position = i
            if args.section_id:
                task.section_id = args.section_id
            log_audit(db, "tasks", tid, "UPDATE", {"position": old_pos}, {"position": i}, uid)
    db.commit()
    return {"is_error": False, "text": f"Reordered {len(args.task_ids)} tasks", "structured_content": {"task_ids": args.task_ids}}


def duplicate_task(db: Session, args: DuplicateTaskArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}

    new_id = _next_task_id(db)
    new_task = Task(
        id=new_id,
        title=f"{task.title} (copy)",
        description=task.description,
        assignee_id=task.assignee_id,
        project_id=task.project_id,
        section_id=task.section_id,
        due_date=task.due_date,
        start_date=task.start_date,
        priority=task.priority,
        position=task.position + 1,
        created_by=current_user.id if current_user else None,
    )
    db.add(new_task)

    if args.include_subtasks:
        for sub in (task.subtasks or []):
            sub_id = f"tsk_{uuid.uuid4().hex[:6]}"
            db.add(Task(
                id=sub_id,
                title=sub.title,
                description=sub.description,
                assignee_id=sub.assignee_id,
                parent_task_id=new_id,
                project_id=task.project_id,
                section_id=task.section_id,
                due_date=sub.due_date,
                priority=sub.priority,
                position=sub.position,
                created_by=current_user.id if current_user else None,
            ))

    log_audit(db, "tasks", new_id, "INSERT", None, _task_dict(new_task), current_user.id if current_user else None)
    db.commit()
    db.refresh(new_task)
    return {"is_error": False, "text": f"Task duplicated: {new_id}", "structured_content": _task_dict(new_task)}


TOOLS = [
    {"name": "create_task", "description": "Create a new task.", "input_schema": CreateTaskArgs.model_json_schema(), "mutates_state": True, "handler": create_task},
    {"name": "get_task", "description": "Get a task by ID.", "input_schema": GetTaskArgs.model_json_schema(), "mutates_state": False, "handler": get_task},
    {"name": "get_task_detail", "description": "Get full task detail including subtasks, comments, followers, tags, dependencies, and attachments.", "input_schema": GetTaskDetailArgs.model_json_schema(), "mutates_state": False, "handler": get_task_detail},
    {"name": "update_task", "description": "Update a task's fields.", "input_schema": UpdateTaskArgs.model_json_schema(), "mutates_state": True, "handler": update_task},
    {"name": "delete_task", "description": "Delete a task.", "input_schema": DeleteTaskArgs.model_json_schema(), "mutates_state": True, "handler": delete_task},
    {"name": "complete_task", "description": "Mark a task as complete or incomplete.", "input_schema": CompleteTaskArgs.model_json_schema(), "mutates_state": True, "handler": complete_task},
    {"name": "get_my_tasks", "description": "Get tasks assigned to a user, grouped by section/priority/due_date.", "input_schema": GetMyTasksArgs.model_json_schema(), "mutates_state": False, "handler": get_my_tasks},
    {"name": "reorder_tasks", "description": "Reorder tasks by position.", "input_schema": ReorderTasksArgs.model_json_schema(), "mutates_state": True, "handler": reorder_tasks},
    {"name": "duplicate_task", "description": "Duplicate a task with optional subtasks.", "input_schema": DuplicateTaskArgs.model_json_schema(), "mutates_state": True, "handler": duplicate_task},
]
