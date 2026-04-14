from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


# ============================================================
# Module 1: Users & Auth (4 tools)
# ============================================================

class GetCurrentUserArgs(BaseModel):
    pass


class GetUsersArgs(BaseModel):
    organization_id: Optional[str] = None
    search: Optional[str] = None
    role: Optional[str] = None
    limit: int = 50
    offset: int = 0


class GetUserProfileArgs(BaseModel):
    user_id: str


class UpdateUserProfileArgs(BaseModel):
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None


# ============================================================
# Module 2: Tasks (9 tools)
# ============================================================

class CreateTaskArgs(BaseModel):
    title: str
    assignee_id: Optional[str] = None
    project_id: Optional[str] = None
    section_id: Optional[str] = None
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    parent_task_id: Optional[str] = None
    tags: Optional[list[str]] = None


class GetTaskArgs(BaseModel):
    task_id: str


class GetTaskDetailArgs(BaseModel):
    task_id: str


class UpdateTaskArgs(BaseModel):
    task_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None
    section_id: Optional[str] = None
    project_id: Optional[str] = None
    user_task_section_id: Optional[str] = None


class DeleteTaskArgs(BaseModel):
    task_id: str


class CompleteTaskArgs(BaseModel):
    task_id: str
    completed: bool


class GetMyTasksArgs(BaseModel):
    user_id: Optional[str] = None
    group_by: Optional[str] = "section"
    include_completed: bool = False


class ReorderTasksArgs(BaseModel):
    task_ids: list[str]
    section_id: Optional[str] = None


class DuplicateTaskArgs(BaseModel):
    task_id: str
    include_subtasks: bool = True


# ============================================================
# Module 3: Projects (7 tools)
# ============================================================

class CreateProjectArgs(BaseModel):
    name: str
    team_id: Optional[str] = None
    owner_id: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    default_view: Optional[str] = None
    description: Optional[str] = None
    enabled_views: Optional[list[str]] = None


class GetProjectArgs(BaseModel):
    project_id: str


class UpdateProjectArgs(BaseModel):
    project_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[str] = None
    archived: Optional[bool] = None
    default_view: Optional[str] = None
    enabled_views: Optional[list[str]] = None


class DeleteProjectArgs(BaseModel):
    project_id: str


class GetProjectListArgs(BaseModel):
    team_id: Optional[str] = None
    owner_id: Optional[str] = None
    archived: Optional[bool] = None
    limit: int = 50
    offset: int = 0


class GetProjectTasksArgs(BaseModel):
    project_id: str
    section_id: Optional[str] = None
    assignee_id: Optional[str] = None
    completed: Optional[bool] = None
    limit: int = 100
    offset: int = 0


class GetBoardViewArgs(BaseModel):
    project_id: str


# ============================================================
# Module 4: Project Members (3 tools)
# ============================================================

class AddProjectMemberArgs(BaseModel):
    project_id: str
    user_id: str
    role: str = "editor"


class RemoveProjectMemberArgs(BaseModel):
    project_id: str
    user_id: str


class GetProjectMembersArgs(BaseModel):
    project_id: str


# ============================================================
# Module 5: Sections (5 tools)
# ============================================================

class CreateSectionArgs(BaseModel):
    name: str
    project_id: str
    position: Optional[int] = None


class UpdateSectionArgs(BaseModel):
    section_id: str
    name: str


class DeleteSectionArgs(BaseModel):
    section_id: str


class ReorderSectionsArgs(BaseModel):
    section_ids: list[str]
    project_id: str


class MoveTaskToSectionArgs(BaseModel):
    task_id: str
    section_id: str
    position: Optional[int] = None


# ============================================================
# Module 6: Subtasks & Dependencies (6 tools)
# ============================================================

class AddSubtaskArgs(BaseModel):
    parent_task_id: str
    title: str
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None


class RemoveSubtaskArgs(BaseModel):
    task_id: str


class GetSubtaskTreeArgs(BaseModel):
    task_id: str


class ConvertSubtaskToTaskArgs(BaseModel):
    task_id: str
    project_id: Optional[str] = None
    section_id: Optional[str] = None


class SetDependencyArgs(BaseModel):
    task_id: str
    depends_on_task_id: str
    dependency_type: str


class RemoveDependencyArgs(BaseModel):
    task_id: str
    depends_on_task_id: str


# ============================================================
# Module 7: Comments & Activity (5 tools)
# ============================================================

class AddCommentArgs(BaseModel):
    task_id: str
    body: str
    author_id: Optional[str] = None


class EditCommentArgs(BaseModel):
    comment_id: str
    body: str


class DeleteCommentArgs(BaseModel):
    comment_id: str


class LikeCommentArgs(BaseModel):
    comment_id: str
    user_id: Optional[str] = None


class GetActivityLogArgs(BaseModel):
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    limit: int = 50
    offset: int = 0


# ============================================================
# Module 8: Custom Fields (4 tools)
# ============================================================

class CreateCustomFieldArgs(BaseModel):
    name: str
    field_type: str
    project_id: Optional[str] = None
    options: Optional[list[dict]] = None


class UpdateCustomFieldArgs(BaseModel):
    field_id: str
    name: Optional[str] = None
    add_options: Optional[list[dict]] = None
    remove_option_ids: Optional[list[str]] = None


class SetCustomFieldValueArgs(BaseModel):
    task_id: str
    field_id: str
    value: Optional[Any] = None


class GetProjectCustomFieldsArgs(BaseModel):
    project_id: str


# ============================================================
# Module 9: Tags (5 tools)
# ============================================================

class CreateTagArgs(BaseModel):
    name: str
    color: str


class AddTagToTaskArgs(BaseModel):
    task_id: str
    tag_id: str


class RemoveTagFromTaskArgs(BaseModel):
    task_id: str
    tag_id: str


class GetTagsArgs(BaseModel):
    search: Optional[str] = None
    limit: int = 50


class FilterTasksByTagArgs(BaseModel):
    tag_id: str
    project_id: Optional[str] = None
    completed: Optional[bool] = None
    limit: int = 50
    offset: int = 0


# ============================================================
# Module 10: Notifications (5 tools)
# ============================================================

class GetNotificationsArgs(BaseModel):
    user_id: Optional[str] = None
    read: Optional[bool] = None
    archived: Optional[bool] = None
    type: Optional[str] = None
    limit: int = 50
    offset: int = 0


class MarkNotificationReadArgs(BaseModel):
    notification_id: str
    read: bool


class ArchiveNotificationArgs(BaseModel):
    notification_id: str


class BulkArchiveNotificationsArgs(BaseModel):
    notification_ids: list[str]


class BookmarkNotificationArgs(BaseModel):
    notification_id: str


class GetUnreadCountArgs(BaseModel):
    user_id: Optional[str] = None


# ============================================================
# Module 11: Search (4 tools)
# ============================================================

class SearchTasksArgs(BaseModel):
    query: str
    assignee_id: Optional[str] = None
    project_id: Optional[str] = None
    completed: Optional[bool] = None
    due_before: Optional[str] = None
    due_after: Optional[str] = None
    tags: Optional[list[str]] = None
    priority: Optional[str] = None
    limit: int = 25
    offset: int = 0


class SearchProjectsArgs(BaseModel):
    query: str
    team_id: Optional[str] = None
    archived: Optional[bool] = None
    limit: int = 25


class SearchAllArgs(BaseModel):
    query: str
    limit: int = 25


class SaveSearchViewArgs(BaseModel):
    name: str
    filters_json: dict


# ============================================================
# Module 12: Dashboard & Widgets (4 tools)
# ============================================================

class GetDashboardDataArgs(BaseModel):
    user_id: Optional[str] = None


class GetOverdueTasksArgs(BaseModel):
    user_id: Optional[str] = None
    project_id: Optional[str] = None
    limit: int = 50


class UpdateDashboardLayoutArgs(BaseModel):
    user_id: str
    widgets: list[dict]


class GetRecentItemsArgs(BaseModel):
    user_id: Optional[str] = None
    limit: int = 20


# ============================================================
# Module 13: Project Status & Charts (4 tools)
# ============================================================

class GetProjectStatsArgs(BaseModel):
    project_id: str


class SetProjectStatusArgs(BaseModel):
    project_id: str
    status: str


class PostStatusUpdateArgs(BaseModel):
    project_id: str
    status: str
    text: str


class GetCompletionChartDataArgs(BaseModel):
    project_id: str
    period: str = "month"


# ============================================================
# Module 14: Teams & Members (5 tools)
# ============================================================

class CreateTeamArgs(BaseModel):
    name: str
    description: Optional[str] = None
    organization_id: Optional[str] = None


class AddTeamMemberArgs(BaseModel):
    team_id: str
    user_id: str
    role: str = "member"


class RemoveTeamMemberArgs(BaseModel):
    team_id: str
    user_id: str


class UpdateTeamMemberRoleArgs(BaseModel):
    team_id: str
    user_id: str
    role: str


class GetTeamMembersArgs(BaseModel):
    team_id: str


# ============================================================
# Module 15: Followers & Attachments (5 tools)
# ============================================================

class AddFollowerArgs(BaseModel):
    task_id: str
    user_id: str


class RemoveFollowerArgs(BaseModel):
    task_id: str
    user_id: str


class AddAttachmentArgs(BaseModel):
    task_id: str
    filename: str
    url: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None


class GetAttachmentsArgs(BaseModel):
    task_id: str


class DeleteAttachmentArgs(BaseModel):
    attachment_id: str


# ============================================================
# Module 16: Bulk Operations (5 tools)
# ============================================================

class BulkUpdateTasksArgs(BaseModel):
    task_ids: list[str]
    updates: dict


class BulkMoveTasksArgs(BaseModel):
    task_ids: list[str]
    section_id: str
    position_start: Optional[int] = None


class BulkDeleteTasksArgs(BaseModel):
    task_ids: list[str]


class BulkCompleteTasksArgs(BaseModel):
    task_ids: list[str]
    completed: bool


class BulkAssignTasksArgs(BaseModel):
    task_ids: list[str]
    assignee_id: str


# ============================================================
# Module 17: Calendar & Dates (3 tools)
# ============================================================

class GetCalendarTasksArgs(BaseModel):
    start_date: str
    end_date: str
    project_id: Optional[str] = None
    assignee_id: Optional[str] = None


class CreateTaskOnDateArgs(BaseModel):
    title: str
    due_date: str
    project_id: Optional[str] = None
    assignee_id: Optional[str] = None


class UpdateTaskDatesArgs(BaseModel):
    task_id: str
    due_date: Optional[str] = None
    start_date: Optional[str] = None
