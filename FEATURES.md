# Asana Clone — Feature Specification

## Tier 1: Full Implementation (15 features)
> Backend tools + CRUD UI + seed data + unit tests + Playwright tests + verifiers

### 1. My Tasks (Personal Task List)
- **Page type**: List with sections + view switcher (List | Board | Calendar | Dashboard | Files)
- **Description**: Personal task list grouped into sections: **Recently assigned, Do today, Do next week, Do later**. Users can drag tasks between sections. Shows task name, due date, project tag, priority. Header has "+ Add task" button (blue with dropdown arrow). Home page also has a My Tasks widget with Upcoming/Overdue/Completed tabs.
- **Key actions**: Create task, complete task, reorder tasks, move between sections, set due date inline, assign to project, switch views (List/Board/Calendar/Dashboard/Files)
- **Tools**: `create_task`, `update_task`, `complete_task`, `reorder_tasks`, `get_my_tasks`
- **DB tables**: `tasks`, `task_sections`, `task_assignees`, `task_projects`
- **Rich features**: Drag-and-drop reordering, inline editing, section collapse/expand, keyboard shortcuts (Tab+Enter to create, Cmd+Enter to complete), view switcher tabs

### 2. Projects (List View)
- **Page type**: Data table / list with view switcher (Overview | List | Board | Timeline | Dashboard | Calendar | Workflow | Messages | Files)
- **Description**: Project-level task list with collapsible sections (e.g., "To do", "Doing", "Done"). Columns show task name, assignee (avatar + name), due date range, and custom fields (Priority with colored badges like Low/Medium/High, Status with colored badges like On track/At risk/Off track). Section headers are editable. Column headers include a "+" button to add columns. Project header shows project icon, name, dropdown, star, "Set status" link, member avatars, Share button, Customize button.
- **Key actions**: Add task, add section, reorder tasks within/across sections, inline edit fields, bulk select, multi-sort
- **Tools**: `create_project`, `update_project`, `get_project_tasks`, `create_section`, `reorder_sections`
- **DB tables**: `projects`, `sections`, `tasks`, `project_members`
- **Rich features**: Multi-column sorting, column resize, bulk operations (assign, set due date, move, delete), Tab+Enter quick-add

### 3. Projects (Board View)
- **Page type**: Kanban board
- **Description**: Tasks displayed as cards in columns (sections: To do, Doing, Done, + Add section). Cards show: completion checkbox, task name, priority badge (colored: Low/Medium/High), status badge (colored: On track/At risk/Off track), assignee avatar, due date range. Column headers show section name + task count. "+ Add task" button at bottom of each column.
- **Key actions**: Drag card between columns, add card to column, edit card inline, add column
- **Tools**: `move_task_to_section`, `create_task_in_section`, `get_board_view`
- **DB tables**: same as List View + `board_columns` (maps to sections)
- **Rich features**: Drag-and-drop across columns, card preview on hover, "Add section" to create new column, colored priority/status badges on cards

### 4. Task Detail Pane
- **Page type**: Right-side slide-over detail panel (~50% width)
- **Description**: Right panel showing full task details. Top bar: "Mark complete" button, assignee avatars, Share button, link icon, fullscreen icon, "..." menu, close X. Large editable task title. Fields: Assignee (avatar + name + "Recently assigned" context), Due date (calendar icon + date range + clear X), Dependencies ("Add dependencies" link). Projects section: badge with count, project name with color dot, section dropdown (e.g., "To do"), custom fields per project (Priority with colored badge, Status with colored badge). Description area ("What is this task about?" placeholder). Subtasks section with "+" add button. Comment input at bottom with user avatar ("Add a comment"). "Send feedback" link in header.
- **Key actions**: Edit all fields, add subtask, add comment, attach file, add follower, mark complete, set dependencies, add to project
- **Tools**: `get_task_detail`, `update_task`, `add_subtask`, `add_comment`, `add_attachment`, `add_follower`, `set_dependency`
- **DB tables**: `tasks`, `subtasks`, `comments`, `attachments`, `task_followers`, `task_dependencies`, `task_custom_field_values`
- **Rich features**: Rich text editor for description, @mentions in comments, activity history timeline, file preview, subtask progress bar

### 5. Inbox / Notifications
- **Page type**: Feed / list with tabs (Activity | Bookmarks | Archive | @Mentioned)
- **Description**: Chronological feed of notifications grouped by date ("Today", etc.). Each notification shows: task title, sender avatar + name, timestamp, preview text. Has an "Inbox Summary" AI card at top offering to summarize notifications with configurable timeframe. Includes "Archive all notifications" link. Top toolbar has Filter, Sort (Newest), Density (Detailed) controls, and "Manage notifications" link. Tab bar: Activity | Bookmarks | Archive | @Mentioned | + (add tab).
- **Key actions**: Mark as read, archive notification, click to navigate, filter by type, bookmark, view @mentions
- **Tools**: `get_notifications`, `mark_notification_read`, `archive_notification`, `bookmark_notification`
- **DB tables**: `notifications`, `notification_preferences`, `notification_bookmarks`
- **Rich features**: Real-time updates, unread blue dot indicator, bulk archive, notification type filters, AI inbox summary

### 6. Home Dashboard
- **Page type**: Dashboard with widgets
- **Description**: Home page showing personalized greeting ("Good morning, [Name]") with current date. Stats bar: "My week" dropdown, tasks completed count, collaborators count, "Customize" button. Main widget: "My tasks" card with avatar, lock icon, and tabs (Upcoming | Overdue | Completed) showing task list with project tags and date ranges. Below: "Learn Asana" horizontal scrollable carousel with tutorial cards (thumbnail images, duration badges). Each widget card has a "..." menu.
- **Key actions**: Add/remove widgets, rearrange widgets, quick-add task, navigate to items, customize layout
- **Tools**: `get_dashboard_data`, `update_dashboard_layout`, `get_overdue_tasks`
- **DB tables**: `dashboard_widgets`, `user_dashboard_config`
- **Rich features**: Drag-and-drop widget layout, personalized greeting, weekly stats summary, tasks due carousel

### 7. Search & Filtering
- **Page type**: Search overlay + filtered results
- **Description**: Global search bar in topbar. Searches tasks, projects, people, tags. Advanced search with faceted filters: assignee, project, due date range, completion status, custom fields, tags. Saved searches ("Advanced Search" views).
- **Key actions**: Type-ahead search, apply filters, save search as report, clear filters
- **Tools**: `search_tasks`, `search_projects`, `save_search_view`, `get_recent_searches`
- **DB tables**: `saved_searches`, full-text index on tasks/projects
- **Rich features**: Type-ahead autocomplete, recent searches, filter chips, faceted filtering UI, saved search persistence

### 8. Comments & Activity Feed
- **Page type**: Embedded feed within task detail
- **Description**: Threaded comments on tasks with @mentions, likes, and edit history. Activity log shows field changes (e.g., "Jack changed due date from Mar 5 to Mar 10"). Rich text formatting in comments.
- **Key actions**: Add comment, edit comment, delete comment, @mention, like comment, view activity history
- **Tools**: `add_comment`, `edit_comment`, `delete_comment`, `get_activity_log`, `like_comment`
- **DB tables**: `comments`, `activity_log`, `mentions`, `comment_likes`
- **Rich features**: Rich text editor, @mention autocomplete, inline images, edit history, "liked by" display

### 9. Subtasks & Task Dependencies
- **Page type**: Nested list within task detail
- **Description**: Tasks can have subtasks (which are full tasks themselves, infinitely nestable). Dependencies: "blocked by" and "blocking" relationships shown visually. Subtask progress shown as fraction (3/5).
- **Key actions**: Add subtask, convert subtask to task, set dependency (blocking/blocked by), remove dependency, reorder subtasks
- **Tools**: `add_subtask`, `remove_subtask`, `set_dependency`, `remove_dependency`, `get_subtask_tree`
- **DB tables**: `tasks` (parent_task_id), `task_dependencies`
- **Rich features**: Nested subtask tree, dependency chain visualization, circular dependency detection, subtask completion progress

### 10. Custom Fields
- **Page type**: Configuration UI + inline display in list/board
- **Description**: Project-level custom fields: dropdown (single/multi-select with colors), text, number, date, people, checkbox. Fields appear as columns in list view and on board cards. Field values are editable inline.
- **Key actions**: Create field, edit field options, set field value on task, remove field from project
- **Tools**: `create_custom_field`, `update_custom_field`, `set_custom_field_value`, `get_project_custom_fields`
- **DB tables**: `custom_fields`, `custom_field_options`, `task_custom_field_values`, `project_custom_fields`
- **Rich features**: Colored dropdown options, multi-select, field type switching, field reuse across projects

### 11. Project Dashboard (Status & Charts)
- **Page type**: Dashboard with charts and widgets
- **Description**: Project-level dashboard (via Dashboard tab). Top row: 4 stat cards — "Total completed tasks", "Total incomplete tasks", "Total overdue tasks", "Total tasks" (large numbers with filter counts). Below: "Total incomplete tasks by section" (bar chart, colored by section), "Total tasks by completion status" (donut chart with center count), "Total upcoming tasks by assignee", "Task completion over time". Has "+ Add widget" button and "Send feedback" link. Each chart widget has filter count and "See all" link.
- **Key actions**: Add widgets, view charts, set project status (via Overview tab status buttons: On track / At risk / Off track), post status update
- **Tools**: `get_project_stats`, `set_project_status`, `post_status_update`, `get_completion_chart_data`
- **DB tables**: `project_status_updates`, `project_stats_cache`
- **Rich features**: Interactive charts (Chart.js or Recharts), stat cards with filters, donut/bar/line charts, configurable widgets

### 12. Teams & Members
- **Page type**: Settings / list
- **Description**: Team management: create teams, add/remove members, set roles (admin/member). Team page shows team's projects and members. Organization-level member directory.
- **Key actions**: Create team, invite member, remove member, change role, browse member list
- **Tools**: `create_team`, `add_team_member`, `remove_team_member`, `update_member_role`, `get_team_members`
- **DB tables**: `teams`, `team_members`, `users`, `organizations`
- **Rich features**: Role-based access (admin vs member), team avatar, member search, invite by email

### 13. Tags & Color Labels
- **Page type**: Chip/pill UI inline + management
- **Description**: Colored tags applied to tasks. Tags are searchable and filterable. Tag management UI for create/edit/delete. Tags shown as colored pills on task rows and cards.
- **Key actions**: Create tag, apply tag to task, remove tag, filter by tag, bulk-tag tasks
- **Tools**: `create_tag`, `add_tag_to_task`, `remove_tag_from_task`, `get_tags`, `filter_by_tag`
- **DB tables**: `tags`, `task_tags`
- **Rich features**: Color picker for tags, autocomplete when applying, bulk operations

### 14. Due Dates & Calendar View
- **Page type**: Calendar grid
- **Description**: Monthly/weekly calendar view showing tasks by due date. Tasks appear as colored bars/chips on calendar days. Drag to reschedule. Shows tasks across all projects or filtered to one.
- **Key actions**: View calendar, drag task to new date, click day to create task, switch month/week view, filter by project
- **Tools**: `get_calendar_tasks`, `update_task_due_date`, `create_task_on_date`
- **DB tables**: `tasks` (due_date, start_date)
- **Rich features**: Drag-to-reschedule, multi-day task bars, date range (start + due), overdue highlighting, today indicator

### 15. Bulk Operations
- **Page type**: Multi-select toolbar overlay
- **Description**: Select multiple tasks via checkboxes or Shift+click. Floating toolbar appears with bulk actions: assign, set due date, move to section, add tag, set custom field, delete, mark complete.
- **Key actions**: Multi-select tasks, bulk assign, bulk set due date, bulk move, bulk delete, bulk complete
- **Tools**: `bulk_update_tasks`, `bulk_move_tasks`, `bulk_delete_tasks`, `bulk_complete_tasks`
- **DB tables**: same as task tables (batch operations)
- **Rich features**: Shift+click range select, "Select all in section", floating action bar, undo bulk operations

---

## Tier 2: UI Stubs (10 features)
> Page renders with realistic seed data, navigation works, but mutations are limited or read-only

### 16. Timeline (Gantt Chart)
- **Page type**: Gantt-style timeline (via Timeline tab in project)
- **Description**: Horizontal timeline showing tasks as colored bars with start/end dates, grouped by section (To do, Doing, Done). Bars show assignee avatar + task name truncated. Week numbers and month headers along top (e.g., "W15 5-11", "W16 12-18"). Today marker as blue dot. Navigation: < Today > arrows, Weeks zoom control (+/-), Filter, Sort buttons. Tasks color-coded by section.
- **Stub scope**: Render timeline with seeded tasks, scroll horizontally, zoom in/out. No drag-to-resize or dependency editing.

### 17. Goals
- **Page type**: Hierarchical list with tabs (Strategy map | Team goals | My goals)
- **Description**: Goals page with tab navigation. Team goals view: data table with columns Name, Status, Progress (% bar), Time period, Accountable team, Owner. Has "+ Create goal" button, Filters badge, Sort, Group, Options toolbar. Strategy map tab shows visual goal hierarchy. My goals tab shows personal goals. Column headers have dropdown sort arrows.
- **Stub scope**: Render goals list with progress bars, expand to see sub-goals. No create/edit.

### 18. Portfolios
- **Page type**: Data table with tabs (Recent and starred | Browse all)
- **Description**: Portfolio list page with "Create portfolio" button. Shows portfolios in a table with columns: Name, Status (colored badges: On track/Off track), Budget ($), Task Progress (progress bar + %), Client (colored tags), Owner (avatar). Has a promotional preview section showing example portfolio table. Tab navigation: Recent and starred | Browse all.
- **Stub scope**: Render portfolio table with seeded projects, sort columns. No add/remove projects.

### 19. Workload (Resource Management)
- **Page type**: Horizontal bar chart per person
- **Description**: Shows each team member's task load over time. Bars colored by effort level (under/at/over capacity). Weekly view. Read-only.
- **Stub scope**: Render workload chart with seeded data. No task reassignment.

### 20. Reporting
- **Page type**: Dashboard with configurable charts
- **Description**: Build custom reports from task data: tasks by project, tasks by assignee, completion rates, overdue trends. Chart types: bar, line, donut.
- **Stub scope**: Render 3-4 preset charts with seeded data. No custom report builder.

### 21. Forms
- **Page type**: Form builder + submission view
- **Description**: Create intake forms linked to projects. Form submissions create tasks. Fields: text, dropdown, date, attachment, assignee.
- **Stub scope**: Render a sample form, show submission list. No form builder or real submissions.

### 22. Project Templates
- **Page type**: Template gallery + creation wizard
- **Description**: Pre-built project templates (e.g., "Product Launch", "Sprint Planning"). Template gallery with categories. Click to create project from template.
- **Stub scope**: Render template gallery with 6-8 cards. Click shows template preview. No actual project creation from template.

### 23. Messages (Project Conversations)
- **Page type**: Thread list (via Messages tab in project)
- **Description**: Project-level messaging. Shows "Send message to members" input at top. Empty state shows illustration and text encouraging team communication. Messages can also be sent via email to a project-specific address.
- **Stub scope**: Render message list with seeded threads, click to view thread. No compose or reply.

### 24. Project Overview
- **Page type**: Summary page (via Overview tab in project)
- **Description**: Project overview showing: AI summary card (with "Recent activity" and "Risk report" sections, each with Include/Exclude toggle, "Generate summary" button, "Get regular updates" toggle). Project description (rich text). "What's the status?" section in right sidebar with On track / At risk / Off track buttons and "..." menu. Activity timeline showing events (member joins, project created) with timestamps and avatars. Project roles section with "Add member" button showing owner with role label.
- **Stub scope**: Render overview with seeded status, description, roles, and activity feed. No AI summary generation.

### 25. Workflow Builder
- **Page type**: Visual workflow builder (via Workflow tab in project)
- **Description**: Automation builder showing "Start building your workflow in two minutes" intro. Left panel shows task intake options: manual add, Form submissions, Task templates, From other apps. Right panel shows per-section automation config: "When tasks move to this section, what should happen automatically?" with options like "Set assignee to", "Add collaborators", "+ More actions". Section cards show incomplete task counts.
- **Stub scope**: Render workflow builder UI with seeded sections. No actual automation execution.

---

## Database Schema Overview

### Core Tables
| Table | Key Columns |
|-------|-------------|
| `users` | id, name, email, avatar_url, role, created_at |
| `organizations` | id, name |
| `teams` | id, name, organization_id, description |
| `team_members` | team_id, user_id, role |
| `projects` | id, name, team_id, color, icon, status, owner_id, created_at, archived |
| `project_members` | project_id, user_id, role |
| `sections` | id, name, project_id, position |
| `tasks` | id, title, description, assignee_id, due_date, start_date, completed, completed_at, parent_task_id, section_id, project_id, position, created_by, created_at |
| `task_projects` | task_id, project_id (many-to-many) |
| `task_followers` | task_id, user_id |
| `task_dependencies` | task_id, depends_on_task_id, type (blocking/blocked_by) |
| `subtasks` | Maps to tasks with parent_task_id |
| `comments` | id, task_id, author_id, body, created_at, edited_at |
| `comment_likes` | comment_id, user_id |
| `activity_log` | id, task_id, user_id, action, field_changed, old_value, new_value, created_at |
| `tags` | id, name, color, organization_id |
| `task_tags` | task_id, tag_id |
| `custom_fields` | id, name, type (dropdown/text/number/date/people/checkbox), project_id |
| `custom_field_options` | id, custom_field_id, name, color, position |
| `task_custom_field_values` | task_id, custom_field_id, value, option_id |
| `notifications` | id, user_id, type, task_id, project_id, actor_id, read, archived, created_at |
| `attachments` | id, task_id, filename, url, uploaded_by, created_at |
| `saved_searches` | id, user_id, name, filters_json |
| `dashboard_widgets` | id, user_id, type, position, config_json |
| `project_status_updates` | id, project_id, author_id, status, text, created_at |
| `goals` | id, name, owner_id, team_id, time_period, status, progress, parent_goal_id |
| `portfolios` | id, name, owner_id |
| `portfolio_projects` | portfolio_id, project_id |

## Seed Data Plan
- 1 organization, 3 teams (Engineering, Design, Marketing)
- 8 users with realistic names and avatars
- 6 projects across teams with 3-5 sections each
- 80-100 tasks with varied states (complete, overdue, upcoming, unassigned)
- 20+ subtasks across various parent tasks
- 10+ task dependencies
- 5 custom fields (Status dropdown, Priority dropdown, Effort number, Due date, Reviewer people)
- 15+ tags with colors
- 50+ comments with @mentions and activity entries
- 30+ notifications in various states
- 3 goals with sub-goals
- 2 portfolios
- 3 saved searches
