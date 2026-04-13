"""Module 7: Comments & Activity (5 tools)."""

import re
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from audit import log_audit
from models import ActivityLog, Comment, CommentLike, Mention, Notification, Task, User
from schema import (
    AddCommentArgs,
    DeleteCommentArgs,
    EditCommentArgs,
    GetActivityLogArgs,
    LikeCommentArgs,
)


def _comment_dict(c: Comment) -> dict:
    return {
        "id": c.id,
        "task_id": c.task_id,
        "author_id": c.author_id,
        "author_name": c.author.name if c.author else None,
        "body": c.body,
        "edited_at": c.edited_at.isoformat() if c.edited_at else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "likes_count": len(c.likes) if c.likes else 0,
    }


def _parse_mentions(body: str) -> list[str]:
    return re.findall(r'data-mention="(usr_\w+)"', body)


def add_comment(db: Session, args: AddCommentArgs, current_user: User | None) -> dict:
    task = db.query(Task).filter(Task.id == args.task_id).first()
    if not task:
        return {"is_error": True, "text": f"Task not found: {args.task_id}", "structured_content": None}

    uid = args.author_id or (current_user.id if current_user else None)
    cid = f"cmt_{uuid.uuid4().hex[:8]}"
    comment = Comment(id=cid, task_id=args.task_id, author_id=uid, body=args.body)
    db.add(comment)

    # Activity log
    db.add(ActivityLog(
        id=f"act_{uuid.uuid4().hex[:8]}",
        task_id=args.task_id,
        project_id=task.project_id,
        user_id=uid or "system",
        action="commented",
        extra_data={"comment_id": cid},
    ))

    # Parse @mentions
    mentioned_ids = _parse_mentions(args.body)
    for mid in mentioned_ids:
        db.add(Mention(
            id=f"mnt_{uuid.uuid4().hex[:8]}",
            comment_id=cid,
            task_id=args.task_id,
            mentioned_user_id=mid,
        ))
        db.add(Notification(
            id=f"ntf_{uuid.uuid4().hex[:8]}",
            user_id=mid,
            type="mentioned",
            task_id=args.task_id,
            project_id=task.project_id,
            actor_id=uid,
            title=f"You were mentioned in '{task.title}'",
        ))

    # Notify followers (except author)
    for fl in (task.follower_links or []):
        if fl.user_id != uid and fl.user_id not in mentioned_ids:
            db.add(Notification(
                id=f"ntf_{uuid.uuid4().hex[:8]}",
                user_id=fl.user_id,
                type="comment_added",
                task_id=args.task_id,
                project_id=task.project_id,
                actor_id=uid,
                title=f"New comment on '{task.title}'",
            ))

    log_audit(db, "comments", cid, "INSERT", None, {"task_id": args.task_id, "body": args.body}, uid)
    db.commit()
    db.refresh(comment)
    return {"is_error": False, "text": f"Comment added: {cid}", "structured_content": _comment_dict(comment)}


def edit_comment(db: Session, args: EditCommentArgs, current_user: User | None) -> dict:
    comment = db.query(Comment).filter(Comment.id == args.comment_id).first()
    if not comment:
        return {"is_error": True, "text": f"Comment not found: {args.comment_id}", "structured_content": None}
    old_body = comment.body
    comment.body = args.body
    comment.edited_at = datetime.now(timezone.utc)
    log_audit(db, "comments", comment.id, "UPDATE", {"body": old_body}, {"body": args.body},
              current_user.id if current_user else None)
    db.commit()
    db.refresh(comment)
    return {"is_error": False, "text": "Comment edited", "structured_content": _comment_dict(comment)}


def delete_comment(db: Session, args: DeleteCommentArgs, current_user: User | None) -> dict:
    comment = db.query(Comment).filter(Comment.id == args.comment_id).first()
    if not comment:
        return {"is_error": True, "text": f"Comment not found: {args.comment_id}", "structured_content": None}
    log_audit(db, "comments", comment.id, "DELETE", {"body": comment.body}, None,
              current_user.id if current_user else None)
    db.delete(comment)
    db.commit()
    return {"is_error": False, "text": f"Comment deleted: {args.comment_id}", "structured_content": {"id": args.comment_id}}


def like_comment(db: Session, args: LikeCommentArgs, current_user: User | None) -> dict:
    comment = db.query(Comment).filter(Comment.id == args.comment_id).first()
    if not comment:
        return {"is_error": True, "text": f"Comment not found: {args.comment_id}", "structured_content": None}

    uid = args.user_id or (current_user.id if current_user else None)
    if not uid:
        return {"is_error": True, "text": "No user specified", "structured_content": None}

    existing = db.query(CommentLike).filter(
        CommentLike.comment_id == args.comment_id, CommentLike.user_id == uid
    ).first()
    if existing:
        log_audit(db, "comment_likes", f"{args.comment_id}:{uid}", "DELETE",
                  {"comment_id": args.comment_id, "user_id": uid}, None, uid)
        db.delete(existing)
        db.commit()
        return {"is_error": False, "text": "Comment unliked", "structured_content": {"comment_id": args.comment_id, "liked": False}}

    db.add(CommentLike(comment_id=args.comment_id, user_id=uid))
    log_audit(db, "comment_likes", f"{args.comment_id}:{uid}", "INSERT", None,
              {"comment_id": args.comment_id, "user_id": uid}, uid)
    db.commit()
    return {"is_error": False, "text": "Comment liked", "structured_content": {"comment_id": args.comment_id, "liked": True}}


def get_activity_log(db: Session, args: GetActivityLogArgs, current_user: User | None) -> dict:
    q = db.query(ActivityLog)
    if args.task_id:
        q = q.filter(ActivityLog.task_id == args.task_id)
    if args.project_id:
        q = q.filter(ActivityLog.project_id == args.project_id)
    if args.user_id:
        q = q.filter(ActivityLog.user_id == args.user_id)
    total = q.count()
    entries = q.order_by(ActivityLog.created_at.desc()).offset(args.offset).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {total} activity entries",
        "structured_content": {
            "entries": [
                {
                    "id": e.id,
                    "task_id": e.task_id,
                    "project_id": e.project_id,
                    "user_id": e.user_id,
                    "action": e.action,
                    "field_changed": e.field_changed,
                    "old_value": e.old_value,
                    "new_value": e.new_value,
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                }
                for e in entries
            ],
            "total": total,
        },
    }


TOOLS = [
    {"name": "add_comment", "description": "Add a comment to a task.", "input_schema": AddCommentArgs.model_json_schema(), "mutates_state": True, "handler": add_comment},
    {"name": "edit_comment", "description": "Edit a comment's body.", "input_schema": EditCommentArgs.model_json_schema(), "mutates_state": True, "handler": edit_comment},
    {"name": "delete_comment", "description": "Delete a comment.", "input_schema": DeleteCommentArgs.model_json_schema(), "mutates_state": True, "handler": delete_comment},
    {"name": "like_comment", "description": "Toggle like on a comment.", "input_schema": LikeCommentArgs.model_json_schema(), "mutates_state": True, "handler": like_comment},
    {"name": "get_activity_log", "description": "Get activity log entries.", "input_schema": GetActivityLogArgs.model_json_schema(), "mutates_state": False, "handler": get_activity_log},
]
