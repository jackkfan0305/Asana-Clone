import uuid

from sqlalchemy.orm import Session

from models import AuditLog


def log_audit(
    db: Session,
    table_name: str,
    record_id: str,
    action: str,
    old_data: dict | None = None,
    new_data: dict | None = None,
    user_id: str | None = None,
):
    """Write an entry to audit_log. Called by every mutating tool handler."""
    entry = AuditLog(
        id=f"aud_{uuid.uuid4().hex[:8]}",
        table_name=table_name,
        record_id=record_id,
        action=action,
        old_data=old_data,
        new_data=new_data,
        user_id=user_id,
    )
    db.add(entry)
