"""Module 15: Followers & Attachments (5 tools)."""

import uuid

from sqlalchemy.orm import Session

from audit import log_audit
from models import Attachment, Notification, Task, TaskFollower, User
from schema import (
    AddAttachmentArgs,
    AddFollowerArgs,
    DeleteAttachmentArgs,
    GetAttachmentsArgs,
    RemoveFollowerArgs,
)


def add_follower(db: Session, args: AddFollowerArgs, current_user: User | None) -> dict:
    existing = db.query(TaskFollower).filter(
        TaskFollower.task_id == args.task_id, TaskFollower.user_id == args.user_id
    ).first()
    if existing:
        return {"is_error": False, "text": "Already following", "structured_content": {"task_id": args.task_id, "user_id": args.user_id}}

    db.add(TaskFollower(task_id=args.task_id, user_id=args.user_id))

    # Notify
    if current_user and args.user_id != current_user.id:
        task = db.query(Task).filter(Task.id == args.task_id).first()
        db.add(Notification(
            id=f"ntf_{uuid.uuid4().hex[:8]}",
            user_id=args.user_id,
            type="follower_added",
            task_id=args.task_id,
            project_id=task.project_id if task else None,
            actor_id=current_user.id,
            title=f"You were added as a follower on '{task.title}'" if task else "You were added as a follower",
        ))

    log_audit(db, "task_followers", f"{args.task_id}:{args.user_id}", "INSERT", None,
              {"task_id": args.task_id, "user_id": args.user_id}, current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Follower added", "structured_content": {"task_id": args.task_id, "user_id": args.user_id}}


def remove_follower(db: Session, args: RemoveFollowerArgs, current_user: User | None) -> dict:
    link = db.query(TaskFollower).filter(
        TaskFollower.task_id == args.task_id, TaskFollower.user_id == args.user_id
    ).first()
    if not link:
        return {"is_error": True, "text": "Not following", "structured_content": None}
    log_audit(db, "task_followers", f"{args.task_id}:{args.user_id}", "DELETE",
              {"task_id": args.task_id, "user_id": args.user_id}, None,
              current_user.id if current_user else None)
    db.delete(link)
    db.commit()
    return {"is_error": False, "text": "Follower removed", "structured_content": {"task_id": args.task_id, "user_id": args.user_id}}


def add_attachment(db: Session, args: AddAttachmentArgs, current_user: User | None) -> dict:
    aid = f"att_{uuid.uuid4().hex[:8]}"
    attachment = Attachment(
        id=aid,
        task_id=args.task_id,
        filename=args.filename,
        url=args.url,
        mime_type=args.mime_type,
        file_size=args.file_size,
        uploaded_by=current_user.id if current_user else None,
    )
    db.add(attachment)
    log_audit(db, "attachments", aid, "INSERT", None, {"task_id": args.task_id, "filename": args.filename},
              current_user.id if current_user else None)
    db.commit()
    return {
        "is_error": False,
        "text": f"Attachment added: {aid}",
        "structured_content": {"id": aid, "task_id": args.task_id, "filename": args.filename, "url": args.url},
    }


def get_attachments(db: Session, args: GetAttachmentsArgs, current_user: User | None) -> dict:
    attachments = db.query(Attachment).filter(Attachment.task_id == args.task_id).order_by(Attachment.created_at).all()
    return {
        "is_error": False,
        "text": f"Found {len(attachments)} attachments",
        "structured_content": {
            "attachments": [
                {
                    "id": a.id,
                    "filename": a.filename,
                    "url": a.url,
                    "mime_type": a.mime_type,
                    "file_size": a.file_size,
                    "uploaded_by": a.uploaded_by,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in attachments
            ],
        },
    }


def delete_attachment(db: Session, args: DeleteAttachmentArgs, current_user: User | None) -> dict:
    a = db.query(Attachment).filter(Attachment.id == args.attachment_id).first()
    if not a:
        return {"is_error": True, "text": f"Attachment not found: {args.attachment_id}", "structured_content": None}
    log_audit(db, "attachments", a.id, "DELETE", {"filename": a.filename}, None,
              current_user.id if current_user else None)
    db.delete(a)
    db.commit()
    return {"is_error": False, "text": f"Attachment deleted: {args.attachment_id}", "structured_content": {"id": args.attachment_id}}


TOOLS = [
    {"name": "add_follower", "description": "Add a follower to a task.", "input_schema": AddFollowerArgs.model_json_schema(), "mutates_state": True, "handler": add_follower},
    {"name": "remove_follower", "description": "Remove a follower from a task.", "input_schema": RemoveFollowerArgs.model_json_schema(), "mutates_state": True, "handler": remove_follower},
    {"name": "add_attachment", "description": "Add an attachment to a task.", "input_schema": AddAttachmentArgs.model_json_schema(), "mutates_state": True, "handler": add_attachment},
    {"name": "get_attachments", "description": "Get attachments for a task.", "input_schema": GetAttachmentsArgs.model_json_schema(), "mutates_state": False, "handler": get_attachments},
    {"name": "delete_attachment", "description": "Delete an attachment.", "input_schema": DeleteAttachmentArgs.model_json_schema(), "mutates_state": True, "handler": delete_attachment},
]
