"""Module 12: Dashboard & Widgets (4 tools)."""

from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from audit import log_audit
from models import DashboardWidget, Project, Task, User
from schema import (
    GetDashboardDataArgs,
    GetOverdueTasksArgs,
    GetRecentItemsArgs,
    UpdateDashboardLayoutArgs,
)


def get_dashboard_data(db: Session, args: GetDashboardDataArgs, current_user: User | None) -> dict:
    uid = args.user_id or (current_user.id if current_user else None)
    if not uid:
        return {"is_error": True, "text": "No user specified", "structured_content": None}

    user = db.query(User).filter(User.id == uid).first()
    today = date.today()
    hour = datetime.now(timezone.utc).hour

    if hour < 12:
        greeting = f"Good morning, {user.name}" if user else "Good morning"
    elif hour < 17:
        greeting = f"Good afternoon, {user.name}" if user else "Good afternoon"
    else:
        greeting = f"Good evening, {user.name}" if user else "Good evening"

    # Stats
    my_tasks = db.query(Task).filter(Task.assignee_id == uid, Task.completed == False).count()
    completed_this_week = db.query(Task).filter(
        Task.assignee_id == uid, Task.completed == True
    ).count()
    overdue = db.query(Task).filter(
        Task.assignee_id == uid, Task.completed == False, Task.due_date < today
    ).count()
    due_today = db.query(Task).filter(
        Task.assignee_id == uid, Task.completed == False, Task.due_date == today
    ).count()

    # Widgets
    widgets = db.query(DashboardWidget).filter(DashboardWidget.user_id == uid).order_by(DashboardWidget.position).all()
    widget_data = [
        {"id": w.id, "widget_type": w.widget_type, "position": w.position, "config_json": w.config_json}
        for w in widgets
    ]

    return {
        "is_error": False,
        "text": greeting,
        "structured_content": {
            "greeting": greeting,
            "date": today.isoformat(),
            "stats": {
                "tasks_assigned": my_tasks,
                "tasks_completed": completed_this_week,
                "overdue": overdue,
                "due_today": due_today,
            },
            "widgets": widget_data,
        },
    }


def get_overdue_tasks(db: Session, args: GetOverdueTasksArgs, current_user: User | None) -> dict:
    today = date.today()
    q = db.query(Task).filter(Task.completed == False, Task.due_date < today)
    if args.user_id:
        q = q.filter(Task.assignee_id == args.user_id)
    elif current_user:
        q = q.filter(Task.assignee_id == current_user.id)
    if args.project_id:
        q = q.filter(Task.project_id == args.project_id)
    tasks = q.order_by(Task.due_date).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {len(tasks)} overdue tasks",
        "structured_content": {
            "tasks": [
                {"id": t.id, "title": t.title, "due_date": t.due_date.isoformat() if t.due_date else None, "assignee_id": t.assignee_id, "project_id": t.project_id}
                for t in tasks
            ],
        },
    }


def update_dashboard_layout(db: Session, args: UpdateDashboardLayoutArgs, current_user: User | None) -> dict:
    # Remove existing widgets
    db.query(DashboardWidget).filter(DashboardWidget.user_id == args.user_id).delete()

    for i, w in enumerate(args.widgets):
        import uuid
        db.add(DashboardWidget(
            id=f"wid_{uuid.uuid4().hex[:8]}",
            user_id=args.user_id,
            widget_type=w.get("widget_type", "my_tasks"),
            position=w.get("position", i),
            config_json=w.get("config_json"),
        ))

    log_audit(db, "dashboard_widgets", args.user_id, "UPDATE", None, {"widgets_count": len(args.widgets)},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": f"Dashboard updated with {len(args.widgets)} widgets", "structured_content": {"user_id": args.user_id, "widget_count": len(args.widgets)}}


def get_recent_items(db: Session, args: GetRecentItemsArgs, current_user: User | None) -> dict:
    uid = args.user_id or (current_user.id if current_user else None)
    limit = args.limit or 20

    recent_tasks = db.query(Task).filter(
        Task.assignee_id == uid
    ).order_by(Task.updated_at.desc()).limit(limit).all()

    recent_projects = db.query(Project).order_by(Project.updated_at.desc()).limit(limit).all()

    return {
        "is_error": False,
        "text": "Recent items retrieved",
        "structured_content": {
            "tasks": [
                {"id": t.id, "title": t.title, "updated_at": t.updated_at.isoformat() if t.updated_at else None}
                for t in recent_tasks
            ],
            "projects": [
                {"id": p.id, "name": p.name, "updated_at": p.updated_at.isoformat() if p.updated_at else None}
                for p in recent_projects
            ],
        },
    }


TOOLS = [
    {"name": "get_dashboard_data", "description": "Get home dashboard data: greeting, stats, widgets.", "input_schema": GetDashboardDataArgs.model_json_schema(), "mutates_state": False, "handler": get_dashboard_data},
    {"name": "get_overdue_tasks", "description": "Get overdue tasks.", "input_schema": GetOverdueTasksArgs.model_json_schema(), "mutates_state": False, "handler": get_overdue_tasks},
    {"name": "update_dashboard_layout", "description": "Update dashboard widget layout.", "input_schema": UpdateDashboardLayoutArgs.model_json_schema(), "mutates_state": True, "handler": update_dashboard_layout},
    {"name": "get_recent_items", "description": "Get recently viewed/modified items.", "input_schema": GetRecentItemsArgs.model_json_schema(), "mutates_state": False, "handler": get_recent_items},
]
