"""Module 17: Calendar & Dates (3 tools)."""

from sqlalchemy.orm import Session

from audit import log_audit
from models import Task, User
from schema import CreateTaskOnDateArgs, GetCalendarTasksArgs, UpdateTaskDatesArgs


def get_calendar_tasks(db: Session, args: GetCalendarTasksArgs, current_user: User | None) -> dict:
    q = db.query(Task).filter(
        Task.due_date >= args.start_date,
        Task.due_date <= args.end_date,
        Task.parent_task_id.is_(None),
    )
    if args.project_id:
        q = q.filter(Task.project_id == args.project_id)
    if args.assignee_id:
        q = q.filter(Task.assignee_id == args.assignee_id)

    tasks = q.order_by(Task.due_date, Task.position).all()
    return {
        "is_error": False,
        "text": f"Found {len(tasks)} tasks in date range",
        "structured_content": {
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "start_date": t.start_date.isoformat() if t.start_date else None,
                    "assignee_id": t.assignee_id,
                    "project_id": t.project_id,
                    "completed": t.completed,
                    "priority": t.priority,
                }
                for t in tasks
            ],
        },
    }


def create_task_on_date(db: Session, args: CreateTaskOnDateArgs, current_user: User | None) -> dict:
    # Reuse create_task logic
    from tools.tasks import create_task as _create_task
    from schema import CreateTaskArgs

    create_args = CreateTaskArgs(
        title=args.title,
        due_date=args.due_date,
        project_id=args.project_id,
        assignee_id=args.assignee_id,
    )
    return _create_task(db, create_args, current_user)


def update_task_dates(db: Session, args: UpdateTaskDatesArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}

    old = {"due_date": task.due_date.isoformat() if task.due_date else None, "start_date": task.start_date.isoformat() if task.start_date else None}
    if args.due_date is not None:
        task.due_date = args.due_date
    if args.start_date is not None:
        task.start_date = args.start_date
    new = {"due_date": task.due_date.isoformat() if task.due_date else None, "start_date": task.start_date.isoformat() if task.start_date else None}

    log_audit(db, "tasks", task.id, "UPDATE", old, new, current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Task dates updated", "structured_content": {"task_id": args.task_id, **new}}


TOOLS = [
    {"name": "get_calendar_tasks", "description": "Get tasks within a date range for calendar view.", "input_schema": GetCalendarTasksArgs.model_json_schema(), "mutates_state": False, "handler": get_calendar_tasks},
    {"name": "create_task_on_date", "description": "Create a task with a specific due date.", "input_schema": CreateTaskOnDateArgs.model_json_schema(), "mutates_state": True, "handler": create_task_on_date},
    {"name": "update_task_dates", "description": "Update a task's due date and/or start date.", "input_schema": UpdateTaskDatesArgs.model_json_schema(), "mutates_state": True, "handler": update_task_dates},
]
