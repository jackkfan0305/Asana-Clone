from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    PrimaryKeyConstraint,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TIMESTAMP
from sqlalchemy.orm import relationship

from db import Base


class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="organization")
    teams = relationship("Team", back_populates="organization")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'standard', 'viewer')", name="ck_users_role"),
    )
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    avatar_url = Column(String)
    role = Column(String, nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    last_login = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="users", foreign_keys=[organization_id])
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions", foreign_keys=[user_id])


class Team(Base):
    __tablename__ = "teams"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    avatar_url = Column(String)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="teams", foreign_keys=[organization_id])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'member')", name="ck_team_members_role"),
        PrimaryKeyConstraint("team_id", "user_id"),
    )
    team_id = Column(String, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False, default="member")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="members", foreign_keys=[team_id])
    user = relationship("User", foreign_keys=[user_id])


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(
            "status IN ('on_track', 'at_risk', 'off_track', 'on_hold', 'complete')",
            name="ck_projects_status",
        ),
        CheckConstraint(
            "default_view IN ('list', 'board', 'calendar', 'timeline', 'dashboard')",
            name="ck_projects_default_view",
        ),
    )
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    team_id = Column(String, ForeignKey("teams.id"))
    owner_id = Column(String, ForeignKey("users.id"))
    color = Column(String)
    icon = Column(String)
    status = Column(String, default="on_track")
    default_view = Column(String, default="list")
    enabled_views = Column(ARRAY(String), default=["overview", "list", "board", "timeline", "dashboard"])
    archived = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="projects", foreign_keys=[team_id])
    owner = relationship("User", foreign_keys=[owner_id])
    sections = relationship("Section", back_populates="project", cascade="all, delete-orphan", order_by="Section.position")
    tasks = relationship("Task", back_populates="project", foreign_keys="Task.project_id")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    status_updates = relationship("ProjectStatusUpdate", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (
        CheckConstraint(
            "role IN ('owner', 'editor', 'commenter', 'viewer')",
            name="ck_project_members_role",
        ),
        PrimaryKeyConstraint("project_id", "user_id"),
    )
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False, default="editor")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="members", foreign_keys=[project_id])
    user = relationship("User", foreign_keys=[user_id])


class Section(Base):
    __tablename__ = "sections"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="sections", foreign_keys=[project_id])
    tasks = relationship("Task", back_populates="section", foreign_keys="Task.section_id", order_by="Task.position")


class UserTaskSection(Base):
    __tablename__ = "user_task_sections"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id])


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("priority IN ('high', 'medium', 'low')", name="ck_tasks_priority"),
        CheckConstraint("task_type IN ('task', 'milestone', 'approval')", name="ck_tasks_task_type"),
    )
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    assignee_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    due_date = Column(Date)
    start_date = Column(Date)
    completed = Column(Boolean, default=False)
    completed_at = Column(TIMESTAMP(timezone=True))
    completed_by = Column(String, ForeignKey("users.id"))
    parent_task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"))
    section_id = Column(String, ForeignKey("sections.id", ondelete="SET NULL"))
    project_id = Column(String, ForeignKey("projects.id", ondelete="SET NULL"))
    user_task_section_id = Column(String, ForeignKey("user_task_sections.id", ondelete="SET NULL"))
    position = Column(Integer, nullable=False, default=0)
    priority = Column(String)
    task_type = Column(String, default="task")
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    assignee = relationship("User", foreign_keys=[assignee_id])
    project = relationship("Project", back_populates="tasks", foreign_keys=[project_id])
    section = relationship("Section", back_populates="tasks", foreign_keys=[section_id])
    parent_task = relationship("Task", remote_side="Task.id", foreign_keys=[parent_task_id])
    subtasks = relationship("Task", foreign_keys=[parent_task_id], order_by="Task.position")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan", order_by="Comment.created_at")
    tag_links = relationship("TaskTag", back_populates="task", cascade="all, delete-orphan")
    follower_links = relationship("TaskFollower", back_populates="task", cascade="all, delete-orphan")
    dependencies = relationship("TaskDependency", foreign_keys="TaskDependency.task_id", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
    user_task_section = relationship("UserTaskSection", foreign_keys=[user_task_section_id])


class TaskProject(Base):
    __tablename__ = "task_projects"
    __table_args__ = (PrimaryKeyConstraint("task_id", "project_id"),)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(String, ForeignKey("sections.id"))
    position = Column(Integer, default=0)

    task = relationship("Task", foreign_keys=[task_id])
    project = relationship("Project", foreign_keys=[project_id])


class TaskFollower(Base):
    __tablename__ = "task_followers"
    __table_args__ = (PrimaryKeyConstraint("task_id", "user_id"),)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="follower_links", foreign_keys=[task_id])
    user = relationship("User", foreign_keys=[user_id])


class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    __table_args__ = (
        CheckConstraint("dependency_type IN ('blocking', 'blocked_by')", name="ck_task_deps_type"),
        CheckConstraint("task_id != depends_on_task_id"),
        PrimaryKeyConstraint("task_id", "depends_on_task_id"),
    )
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    depends_on_task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    dependency_type = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    task = relationship("Task", foreign_keys=[task_id])
    depends_on_task = relationship("Task", foreign_keys=[depends_on_task_id])


class Comment(Base):
    __tablename__ = "comments"
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    edited_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    task = relationship("Task", back_populates="comments", foreign_keys=[task_id])
    author = relationship("User", foreign_keys=[author_id])
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")


class CommentLike(Base):
    __tablename__ = "comment_likes"
    __table_args__ = (PrimaryKeyConstraint("comment_id", "user_id"),)
    comment_id = Column(String, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    comment = relationship("Comment", back_populates="likes", foreign_keys=[comment_id])
    user = relationship("User", foreign_keys=[user_id])


class Mention(Base):
    __tablename__ = "mentions"
    id = Column(String, primary_key=True)
    comment_id = Column(String, ForeignKey("comments.id", ondelete="CASCADE"))
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"))
    mentioned_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    comment = relationship("Comment", foreign_keys=[comment_id])
    mentioned_user = relationship("User", foreign_keys=[mentioned_user_id])


class ActivityLog(Base):
    __tablename__ = "activity_log"
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    field_changed = Column(String)
    old_value = Column(Text)
    new_value = Column(Text)
    extra_data = Column("metadata", JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])


class Tag(Base):
    __tablename__ = "tags"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    task_links = relationship("TaskTag", back_populates="tag", cascade="all, delete-orphan")


class TaskTag(Base):
    __tablename__ = "task_tags"
    __table_args__ = (PrimaryKeyConstraint("task_id", "tag_id"),)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(String, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="tag_links", foreign_keys=[task_id])
    tag = relationship("Tag", back_populates="task_links", foreign_keys=[tag_id])


class CustomField(Base):
    __tablename__ = "custom_fields"
    __table_args__ = (
        CheckConstraint(
            "field_type IN ('dropdown', 'multi_select', 'text', 'number', 'date', 'people', 'checkbox')",
            name="ck_custom_fields_type",
        ),
    )
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    field_type = Column(String, nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    options = relationship("CustomFieldOption", back_populates="custom_field", cascade="all, delete-orphan", order_by="CustomFieldOption.position")


class CustomFieldOption(Base):
    __tablename__ = "custom_field_options"
    id = Column(String, primary_key=True)
    custom_field_id = Column(String, ForeignKey("custom_fields.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String)
    position = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    custom_field = relationship("CustomField", back_populates="options", foreign_keys=[custom_field_id])


class ProjectCustomField(Base):
    __tablename__ = "project_custom_fields"
    __table_args__ = (PrimaryKeyConstraint("project_id", "custom_field_id"),)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    custom_field_id = Column(String, ForeignKey("custom_fields.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, default=0)

    project = relationship("Project", foreign_keys=[project_id])
    custom_field = relationship("CustomField", foreign_keys=[custom_field_id])


class TaskCustomFieldValue(Base):
    __tablename__ = "task_custom_field_values"
    __table_args__ = (PrimaryKeyConstraint("task_id", "custom_field_id"),)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    custom_field_id = Column(String, ForeignKey("custom_fields.id", ondelete="CASCADE"), nullable=False)
    string_value = Column(Text)
    number_value = Column(Numeric)
    date_value = Column(Date)
    option_id = Column(String, ForeignKey("custom_field_options.id", ondelete="SET NULL"))
    user_ids = Column(ARRAY(String))
    boolean_value = Column(Boolean)

    task = relationship("Task", foreign_keys=[task_id])
    custom_field = relationship("CustomField", foreign_keys=[custom_field_id])
    option = relationship("CustomFieldOption", foreign_keys=[option_id])


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "type IN ('task_assigned', 'comment_added', 'task_completed', 'mentioned', "
            "'due_date_approaching', 'project_update', 'follower_added')",
            name="ck_notifications_type",
        ),
    )
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    actor_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    body = Column(Text)
    read = Column(Boolean, default=False)
    archived = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    actor = relationship("User", foreign_keys=[actor_id])


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    __table_args__ = (PrimaryKeyConstraint("user_id", "notification_type"),)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    notification_type = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)


class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String)
    uploaded_by = Column(String, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="attachments", foreign_keys=[task_id])
    uploader = relationship("User", foreign_keys=[uploaded_by])


class SavedSearch(Base):
    __tablename__ = "saved_searches"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    filters_json = Column(JSONB, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"
    __table_args__ = (
        CheckConstraint(
            "widget_type IN ('my_tasks', 'projects', 'notepad', 'recent', 'people', 'forms')",
            name="ck_widgets_type",
        ),
    )
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    widget_type = Column(String, nullable=False)
    position = Column(Integer, default=0)
    config_json = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class ProjectStatusUpdate(Base):
    __tablename__ = "project_status_updates"
    __table_args__ = (
        CheckConstraint(
            "status IN ('on_track', 'at_risk', 'off_track')",
            name="ck_status_updates_status",
        ),
    )
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="status_updates", foreign_keys=[project_id])
    author = relationship("User", foreign_keys=[author_id])


# ============================================================
# Tier 2 Tables
# ============================================================

class Goal(Base):
    __tablename__ = "goals"
    __table_args__ = (
        CheckConstraint("status IN ('on_track', 'at_risk', 'off_track')", name="ck_goals_status"),
        CheckConstraint("progress >= 0 AND progress <= 100", name="ck_goals_progress"),
    )
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(String, ForeignKey("users.id"))
    team_id = Column(String, ForeignKey("teams.id"))
    time_period = Column(String)
    status = Column(String, default="on_track")
    progress = Column(Integer, default=0)
    parent_goal_id = Column(String, ForeignKey("goals.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", foreign_keys=[owner_id])
    team = relationship("Team", foreign_keys=[team_id])
    parent_goal = relationship("Goal", remote_side="Goal.id", foreign_keys=[parent_goal_id])
    sub_goals = relationship("Goal", foreign_keys=[parent_goal_id])


class Portfolio(Base):
    __tablename__ = "portfolios"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", foreign_keys=[owner_id])
    project_links = relationship("PortfolioProject", back_populates="portfolio", cascade="all, delete-orphan")


class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"
    __table_args__ = (PrimaryKeyConstraint("portfolio_id", "project_id"),)
    portfolio_id = Column(String, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, default=0)

    portfolio = relationship("Portfolio", back_populates="project_links", foreign_keys=[portfolio_id])
    project = relationship("Project", foreign_keys=[project_id])


class ProjectTemplate(Base):
    __tablename__ = "project_templates"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    icon = Column(String)
    template_data = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    project = relationship("Project", foreign_keys=[project_id])
    author = relationship("User", foreign_keys=[author_id])
    replies = relationship("MessageReply", back_populates="message", cascade="all, delete-orphan", order_by="MessageReply.created_at")


class MessageReply(Base):
    __tablename__ = "message_replies"
    id = Column(String, primary_key=True)
    message_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="replies", foreign_keys=[message_id])
    author = relationship("User", foreign_keys=[author_id])


class Form(Base):
    __tablename__ = "forms"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"))
    name = Column(String, nullable=False)
    description = Column(Text)
    fields_json = Column(JSONB)
    active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    project = relationship("Project", foreign_keys=[project_id])


class AuditLog(Base):
    __tablename__ = "audit_log"
    __table_args__ = (
        CheckConstraint("action IN ('INSERT', 'UPDATE', 'DELETE')", name="ck_audit_log_action"),
    )
    id = Column(String, primary_key=True)
    table_name = Column(String, nullable=False)
    record_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    old_data = Column(JSONB)
    new_data = Column(JSONB)
    user_id = Column(String)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
