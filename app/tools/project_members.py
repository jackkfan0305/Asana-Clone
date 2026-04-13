"""Module 4: Project Members (3 tools)."""

from sqlalchemy.orm import Session

from audit import log_audit
from models import ProjectMember, User
from schema import AddProjectMemberArgs, GetProjectMembersArgs, RemoveProjectMemberArgs


def add_project_member(db: Session, args: AddProjectMemberArgs, current_user: User | None) -> dict:
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == args.project_id, ProjectMember.user_id == args.user_id
    ).first()
    if existing:
        existing.role = args.role
        db.commit()
        return {"is_error": False, "text": "Member role updated", "structured_content": {"project_id": args.project_id, "user_id": args.user_id, "role": args.role}}

    member = ProjectMember(project_id=args.project_id, user_id=args.user_id, role=args.role)
    db.add(member)
    log_audit(db, "project_members", f"{args.project_id}:{args.user_id}", "INSERT", None,
              {"project_id": args.project_id, "user_id": args.user_id, "role": args.role},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Member added", "structured_content": {"project_id": args.project_id, "user_id": args.user_id, "role": args.role}}


def remove_project_member(db: Session, args: RemoveProjectMemberArgs, current_user: User | None) -> dict:
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == args.project_id, ProjectMember.user_id == args.user_id
    ).first()
    if not member:
        return {"is_error": True, "text": "Member not found", "structured_content": None}
    log_audit(db, "project_members", f"{args.project_id}:{args.user_id}", "DELETE",
              {"project_id": args.project_id, "user_id": args.user_id, "role": member.role}, None,
              current_user.id if current_user else None)
    db.delete(member)
    db.commit()
    return {"is_error": False, "text": "Member removed", "structured_content": {"project_id": args.project_id, "user_id": args.user_id}}


def get_project_members(db: Session, args: GetProjectMembersArgs, current_user: User | None) -> dict:
    members = db.query(ProjectMember).filter(ProjectMember.project_id == args.project_id).all()
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append({
            "user_id": m.user_id,
            "role": m.role,
            "name": user.name if user else None,
            "avatar_url": user.avatar_url if user else None,
        })
    return {"is_error": False, "text": f"Found {len(result)} members", "structured_content": {"members": result}}


TOOLS = [
    {"name": "add_project_member", "description": "Add a member to a project.", "input_schema": AddProjectMemberArgs.model_json_schema(), "mutates_state": True, "handler": add_project_member},
    {"name": "remove_project_member", "description": "Remove a member from a project.", "input_schema": RemoveProjectMemberArgs.model_json_schema(), "mutates_state": True, "handler": remove_project_member},
    {"name": "get_project_members", "description": "Get all members of a project.", "input_schema": GetProjectMembersArgs.model_json_schema(), "mutates_state": False, "handler": get_project_members},
]
