"""Module 10: Notifications (5 tools)."""

from sqlalchemy.orm import Session

from audit import log_audit
from models import Notification, User
from schema import (
    ArchiveNotificationArgs,
    BookmarkNotificationArgs,
    BulkArchiveNotificationsArgs,
    GetNotificationsArgs,
    GetUnreadCountArgs,
    MarkNotificationReadArgs,
)


def _notif_dict(n: Notification) -> dict:
    return {
        "id": n.id,
        "user_id": n.user_id,
        "type": n.type,
        "task_id": n.task_id,
        "project_id": n.project_id,
        "actor_id": n.actor_id,
        "actor_name": n.actor.name if n.actor else None,
        "title": n.title,
        "body": n.body,
        "read": n.read,
        "archived": n.archived,
        "bookmarked": n.bookmarked,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


def get_notifications(db: Session, args: GetNotificationsArgs, current_user: User | None) -> dict:
    uid = args.user_id or (current_user.id if current_user else None)
    if not uid:
        return {"is_error": True, "text": "No user specified", "structured_content": None}
    q = db.query(Notification).filter(Notification.user_id == uid)
    if args.read is not None:
        q = q.filter(Notification.read == args.read)
    if args.archived is not None:
        q = q.filter(Notification.archived == args.archived)
    if args.type:
        q = q.filter(Notification.type == args.type)
    total = q.count()
    notifs = q.order_by(Notification.created_at.desc()).offset(args.offset).limit(args.limit).all()
    return {
        "is_error": False,
        "text": f"Found {total} notifications",
        "structured_content": {"notifications": [_notif_dict(n) for n in notifs], "total": total},
    }


def mark_notification_read(db: Session, args: MarkNotificationReadArgs, current_user: User | None) -> dict:
    n = db.query(Notification).filter(Notification.id == args.notification_id).first()
    if not n:
        return {"is_error": True, "text": f"Notification not found: {args.notification_id}", "structured_content": None}
    n.read = args.read
    log_audit(db, "notifications", n.id, "UPDATE", {"read": not args.read}, {"read": args.read},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": f"Notification marked {'read' if args.read else 'unread'}", "structured_content": _notif_dict(n)}


def archive_notification(db: Session, args: ArchiveNotificationArgs, current_user: User | None) -> dict:
    n = db.query(Notification).filter(Notification.id == args.notification_id).first()
    if not n:
        return {"is_error": True, "text": f"Notification not found: {args.notification_id}", "structured_content": None}
    n.archived = True
    n.read = True
    log_audit(db, "notifications", n.id, "UPDATE", {"archived": False}, {"archived": True},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Notification archived", "structured_content": _notif_dict(n)}


def bulk_archive_notifications(db: Session, args: BulkArchiveNotificationsArgs, current_user: User | None) -> dict:
    uid = current_user.id if current_user else None
    count = 0
    for nid in args.notification_ids:
        n = db.query(Notification).filter(Notification.id == nid).first()
        if n:
            n.archived = True
            n.read = True
            log_audit(db, "notifications", nid, "UPDATE", {"archived": False}, {"archived": True}, uid)
            count += 1
    db.commit()
    return {"is_error": False, "text": f"Archived {count} notifications", "structured_content": {"archived_count": count}}


def bookmark_notification(db: Session, args: BookmarkNotificationArgs, current_user: User | None) -> dict:
    n = db.query(Notification).filter(Notification.id == args.notification_id).first()
    if not n:
        return {"is_error": True, "text": f"Notification not found: {args.notification_id}", "structured_content": None}
    old = n.bookmarked
    n.bookmarked = not old
    log_audit(db, "notifications", n.id, "UPDATE", {"bookmarked": old}, {"bookmarked": n.bookmarked},
              current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": f"Notification {'bookmarked' if n.bookmarked else 'unbookmarked'}", "structured_content": _notif_dict(n)}


def get_unread_count(db: Session, args: GetUnreadCountArgs, current_user: User | None) -> dict:
    uid = args.user_id or (current_user.id if current_user else None)
    if not uid:
        return {"is_error": True, "text": "No user specified", "structured_content": None}
    count = db.query(Notification).filter(
        Notification.user_id == uid, Notification.read == False, Notification.archived == False
    ).count()
    return {"is_error": False, "text": f"{count} unread notifications", "structured_content": {"unread_count": count}}


TOOLS = [
    {"name": "get_notifications", "description": "Get notifications for a user.", "input_schema": GetNotificationsArgs.model_json_schema(), "mutates_state": False, "handler": get_notifications},
    {"name": "mark_notification_read", "description": "Mark a notification as read or unread.", "input_schema": MarkNotificationReadArgs.model_json_schema(), "mutates_state": True, "handler": mark_notification_read},
    {"name": "archive_notification", "description": "Archive a notification.", "input_schema": ArchiveNotificationArgs.model_json_schema(), "mutates_state": True, "handler": archive_notification},
    {"name": "bulk_archive_notifications", "description": "Archive multiple notifications.", "input_schema": BulkArchiveNotificationsArgs.model_json_schema(), "mutates_state": True, "handler": bulk_archive_notifications},
    {"name": "bookmark_notification", "description": "Toggle bookmark on a notification.", "input_schema": BookmarkNotificationArgs.model_json_schema(), "mutates_state": True, "handler": bookmark_notification},
    {"name": "get_unread_count", "description": "Get unread notification count.", "input_schema": GetUnreadCountArgs.model_json_schema(), "mutates_state": False, "handler": get_unread_count},
]
