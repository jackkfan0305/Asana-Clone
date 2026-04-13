"""Module 13: Project Status & Charts (4 tools)."""

import uuid
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from audit import log_audit
from models import Project, ProjectStatusUpdate, Section, Task, User
from schema import (
    GetCompletionChartDataArgs,
    GetProjectStatsArgs,
    PostStatusUpdateArgs,
    SetProjectStatusArgs,
)


def get_project_stats(db: Session, args: GetProjectStatsArgs, current_user: User | None) -> dict:
    p = db.query(Project).filter(Project.id == args.project_id).first()
    if not p:
        return {"is_error": True, "text": f"Project not found: {args.project_id}", "structured_content": None}

    total = db.query(Task).filter(Task.project_id == args.project_id, Task.parent_task_id.is_(None)).count()
    completed = db.query(Task).filter(Task.project_id == args.project_id, Task.parent_task_id.is_(None), Task.completed == True).count()
    incomplete = total - completed
    today = date.today()
    overdue = db.query(Task).filter(
        Task.project_id == args.project_id, Task.parent_task_id.is_(None),
        Task.completed == False, Task.due_date < today
    ).count()

    # By section
    sections = db.query(Section).filter(Section.project_id == args.project_id).order_by(Section.position).all()
    by_section = []
    for s in sections:
        count = db.query(Task).filter(Task.section_id == s.id, Task.parent_task_id.is_(None)).count()
        by_section.append({"section_id": s.id, "section_name": s.name, "task_count": count})

    # By assignee
    by_assignee = db.query(Task.assignee_id, func.count(Task.id)).filter(
        Task.project_id == args.project_id, Task.parent_task_id.is_(None), Task.assignee_id.isnot(None)
    ).group_by(Task.assignee_id).all()

    return {
        "is_error": False,
        "text": f"Project stats: {total} total, {completed} completed, {overdue} overdue",
        "structured_content": {
            "total_tasks": total,
            "completed_tasks": completed,
            "incomplete_tasks": incomplete,
            "overdue_tasks": overdue,
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
            "by_section": by_section,
            "by_assignee": [{"assignee_id": a_id, "count": cnt} for a_id, cnt in by_assignee],
        },
    }


def set_project_status(db: Session, args: SetProjectStatusArgs, current_user: User | None) -> dict:
    p = db.query(Project).filter(Project.id == args.project_id).first()
    if not p:
        return {"is_error": True, "text": f"Project not found: {args.project_id}", "structured_content": None}
    old_status = p.status
    p.status = args.status
    log_audit(db, "projects", p.id, "UPDATE", {"status": old_status}, {"status": args.status},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": f"Project status set to {args.status}", "structured_content": {"project_id": args.project_id, "status": args.status}}


def post_status_update(db: Session, args: PostStatusUpdateArgs, current_user: User | None) -> dict:
    p = db.query(Project).filter(Project.id == args.project_id).first()
    if not p:
        return {"is_error": True, "text": f"Project not found: {args.project_id}", "structured_content": None}

    uid = current_user.id if current_user else "usr_001"
    sid = f"psu_{uuid.uuid4().hex[:8]}"
    update = ProjectStatusUpdate(
        id=sid,
        project_id=args.project_id,
        author_id=uid,
        status=args.status,
        text=args.text,
    )
    db.add(update)
    p.status = args.status
    log_audit(db, "project_status_updates", sid, "INSERT", None,
              {"project_id": args.project_id, "status": args.status, "text": args.text}, uid)
    db.commit()
    return {
        "is_error": False,
        "text": "Status update posted",
        "structured_content": {"id": sid, "project_id": args.project_id, "status": args.status, "text": args.text},
    }


def get_completion_chart_data(db: Session, args: GetCompletionChartDataArgs, current_user: User | None) -> dict:
    today = date.today()
    if args.period == "week":
        days = 7
    elif args.period == "quarter":
        days = 90
    else:
        days = 30

    data_points = []
    for i in range(days):
        d = today - timedelta(days=days - 1 - i)
        completed = db.query(Task).filter(
            Task.project_id == args.project_id,
            Task.completed == True,
            func.date(Task.completed_at) <= d,
        ).count()
        total = db.query(Task).filter(
            Task.project_id == args.project_id,
            Task.parent_task_id.is_(None),
            func.date(Task.created_at) <= d,
        ).count()
        data_points.append({"date": d.isoformat(), "completed": completed, "total": total})

    return {
        "is_error": False,
        "text": f"Chart data for {args.period}",
        "structured_content": {"period": args.period, "data": data_points},
    }


TOOLS = [
    {"name": "get_project_stats", "description": "Get project statistics: task counts, completion rate, by section/assignee.", "input_schema": GetProjectStatsArgs.model_json_schema(), "mutates_state": False, "handler": get_project_stats},
    {"name": "set_project_status", "description": "Set project status (on_track/at_risk/off_track).", "input_schema": SetProjectStatusArgs.model_json_schema(), "mutates_state": True, "handler": set_project_status},
    {"name": "post_status_update", "description": "Post a project status update.", "input_schema": PostStatusUpdateArgs.model_json_schema(), "mutates_state": True, "handler": post_status_update},
    {"name": "get_completion_chart_data", "description": "Get task completion chart data over time.", "input_schema": GetCompletionChartDataArgs.model_json_schema(), "mutates_state": False, "handler": get_completion_chart_data},
]
