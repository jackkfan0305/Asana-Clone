"""Module 6: Subtasks & Dependencies (6 tools)."""

import uuid

from sqlalchemy.orm import Session

from audit import log_audit
from models import ActivityLog, Task, TaskDependency, User
from schema import (
    AddSubtaskArgs,
    ConvertSubtaskToTaskArgs,
    GetSubtaskTreeArgs,
    RemoveDependencyArgs,
    RemoveSubtaskArgs,
    SetDependencyArgs,
)


def _task_dict(t: Task) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "assignee_id": t.assignee_id,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "completed": t.completed,
        "parent_task_id": t.parent_task_id,
        "position": t.position,
        "priority": t.priority,
    }


def _next_task_id(db: Session) -> str:
    last = db.query(Task).order_by(Task.id.desc()).first()
    if last and last.id.startswith("tsk_"):
        num = int(last.id.split("_")[1]) + 1
    else:
        num = 1
    return f"tsk_{num:03d}"


def _build_tree(task: Task) -> dict:
    d = _task_dict(task)
    d["subtasks"] = [_build_tree(s) for s in (task.subtasks or [])]
    return d


def add_subtask(db: Session, args: AddSubtaskArgs, current_user: User | None) -> dict:
    parent = db.query(Task).filter(Task.id == args.parent_task_id).first()
    if not parent:
        return {"is_error": True, "text": f"Parent task not found: {args.parent_task_id}", "structured_content": None}

    sub_id = _next_task_id(db)
    pos = len(parent.subtasks) if parent.subtasks else 0
    subtask = Task(
        id=sub_id,
        title=args.title,
        assignee_id=args.assignee_id,
        due_date=args.due_date,
        parent_task_id=args.parent_task_id,
        project_id=parent.project_id,
        section_id=parent.section_id,
        position=pos,
        created_by=current_user.id if current_user else None,
    )
    db.add(subtask)
    db.add(ActivityLog(
        id=f"act_{uuid.uuid4().hex[:8]}",
        task_id=sub_id,
        project_id=parent.project_id,
        user_id=current_user.id if current_user else "system",
        action="created",
        new_value=f"subtask of {args.parent_task_id}",
    ))
    log_audit(db, "tasks", sub_id, "INSERT", None, _task_dict(subtask), current_user.id if current_user else None)
    db.commit()
    db.refresh(subtask)
    return {"is_error": False, "text": f"Subtask created: {sub_id}", "structured_content": _task_dict(subtask)}


def remove_subtask(db: Session, args: RemoveSubtaskArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}
    if not task.parent_task_id:
        return {"is_error": True, "text": "Task is not a subtask", "structured_content": None}
    task.parent_task_id = None
    log_audit(db, "tasks", task.id, "UPDATE", {"parent_task_id": task.parent_task_id}, {"parent_task_id": None},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Subtask detached", "structured_content": _task_dict(task)}


def get_subtask_tree(db: Session, args: GetSubtaskTreeArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}
    return {"is_error": False, "text": "Subtask tree retrieved", "structured_content": _build_tree(task)}


def convert_subtask_to_task(db: Session, args: ConvertSubtaskToTaskArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}
    task.parent_task_id = None
    if args.project_id:
        task.project_id = args.project_id
    if args.section_id:
        task.section_id = args.section_id
    log_audit(db, "tasks", task.id, "UPDATE", None, _task_dict(task), current_user.id if current_user else None)
    db.commit()
    db.refresh(task)
    return {"is_error": False, "text": "Subtask converted to task", "structured_content": _task_dict(task)}


def set_dependency(db: Session, args: SetDependencyArgs, current_user: User | None) -> dict:
    if args.task_id == args.depends_on_task_id:
        return {"is_error": True, "text": "Cannot depend on self", "structured_content": None}

    for t_id in [args.task_id, args.depends_on_task_id]:
        if not db.query(Task).filter(Task.id == t_id).first():
            return {"is_error": True, "text": f"Task not found: {t_id}", "structured_content": None}

    existing = db.query(TaskDependency).filter(
        TaskDependency.task_id == args.task_id,
        TaskDependency.depends_on_task_id == args.depends_on_task_id,
    ).first()
    if existing:
        return {"is_error": True, "text": "Dependency already exists", "structured_content": None}

    # Circular dependency detection
    def _has_path(from_id: str, to_id: str, visited: set | None = None) -> bool:
        if visited is None:
            visited = set()
        if from_id == to_id:
            return True
        if from_id in visited:
            return False
        visited.add(from_id)
        deps = db.query(TaskDependency).filter(TaskDependency.task_id == from_id).all()
        for d in deps:
            if _has_path(d.depends_on_task_id, to_id, visited):
                return True
        return False

    if _has_path(args.depends_on_task_id, args.task_id):
        return {"is_error": True, "text": "Circular dependency detected", "structured_content": None}

    dep = TaskDependency(
        task_id=args.task_id,
        depends_on_task_id=args.depends_on_task_id,
        dependency_type=args.dependency_type,
    )
    db.add(dep)
    db.add(ActivityLog(
        id=f"act_{uuid.uuid4().hex[:8]}",
        task_id=args.task_id,
        user_id=current_user.id if current_user else "system",
        action="dependency_added",
        new_value=f"{args.dependency_type}:{args.depends_on_task_id}",
    ))
    log_audit(db, "task_dependencies", f"{args.task_id}:{args.depends_on_task_id}", "INSERT", None,
              {"task_id": args.task_id, "depends_on_task_id": args.depends_on_task_id, "type": args.dependency_type},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Dependency set", "structured_content": {"task_id": args.task_id, "depends_on_task_id": args.depends_on_task_id, "dependency_type": args.dependency_type}}


def remove_dependency(db: Session, args: RemoveDependencyArgs, current_user: User | None) -> dict:
    dep = db.query(TaskDependency).filter(
        TaskDependency.task_id == args.task_id,
        TaskDependency.depends_on_task_id == args.depends_on_task_id,
    ).first()
    if not dep:
        return {"is_error": True, "text": "Dependency not found", "structured_content": None}
    log_audit(db, "task_dependencies", f"{args.task_id}:{args.depends_on_task_id}", "DELETE",
              {"task_id": args.task_id, "depends_on_task_id": args.depends_on_task_id}, None,
              current_user.id if current_user else None)
    db.delete(dep)
    db.commit()
    return {"is_error": False, "text": "Dependency removed", "structured_content": {"task_id": args.task_id, "depends_on_task_id": args.depends_on_task_id}}


TOOLS = [
    {"name": "add_subtask", "description": "Add a subtask to a parent task.", "input_schema": AddSubtaskArgs.model_json_schema(), "mutates_state": True, "handler": add_subtask},
    {"name": "remove_subtask", "description": "Detach a subtask (becomes top-level task).", "input_schema": RemoveSubtaskArgs.model_json_schema(), "mutates_state": True, "handler": remove_subtask},
    {"name": "get_subtask_tree", "description": "Get nested subtask hierarchy.", "input_schema": GetSubtaskTreeArgs.model_json_schema(), "mutates_state": False, "handler": get_subtask_tree},
    {"name": "convert_subtask_to_task", "description": "Convert a subtask to a standalone task.", "input_schema": ConvertSubtaskToTaskArgs.model_json_schema(), "mutates_state": True, "handler": convert_subtask_to_task},
    {"name": "set_dependency", "description": "Set a dependency between two tasks.", "input_schema": SetDependencyArgs.model_json_schema(), "mutates_state": True, "handler": set_dependency},
    {"name": "remove_dependency", "description": "Remove a dependency between two tasks.", "input_schema": RemoveDependencyArgs.model_json_schema(), "mutates_state": True, "handler": remove_dependency},
]
