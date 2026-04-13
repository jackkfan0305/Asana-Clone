"""Module 8: Custom Fields (4 tools)."""

import uuid

from sqlalchemy.orm import Session

from audit import log_audit
from models import CustomField, CustomFieldOption, ProjectCustomField, TaskCustomFieldValue, User
from schema import (
    CreateCustomFieldArgs,
    GetProjectCustomFieldsArgs,
    SetCustomFieldValueArgs,
    UpdateCustomFieldArgs,
)


def _field_dict(f: CustomField) -> dict:
    return {
        "id": f.id,
        "name": f.name,
        "field_type": f.field_type,
        "options": [
            {"id": o.id, "name": o.name, "color": o.color, "position": o.position}
            for o in (f.options or [])
        ],
        "created_at": f.created_at.isoformat() if f.created_at else None,
    }


def create_custom_field(db: Session, args: CreateCustomFieldArgs, current_user: User | None) -> dict:
    fid = f"cf_{uuid.uuid4().hex[:8]}"
    field = CustomField(id=fid, name=args.name, field_type=args.field_type)
    db.add(field)

    if args.options:
        for i, opt in enumerate(args.options):
            db.add(CustomFieldOption(
                id=f"cfo_{uuid.uuid4().hex[:8]}",
                custom_field_id=fid,
                name=opt.get("name", ""),
                color=opt.get("color"),
                position=i,
            ))

    if args.project_id:
        db.add(ProjectCustomField(project_id=args.project_id, custom_field_id=fid))

    log_audit(db, "custom_fields", fid, "INSERT", None, {"name": args.name, "field_type": args.field_type},
              current_user.id if current_user else None)
    db.commit()
    db.refresh(field)
    return {"is_error": False, "text": f"Custom field created: {fid}", "structured_content": _field_dict(field)}


def update_custom_field(db: Session, args: UpdateCustomFieldArgs, current_user: User | None) -> dict:
    field = db.query(CustomField).filter(CustomField.id == args.field_id).first()
    if not field:
        return {"is_error": True, "text": f"Custom field not found: {args.field_id}", "structured_content": None}

    if args.name is not None:
        field.name = args.name

    if args.add_options:
        for opt in args.add_options:
            db.add(CustomFieldOption(
                id=f"cfo_{uuid.uuid4().hex[:8]}",
                custom_field_id=field.id,
                name=opt.get("name", ""),
                color=opt.get("color"),
                position=len(field.options) if field.options else 0,
            ))

    if args.remove_option_ids:
        for oid in args.remove_option_ids:
            opt = db.query(CustomFieldOption).filter(CustomFieldOption.id == oid).first()
            if opt:
                db.delete(opt)

    log_audit(db, "custom_fields", field.id, "UPDATE", None, _field_dict(field),
              current_user.id if current_user else None)
    db.commit()
    db.refresh(field)
    return {"is_error": False, "text": "Custom field updated", "structured_content": _field_dict(field)}


def set_custom_field_value(db: Session, args: SetCustomFieldValueArgs, current_user: User | None) -> dict:
    field = db.query(CustomField).filter(CustomField.id == args.field_id).first()
    if not field:
        return {"is_error": True, "text": f"Custom field not found: {args.field_id}", "structured_content": None}

    existing = db.query(TaskCustomFieldValue).filter(
        TaskCustomFieldValue.task_id == args.task_id,
        TaskCustomFieldValue.custom_field_id == args.field_id,
    ).first()

    if existing:
        # Update
        if field.field_type == "text":
            existing.string_value = str(args.value) if args.value is not None else None
        elif field.field_type == "number":
            existing.number_value = args.value
        elif field.field_type == "date":
            existing.date_value = args.value
        elif field.field_type == "dropdown":
            existing.option_id = args.value
        elif field.field_type == "people":
            existing.user_ids = args.value
        elif field.field_type == "checkbox":
            existing.boolean_value = args.value
        else:
            existing.string_value = str(args.value) if args.value is not None else None
    else:
        val = TaskCustomFieldValue(task_id=args.task_id, custom_field_id=args.field_id)
        if field.field_type == "text":
            val.string_value = str(args.value) if args.value is not None else None
        elif field.field_type == "number":
            val.number_value = args.value
        elif field.field_type == "date":
            val.date_value = args.value
        elif field.field_type == "dropdown":
            val.option_id = args.value
        elif field.field_type == "people":
            val.user_ids = args.value
        elif field.field_type == "checkbox":
            val.boolean_value = args.value
        else:
            val.string_value = str(args.value) if args.value is not None else None
        db.add(val)

    log_audit(db, "task_custom_field_values", f"{args.task_id}:{args.field_id}", "UPDATE" if existing else "INSERT",
              None, {"value": str(args.value)}, current_user.id if current_user else None)
    db.commit()
    return {"is_error": False, "text": "Custom field value set", "structured_content": {"task_id": args.task_id, "field_id": args.field_id, "value": args.value}}


def get_project_custom_fields(db: Session, args: GetProjectCustomFieldsArgs, current_user: User | None) -> dict:
    links = db.query(ProjectCustomField).filter(ProjectCustomField.project_id == args.project_id).order_by(ProjectCustomField.position).all()
    fields = []
    for link in links:
        field = db.query(CustomField).filter(CustomField.id == link.custom_field_id).first()
        if field:
            fields.append(_field_dict(field))
    return {"is_error": False, "text": f"Found {len(fields)} custom fields", "structured_content": {"fields": fields}}


TOOLS = [
    {"name": "create_custom_field", "description": "Create a custom field.", "input_schema": CreateCustomFieldArgs.model_json_schema(), "mutates_state": True, "handler": create_custom_field},
    {"name": "update_custom_field", "description": "Update a custom field.", "input_schema": UpdateCustomFieldArgs.model_json_schema(), "mutates_state": True, "handler": update_custom_field},
    {"name": "set_custom_field_value", "description": "Set a custom field value on a task.", "input_schema": SetCustomFieldValueArgs.model_json_schema(), "mutates_state": True, "handler": set_custom_field_value},
    {"name": "get_project_custom_fields", "description": "Get custom fields for a project.", "input_schema": GetProjectCustomFieldsArgs.model_json_schema(), "mutates_state": False, "handler": get_project_custom_fields},
]
