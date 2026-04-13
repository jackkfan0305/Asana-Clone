"""Module 14: Teams & Members (5 tools)."""

import uuid

from sqlalchemy.orm import Session

from audit import log_audit
from models import Team, TeamMember, User
from schema import (
    AddTeamMemberArgs,
    CreateTeamArgs,
    GetTeamMembersArgs,
    RemoveTeamMemberArgs,
    UpdateTeamMemberRoleArgs,
)


def _team_dict(t: Team) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "organization_id": t.organization_id,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


def create_team(db: Session, args: CreateTeamArgs, current_user: User | None) -> dict:
    tid = f"team_{uuid.uuid4().hex[:6]}"
    org_id = args.organization_id or "org_001"
    team = Team(id=tid, name=args.name, description=args.description, organization_id=org_id)
    db.add(team)

    # Add creator as admin
    if current_user:
        db.add(TeamMember(team_id=tid, user_id=current_user.id, role="admin"))

    log_audit(db, "teams", tid, "INSERT", None, _team_dict(team), current_user.id if current_user else None)
    db.commit()
    db.refresh(team)
    return {"is_error": False, "text": f"Team created: {tid}", "structured_content": _team_dict(team)}


def add_team_member(db: Session, args: AddTeamMemberArgs, current_user: User | None) -> dict:
    existing = db.query(TeamMember).filter(
        TeamMember.team_id == args.team_id, TeamMember.user_id == args.user_id
    ).first()
    if existing:
        old_role = existing.role
        existing.role = args.role
        log_audit(db, "team_members", f"{args.team_id}:{args.user_id}", "UPDATE",
                  {"role": old_role}, {"role": args.role}, current_user.id if current_user else None)
        db.commit()
        return {"is_error": False, "text": "Member role updated", "structured_content": {"team_id": args.team_id, "user_id": args.user_id, "role": args.role}}

    member = TeamMember(team_id=args.team_id, user_id=args.user_id, role=args.role)
    db.add(member)
    log_audit(db, "team_members", f"{args.team_id}:{args.user_id}", "INSERT", None,
              {"team_id": args.team_id, "user_id": args.user_id, "role": args.role},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Team member added", "structured_content": {"team_id": args.team_id, "user_id": args.user_id, "role": args.role}}


def remove_team_member(db: Session, args: RemoveTeamMemberArgs, current_user: User | None) -> dict:
    member = db.query(TeamMember).filter(
        TeamMember.team_id == args.team_id, TeamMember.user_id == args.user_id
    ).first()
    if not member:
        return {"is_error": True, "text": "Team member not found", "structured_content": None}
    log_audit(db, "team_members", f"{args.team_id}:{args.user_id}", "DELETE",
              {"team_id": args.team_id, "user_id": args.user_id, "role": member.role}, None,
              current_user.id if current_user else None)
    db.delete(member)
    db.commit()
    return {"is_error": False, "text": "Team member removed", "structured_content": {"team_id": args.team_id, "user_id": args.user_id}}


def update_team_member_role(db: Session, args: UpdateTeamMemberRoleArgs, current_user: User | None) -> dict:
    member = db.query(TeamMember).filter(
        TeamMember.team_id == args.team_id, TeamMember.user_id == args.user_id
    ).first()
    if not member:
        return {"is_error": True, "text": "Team member not found", "structured_content": None}
    old_role = member.role
    member.role = args.role
    log_audit(db, "team_members", f"{args.team_id}:{args.user_id}", "UPDATE",
              {"role": old_role}, {"role": args.role}, current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": f"Role updated to {args.role}", "structured_content": {"team_id": args.team_id, "user_id": args.user_id, "role": args.role}}


def get_team_members(db: Session, args: GetTeamMembersArgs, current_user: User | None) -> dict:
    members = db.query(TeamMember).filter(TeamMember.team_id == args.team_id).all()
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append({
            "user_id": m.user_id,
            "role": m.role,
            "name": user.name if user else None,
            "avatar_url": user.avatar_url if user else None,
            "email": user.email if user else None,
        })
    return {"is_error": False, "text": f"Found {len(result)} team members", "structured_content": {"members": result}}


TOOLS = [
    {"name": "create_team", "description": "Create a new team.", "input_schema": CreateTeamArgs.model_json_schema(), "mutates_state": True, "handler": create_team},
    {"name": "add_team_member", "description": "Add a member to a team.", "input_schema": AddTeamMemberArgs.model_json_schema(), "mutates_state": True, "handler": add_team_member},
    {"name": "remove_team_member", "description": "Remove a member from a team.", "input_schema": RemoveTeamMemberArgs.model_json_schema(), "mutates_state": True, "handler": remove_team_member},
    {"name": "update_team_member_role", "description": "Update a team member's role.", "input_schema": UpdateTeamMemberRoleArgs.model_json_schema(), "mutates_state": True, "handler": update_team_member_role},
    {"name": "get_team_members", "description": "Get all members of a team.", "input_schema": GetTeamMembersArgs.model_json_schema(), "mutates_state": False, "handler": get_team_members},
]
