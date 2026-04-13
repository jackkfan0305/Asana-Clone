# Asana Desktop Clone — Detailed Implementation Spec

## Context

We're building an Asana desktop clone as a **Docker-packaged training environment for AI agents**. The clone must achieve 95% visual fidelity to Asana's dark-mode Electron app and support dual interaction: React UI (Playwright / Claude Computer Use) and HTTP tool server (`POST /step`). Steps 0 (design research) and 1 (feature research) are handled separately — this spec covers **Steps 2–8**: database schema, tool server, frontend, seed data, Docker, Electron, and tests.

### Three Consumers
1. **Agent via tool server** — calls `POST /step` with structured tool calls
2. **Agent via Playwright** — clicks through the React UI (or Electron window) in a browser
3. **Verifier** — queries Postgres directly to score agent performance

### Existing Assets
- `FEATURES.md` — 15 Tier 1 + 8 Tier 2 features with DB schema overview
- `app/frontend/design-refs/DESIGN_TOKENS.md` — full color/typography/layout spec from Asana dark mode

### Stack
- **Backend:** FastAPI + SQLAlchemy + Postgres
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Desktop:** Electron (wraps React app as native window)
- **Auth:** Fake user system with login page, roles, session management
- **Testing:** pytest + Playwright
- **Packaging:** Docker (3 images: app, postgres, seed) + Electron (.dmg / .exe / .AppImage)

---

## Step 2: Database Schema (`app/postgres/init.sql`)

### Conventions
- All PKs: `TEXT` with human-readable prefixes (`usr_001`, `tsk_042`, `prj_003`, `sec_001`)
- Every table gets: `id TEXT PRIMARY KEY`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Foreign keys: `ON DELETE CASCADE` for child/junction records, `ON DELETE SET NULL` for optional references
- `position INTEGER` on all orderable entities (tasks, sections, widgets, custom field options)
- Full-text search indexes on `tasks(title, description)` and `projects(name)`
- `audit_log` table for verifier traceability
- Use `owner_id` field on key entities (projects, goals, portfolios) for assignment-based tasks

### Table Definitions (34 tables)

#### 1. `organizations`
```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `users`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,        -- plain text for dev (e.g., 'admin', 'password')
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'standard', 'viewer')),
  organization_id TEXT REFERENCES organizations(id),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `sessions`
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,               -- session token (e.g., 'sess_abc123')
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `teams`
```sql
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `team_members`
```sql
CREATE TABLE team_members (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);
```

#### 6. `projects`
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  team_id TEXT REFERENCES teams(id),
  owner_id TEXT REFERENCES users(id),
  color TEXT,                         -- hex color for sidebar dot
  icon TEXT,                          -- emoji or icon name
  status TEXT CHECK (status IN ('on_track', 'at_risk', 'off_track', 'on_hold', 'complete')) DEFAULT 'on_track',
  default_view TEXT CHECK (default_view IN ('list', 'board', 'calendar', 'timeline', 'dashboard')) DEFAULT 'list',
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_fulltext ON projects USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));
CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);
```

#### 7. `project_members`
```sql
CREATE TABLE project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')) DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
```

#### 8. `sections`
```sql
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sections_project ON sections(project_id);
```

#### 9. `user_task_sections` (personal My Tasks sections)
```sql
-- Asana "My Tasks" has personal sections: Recently assigned, Do today, Do next week, Do later
-- These are per-user, distinct from project sections
CREATE TABLE user_task_sections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                 -- 'Recently assigned', 'Do today', 'Do next week', 'Do later'
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_task_sections_user ON user_task_sections(user_id);
```

#### 10. `tasks`
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,                   -- rich text (HTML or Markdown)
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT REFERENCES users(id),
  parent_task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,  -- subtask support (NULL = top-level)
  section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  user_task_section_id TEXT REFERENCES user_task_sections(id) ON DELETE SET NULL,  -- personal section
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),  -- NULL = no priority
  task_type TEXT DEFAULT 'task' CHECK (task_type IN ('task', 'milestone', 'approval')),
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_fulltext ON tasks USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_section ON tasks(section_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_user_section ON tasks(user_task_section_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
```

#### 11. `task_projects` (many-to-many: task can belong to multiple projects)
```sql
CREATE TABLE task_projects (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES sections(id),
  position INTEGER DEFAULT 0,
  PRIMARY KEY (task_id, project_id)
);
```

#### 12. `task_followers`
```sql
CREATE TABLE task_followers (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);
```

#### 13. `task_dependencies`
```sql
CREATE TABLE task_dependencies (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('blocking', 'blocked_by')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)  -- prevent self-dependency
);
```

#### 14. `comments`
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,                 -- rich text (HTML), @mentions stored as markup
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_task ON comments(task_id);
```

#### 15. `comment_likes`
```sql
CREATE TABLE comment_likes (
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);
```

#### 16. `mentions` (@mention tracking for notifications)
```sql
CREATE TABLE mentions (
  id TEXT PRIMARY KEY,
  comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  mentioned_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
```

#### 17. `activity_log`
```sql
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,               -- 'created', 'updated', 'completed', 'commented', 'assigned', 'unassigned', 'moved', 'tagged', 'dependency_added', 'dependency_removed'
  field_changed TEXT,                 -- 'due_date', 'assignee', 'status', 'title', 'description', 'section', 'priority'
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,                     -- extra context (e.g., comment_id, tag_name)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_task ON activity_log(task_id);
CREATE INDEX idx_activity_project ON activity_log(project_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);
```

#### 18. `tags`
```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,                -- hex color
  organization_id TEXT REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 19. `task_tags`
```sql
CREATE TABLE task_tags (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, tag_id)
);
```

#### 20. `custom_fields`
```sql
CREATE TABLE custom_fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('dropdown', 'multi_select', 'text', 'number', 'date', 'people', 'checkbox')),
  organization_id TEXT REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 21. `custom_field_options` (for dropdown/multi-select fields)
```sql
CREATE TABLE custom_field_options (
  id TEXT PRIMARY KEY,
  custom_field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,                         -- hex color for pill display
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cfo_field ON custom_field_options(custom_field_id);
```

#### 22. `project_custom_fields` (which fields are attached to which projects)
```sql
CREATE TABLE project_custom_fields (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  custom_field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (project_id, custom_field_id)
);
```

#### 23. `task_custom_field_values`
```sql
CREATE TABLE task_custom_field_values (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  custom_field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  string_value TEXT,                  -- for 'text' type
  number_value NUMERIC,              -- for 'number' type
  date_value DATE,                   -- for 'date' type
  option_id TEXT REFERENCES custom_field_options(id) ON DELETE SET NULL,  -- for 'dropdown' type
  user_ids TEXT[],                   -- for 'people' type (array of user IDs)
  boolean_value BOOLEAN,             -- for 'checkbox' type
  PRIMARY KEY (task_id, custom_field_id)
);
```

#### 24. `notifications`
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'comment_added', 'task_completed', 'mentioned', 'due_date_approaching', 'project_update', 'follower_added')),
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id),  -- who triggered the notification
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, archived);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

#### 25. `notification_preferences`
```sql
CREATE TABLE notification_preferences (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,    -- matches notification.type values
  enabled BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, notification_type)
);
```

#### 26. `attachments`
```sql
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER,                 -- bytes
  mime_type TEXT,
  uploaded_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_attachments_task ON attachments(task_id);
```

#### 27. `saved_searches`
```sql
CREATE TABLE saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters_json JSONB NOT NULL,       -- { assignee: [...], project: [...], due_date: {...}, completed: bool, tags: [...], priority: [...] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 28. `dashboard_widgets`
```sql
CREATE TABLE dashboard_widgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('my_tasks', 'projects', 'notepad', 'recent', 'people', 'forms')),
  position INTEGER DEFAULT 0,
  config_json JSONB,                 -- widget-specific config (e.g., notepad content, filter settings)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_widgets_user ON dashboard_widgets(user_id);
```

#### 29. `project_status_updates`
```sql
CREATE TABLE project_status_updates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  text TEXT NOT NULL,                -- rich text summary
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_status_updates_project ON project_status_updates(project_id);
```

#### 30-34: Tier 2 Tables (simpler, seeded read-only data)

```sql
-- Goals (Tier 2)
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT REFERENCES users(id),
  team_id TEXT REFERENCES teams(id),
  time_period TEXT,                   -- 'Q1 2026', 'Q2 2026', 'FY2026'
  status TEXT CHECK (status IN ('on_track', 'at_risk', 'off_track')) DEFAULT 'on_track',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  parent_goal_id TEXT REFERENCES goals(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolios (Tier 2)
CREATE TABLE portfolios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_projects (
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (portfolio_id, project_id)
);

-- Project templates (Tier 2)
CREATE TABLE project_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,                      -- 'engineering', 'marketing', 'design', 'operations', 'hr', 'general'
  icon TEXT,
  template_data JSONB,               -- { sections: [...], sample_tasks: [...] }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages / project conversations (Tier 2)
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_replies (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms (Tier 2)
CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  fields_json JSONB,                 -- [ { label, type, required, options } ]
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 35. `audit_log` (for verifiers)
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY DEFAULT 'aud_' || substr(md5(random()::text), 1, 8),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

**Total: 35 tables** (24 Tier 1 core + 6 Tier 2 stubs + audit_log + 4 junction tables)

---

## Step 3: Tool Server API (`app/server.py`)

### HTTP Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Returns `{"status": "healthy"}` |
| `GET` | `/tools` | Returns `{"tools": [...]}` with full tool registry and input schemas |
| `POST` | `/step` | Execute a tool: `{"action": {"tool_name": "...", "parameters": {...}}}` |
| `POST` | `/reset` | Truncate all tables (seed must be re-run after) |
| `GET` | `/snapshot` | Dump entire DB state as JSON (all tables) |
| `POST` | `/auth/login` | `{"username": "...", "password": "..."}` → `{"token": "sess_...", "user": {...}}` |
| `POST` | `/auth/logout` | Invalidate session token |
| `GET` | `/auth/me` | Return current user from session cookie/header |

### Frontend API Pattern

**Critical:** The React frontend calls the same `POST /step` endpoint for ALL data operations. There are no separate REST endpoints for the frontend. The API client wraps `/step`:

```typescript
// app/frontend/src/api/client.ts
async function callTool(toolName: string, parameters: Record<string, any>) {
  const res = await fetch('/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: { tool_name: toolName, parameters } }),
  });
  return res.json();
}

// Usage in hooks:
const tasks = await callTool('get_my_tasks', { user_id: currentUser.id });
const result = await callTool('create_task', { title: 'New task', project_id: 'prj_001' });
```

This ensures **every operation works via BOTH the UI and the API** (acceptance criterion #6).

### Response Format

Every `POST /step` returns:
```json
{
  "observation": {
    "is_error": false,
    "text": "Task created successfully",
    "structured_content": { "id": "tsk_101", "title": "New task", ... }
  },
  "reward": null,
  "done": false
}
```

Error response:
```json
{
  "observation": {
    "is_error": true,
    "text": "Task not found: tsk_999",
    "structured_content": null
  },
  "reward": null,
  "done": false
}
```

### Tool Definition Pattern
```python
# Each tool in the TOOLS list:
{
    "name": "create_task",
    "description": "Create a new task in a project.",
    "input_schema": CreateTaskArgs.model_json_schema(),
    "mutates_state": True,
}
```

### Tool Inventory (70 tools)

Organized into 17 modules. `*` = required parameter.

#### Module 1: Users & Auth (4 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 1 | `get_current_user` | - | *(none — reads from session)* |
| 2 | `get_users` | - | organization_id, search, role, limit, offset |
| 3 | `get_user_profile` | - | user_id* |
| 4 | `update_user_profile` | Yes | user_id*, name, email, avatar_url |

#### Module 2: Tasks (9 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 5 | `create_task` | Yes | title*, assignee_id, project_id, section_id, due_date, start_date, description, priority, parent_task_id, tags (list of tag_ids) |
| 6 | `get_task` | - | task_id* |
| 7 | `get_task_detail` | - | task_id* *(returns task + subtasks + comments + activity + custom fields + followers + dependencies + attachments)* |
| 8 | `update_task` | Yes | task_id*, title, description, assignee_id, due_date, start_date, priority, completed, section_id, project_id |
| 9 | `delete_task` | Yes | task_id* |
| 10 | `complete_task` | Yes | task_id*, completed* (bool) |
| 11 | `get_my_tasks` | - | user_id, group_by (section/due_date/priority/none), include_completed (bool, default false) |
| 12 | `reorder_tasks` | Yes | task_ids* (ordered list), section_id |
| 13 | `duplicate_task` | Yes | task_id*, include_subtasks (bool, default true) |

#### Module 3: Projects (7 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 14 | `create_project` | Yes | name*, team_id, owner_id, color, icon, default_view, description |
| 15 | `get_project` | - | project_id* |
| 16 | `update_project` | Yes | project_id*, name, description, color, icon, status, archived, default_view |
| 17 | `delete_project` | Yes | project_id* |
| 18 | `get_project_list` | - | team_id, owner_id, archived (bool), limit, offset |
| 19 | `get_project_tasks` | - | project_id*, section_id, assignee_id, completed (bool), limit, offset |
| 20 | `get_board_view` | - | project_id* *(returns sections with nested task cards, optimized for board rendering)* |

#### Module 4: Project Members (3 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 21 | `add_project_member` | Yes | project_id*, user_id*, role (owner/editor/commenter/viewer, default editor) |
| 22 | `remove_project_member` | Yes | project_id*, user_id* |
| 23 | `get_project_members` | - | project_id* |

#### Module 5: Sections (5 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 24 | `create_section` | Yes | name*, project_id*, position |
| 25 | `update_section` | Yes | section_id*, name |
| 26 | `delete_section` | Yes | section_id* |
| 27 | `reorder_sections` | Yes | section_ids* (ordered list), project_id* |
| 28 | `move_task_to_section` | Yes | task_id*, section_id*, position |

#### Module 6: Subtasks & Dependencies (6 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 29 | `add_subtask` | Yes | parent_task_id*, title*, assignee_id, due_date |
| 30 | `remove_subtask` | Yes | task_id* *(detaches from parent, becomes top-level task)* |
| 31 | `get_subtask_tree` | - | task_id* *(returns nested subtask hierarchy)* |
| 32 | `convert_subtask_to_task` | Yes | task_id*, project_id, section_id |
| 33 | `set_dependency` | Yes | task_id*, depends_on_task_id*, dependency_type* (blocking/blocked_by) |
| 34 | `remove_dependency` | Yes | task_id*, depends_on_task_id* |

#### Module 7: Comments & Activity (5 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 35 | `add_comment` | Yes | task_id*, body* (HTML, @mentions as `<span data-mention="usr_002">@Sarah Connor</span>`), author_id |
| 36 | `edit_comment` | Yes | comment_id*, body* |
| 37 | `delete_comment` | Yes | comment_id* |
| 38 | `like_comment` | Yes | comment_id*, user_id *(toggles: like if not liked, unlike if already liked)* |
| 39 | `get_activity_log` | - | task_id, project_id, user_id, limit (default 50), offset |

#### Module 8: Custom Fields (4 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 40 | `create_custom_field` | Yes | name*, field_type*, project_id, options (list of {name, color} for dropdown/multi_select) |
| 41 | `update_custom_field` | Yes | field_id*, name, add_options (list), remove_option_ids (list) |
| 42 | `set_custom_field_value` | Yes | task_id*, field_id*, value *(string for text, number for number, date string for date, option_id for dropdown, list of user_ids for people, bool for checkbox)* |
| 43 | `get_project_custom_fields` | - | project_id* |

#### Module 9: Tags (5 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 44 | `create_tag` | Yes | name*, color* |
| 45 | `add_tag_to_task` | Yes | task_id*, tag_id* |
| 46 | `remove_tag_from_task` | Yes | task_id*, tag_id* |
| 47 | `get_tags` | - | search, limit |
| 48 | `filter_tasks_by_tag` | - | tag_id*, project_id, completed (bool), limit, offset |

#### Module 10: Notifications (5 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 49 | `get_notifications` | - | user_id, read (bool), archived (bool), type, limit (default 50), offset |
| 50 | `mark_notification_read` | Yes | notification_id*, read* (bool) |
| 51 | `archive_notification` | Yes | notification_id* |
| 52 | `bulk_archive_notifications` | Yes | notification_ids* |
| 53 | `get_unread_count` | - | user_id |

#### Module 11: Search (4 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 54 | `search_tasks` | - | query*, assignee_id, project_id, completed (bool), due_before, due_after, tags (list), priority, limit (default 25), offset |
| 55 | `search_projects` | - | query*, team_id, archived (bool), limit |
| 56 | `search_all` | - | query*, limit *(searches tasks + projects + users, returns categorized results)* |
| 57 | `save_search_view` | Yes | name*, filters_json* |

#### Module 12: Dashboard & Widgets (4 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 58 | `get_dashboard_data` | - | user_id *(returns greeting, stats, widgets config, overdue count, tasks due today)* |
| 59 | `get_overdue_tasks` | - | user_id, project_id, limit |
| 60 | `update_dashboard_layout` | Yes | user_id*, widgets* (list of {widget_type, position, config_json}) |
| 61 | `get_recent_items` | - | user_id, limit *(recently viewed/modified tasks and projects)* |

#### Module 13: Project Status & Charts (4 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 62 | `get_project_stats` | - | project_id* *(returns task counts by status, by section, by assignee, completion rate)* |
| 63 | `set_project_status` | Yes | project_id*, status* (on_track/at_risk/off_track) |
| 64 | `post_status_update` | Yes | project_id*, status*, text* |
| 65 | `get_completion_chart_data` | - | project_id*, period (week/month/quarter, default month) |

#### Module 14: Teams & Members (5 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 66 | `create_team` | Yes | name*, description, organization_id |
| 67 | `add_team_member` | Yes | team_id*, user_id*, role (admin/member, default member) |
| 68 | `remove_team_member` | Yes | team_id*, user_id* |
| 69 | `update_team_member_role` | Yes | team_id*, user_id*, role* |
| 70 | `get_team_members` | - | team_id* |

#### Module 15: Followers & Attachments (5 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 71 | `add_follower` | Yes | task_id*, user_id* |
| 72 | `remove_follower` | Yes | task_id*, user_id* |
| 73 | `add_attachment` | Yes | task_id*, filename*, url*, mime_type, file_size |
| 74 | `get_attachments` | - | task_id* |
| 75 | `delete_attachment` | Yes | attachment_id* |

#### Module 16: Bulk Operations (5 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 76 | `bulk_update_tasks` | Yes | task_ids*, updates* ({assignee_id, due_date, priority, add_tags, remove_tags}) |
| 77 | `bulk_move_tasks` | Yes | task_ids*, section_id*, position_start |
| 78 | `bulk_delete_tasks` | Yes | task_ids* |
| 79 | `bulk_complete_tasks` | Yes | task_ids*, completed* (bool) |
| 80 | `bulk_assign_tasks` | Yes | task_ids*, assignee_id* |

#### Module 17: Calendar & Dates (3 tools)
| # | Tool | Mutates | Parameters |
|---|------|---------|------------|
| 81 | `get_calendar_tasks` | - | start_date*, end_date*, project_id, assignee_id |
| 82 | `create_task_on_date` | Yes | title*, due_date*, project_id, assignee_id |
| 83 | `update_task_dates` | Yes | task_id*, due_date, start_date |

**Total: 83 tools** (50 mutating, 33 read-only)

### Server Architecture

```
app/
├── server.py              # FastAPI app: /step dispatcher, /tools, /health, /reset, /snapshot, static file serving
├── models.py              # SQLAlchemy ORM models (mirrors init.sql exactly)
├── schema.py              # Pydantic input schemas (one Args class per tool)
├── db.py                  # Database connection, session factory, DATABASE_URL from env
├── auth.py                # Login/logout/session middleware, cookie-based session
├── audit.py               # log_audit() helper, writes to audit_log on every mutation
├── tools/                 # Tool handlers grouped by module
│   ├── __init__.py        # TOOLS registry list, tool dispatcher function
│   ├── users.py           # Tools 1-4
│   ├── tasks.py           # Tools 5-13
│   ├── projects.py        # Tools 14-20
│   ├── project_members.py # Tools 21-23
│   ├── sections.py        # Tools 24-28
│   ├── subtasks.py        # Tools 29-34
│   ├── comments.py        # Tools 35-39
│   ├── custom_fields.py   # Tools 40-43
│   ├── tags.py            # Tools 44-48
│   ├── notifications.py   # Tools 49-53
│   ├── search.py          # Tools 54-57
│   ├── dashboard.py       # Tools 58-61
│   ├── project_status.py  # Tools 62-65
│   ├── teams.py           # Tools 66-70
│   ├── followers.py       # Tools 71-75
│   ├── bulk.py            # Tools 76-80
│   └── calendar.py        # Tools 81-83
└── postgres/
    └── init.sql
```

### Audit Logging

Every mutating tool call writes to `audit_log` before committing:
```python
def log_audit(session, table_name: str, record_id: str, action: str, old_data: dict | None, new_data: dict | None, user_id: str | None):
    session.execute(insert(AuditLog).values(
        table_name=table_name,
        record_id=record_id,
        action=action,
        old_data=old_data,
        new_data=new_data,
        user_id=user_id,
    ))
```

### Auto-generated Side Effects

These happen automatically inside tool handlers:
- **`create_task`** → creates `activity_log` entry ("created"), creates `notification` for assignee (if assigned), adds creator as follower
- **`complete_task`** → sets `completed_at`, creates activity log, notifies followers
- **`add_comment`** → creates activity log, parses @mentions → creates `mentions` rows + `notifications` for mentioned users, notifies followers
- **`update_task`** (field change) → creates activity log with old/new values, notifies followers
- **`set_dependency`** → validates no circular dependency before inserting
- **`assign_task`** (via `update_task` with `assignee_id`) → creates notification for new assignee

---

## Step 4: React Frontend

### Existing Frontend Scaffold

**A frontend scaffold already exists at `app/frontend/asana-clone/`.** This is the base to build on — do NOT create a new frontend from scratch.

**What already exists:**
- Vite + React 19 + TypeScript + React Router v6 — fully wired with all routes
- Layout: `Shell.tsx`, `IconRail.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- Feature component stubs for ALL pages (home, inbox, my tasks, projects, board, calendar, teams, goals, portfolios, etc.)
- Common components: `Avatar.tsx`, `Badge.tsx`, `Checkbox.tsx`, `ProgressBar.tsx`
- TypeScript types for all entities (`types/index.ts`)
- Client-side seed data and local state stores (`data/seed.ts`, `data/store.ts`, `data/AppContext.tsx`)
- Design tokens CSS (`styles/tokens.css`, `styles/global.css`)
- Icons via `lucide-react`
- Built dist at `app/frontend/asana-clone/dist/`

**What needs to be added (install as dependencies):**
- **Tailwind CSS** (with CSS custom properties from DESIGN_TOKENS.md)
- **Zustand** for global state (replace current AppContext/store pattern when connecting to API)
- **TanStack Query v5** (React Query) for server state, caching, optimistic updates
- **Recharts** for charts (project dashboard, reporting stubs)
- **date-fns** for date formatting and relative time
- **@dnd-kit/core + @dnd-kit/sortable** for drag-and-drop (tasks, board cards, dashboard widgets)
- **Tiptap** for rich text editing (task descriptions, comments)

**Migration path:** The existing frontend uses local `useState` stores with in-memory seed data. When the backend is ready, replace `data/store.ts` calls with `callTool()` API calls via TanStack Query hooks. The component structure and routing stay the same.

### Tech Stack
- **Vite** + **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS** (with CSS custom properties from DESIGN_TOKENS.md)
- **React Router v6** (URL-based routing, nested routes) — already wired
- **Zustand** for global state (current user, sidebar selection, notification count)
- **TanStack Query v5** (React Query) for server state, caching, optimistic updates
- **Recharts** for charts (project dashboard, reporting stubs)
- **date-fns** for date formatting and relative time
- **@dnd-kit/core + @dnd-kit/sortable** for drag-and-drop (tasks, board cards, dashboard widgets)
- **Tiptap** for rich text editing (task descriptions, comments)
- **lucide-react** for icons — already installed

### Design Token Integration

`app/frontend/src/styles/design-tokens.css` — see full values in `DESIGN_TOKENS.md`:
```css
:root {
  /* Backgrounds (Dark Mode) */
  --bg-icon-rail: #1a1a1a;
  --bg-sidebar: #2a2b2d;
  --bg-sidebar-hover: #3a3b3d;
  --bg-sidebar-selected: #404142;
  --bg-topbar: #2e2f31;
  --bg-content: #1e1f21;
  --bg-card: #2a2b2d;
  --bg-row-hover: #333435;
  --bg-input: #353638;
  --bg-modal-overlay: rgba(0, 0, 0, 0.6);

  /* Brand / Action */
  --color-create: #e8534b;
  --color-create-hover: #d64840;
  --color-primary: #4573d2;
  --color-success: #5da283;
  --color-warning: #f1bd6c;
  --color-error: #e8384f;

  /* Text */
  --text-primary: #f1f1f1;
  --text-secondary: #a2a0a2;
  --text-placeholder: #6d6e6f;
  --text-sidebar: #c8c8c8;
  --text-sidebar-active: #ffffff;
  --text-link: #4573d2;

  /* Borders */
  --border-default: #3a3b3d;
  --border-divider: #353638;
  --border-input: #4a4b4d;
  --border-focus: #4573d2;

  /* Layout */
  --icon-rail-width: 56px;
  --sidebar-panel-width: 200px;
  --sidebar-total-width: 256px;
  --topbar-height: 48px;
  --content-padding-x: 24px;
  --content-padding-top: 16px;
  --row-height: 36px;
  --board-card-width: 260px;
  --board-column-width: 280px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

  /* Radius */
  --radius-button: 6px;
  --radius-card: 8px;
  --radius-input: 6px;
  --radius-pill: 12px;
  --radius-modal: 12px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-dropdown: 0 4px 12px rgba(0,0,0,0.15);
  --shadow-modal: 0 8px 24px rgba(0,0,0,0.2);
}
```

### Route Map

```
/login                              → LoginPage
/                                   → HomePage (dashboard)
/home                               → HomePage (dashboard)
/inbox                              → InboxPage (notifications)
/my-tasks                           → MyTasksPage (list/board/calendar views via tabs)
/projects                           → ProjectListPage
/project/:projectId                 → ProjectViewPage (redirects to default_view)
/project/:projectId/overview        → ProjectOverviewPage
/project/:projectId/list            → ProjectListView
/project/:projectId/board           → ProjectBoardView
/project/:projectId/timeline        → ProjectTimelinePage (Tier 2 stub)
/project/:projectId/dashboard       → ProjectDashboardView
/project/:projectId/calendar        → ProjectCalendarView
/project/:projectId/workflow        → ProjectWorkflowPage (Tier 2 stub)
/project/:projectId/messages        → ProjectMessagesPage (Tier 2 stub)
/project/:projectId/files           → ProjectFilesPage (Tier 2 stub)
/task/:taskId                       → TaskDetailPage (full-page view)
/search                             → SearchPage
/search?q=...&assignee=...&...      → SearchPage (with query params)
/teams                              → TeamsPage
/team/:teamId                       → TeamDetailPage
/goals                              → GoalsPage (Tier 2 stub)
/portfolios                         → PortfoliosPage (Tier 2 stub)
/portfolio/:portfolioId             → PortfolioDetailPage (Tier 2 stub)
/reporting                          → ReportingPage (Tier 2 stub)
/workload                           → WorkloadPage (Tier 2 stub)
/templates                          → TemplatesPage (Tier 2 stub)
/forms                              → FormsPage (Tier 2 stub)
/settings                           → SettingsPage (Tier 2 stub)
```

**Total: 29 routes** (19 Tier 1 + 10 Tier 2 stubs). No route should 404.

### Component Architecture (Existing Structure)

The frontend scaffold already exists at `app/frontend/asana-clone/`. Below shows the current structure (✅ = exists) and what needs to be added/enhanced (🔧 = needs work):

```
app/frontend/asana-clone/src/
├── main.tsx                        ✅ Entry point
├── App.tsx                         ✅ Router setup + AppProvider (all routes wired)
├── styles/
│   ├── tokens.css                  ✅ Design tokens (needs alignment with DESIGN_TOKENS.md)
│   └── global.css                  ✅ Base styles (🔧 add Tailwind imports)
├── api/                            🔧 NEW — add when connecting to backend
│   ├── client.ts                   # callTool() wrapper for POST /step
│   └── auth.ts                     # login(), logout(), getCurrentUser()
├── types/
│   └── index.ts                    ✅ All entity interfaces (Task, Project, User, etc.)
├── data/
│   ├── AppContext.tsx               ✅ React context provider (🔧 migrate to Zustand + TanStack Query)
│   ├── seed.ts                     ✅ Client-side seed data
│   └── store.ts                    ✅ useState-based stores (🔧 migrate to callTool() hooks)
├── hooks/                          ✅ Directory exists (🔧 add TanStack Query hooks)
│   ├── useTasks.ts                 # useMyTasks, useTask, useCreateTask, useUpdateTask, useCompleteTask
│   ├── useProjects.ts              # useProject, useProjectList, useProjectTasks, useBoardView
│   ├── useSearch.ts                # useSearchTasks, useSearchAll
│   ├── useNotifications.ts         # useNotifications, useUnreadCount
│   ├── useComments.ts              # useAddComment, useEditComment, useDeleteComment
│   ├── useCustomFields.ts
│   ├── useTags.ts
│   ├── useDashboard.ts
│   └── useTeams.ts
├── components/
│   ├── common/
│   │   ├── Avatar.tsx              ✅ Circle avatar with fallback initials
│   │   ├── Badge.tsx               ✅ Notification count badge
│   │   ├── Checkbox.tsx            ✅ Circle checkbox
│   │   ├── ProgressBar.tsx         ✅ Progress bar
│   │   ├── Button.tsx              🔧 NEW — Primary (coral), secondary (blue), ghost variants
│   │   ├── DatePicker.tsx          🔧 NEW — Calendar dropdown, date range support
│   │   ├── Dropdown.tsx            🔧 NEW — Generic dropdown/select
│   │   ├── Modal.tsx               🔧 NEW — Centered modal with overlay
│   │   ├── Pill.tsx                🔧 NEW — Colored tag/status pill
│   │   ├── RichTextEditor.tsx      🔧 NEW — Tiptap wrapper with @mention support
│   │   ├── SearchInput.tsx         🔧 NEW — Search input with magnifier icon
│   │   ├── Spinner.tsx             🔧 NEW — Loading spinner
│   │   ├── EmptyState.tsx          🔧 NEW — Empty page placeholder
│   │   └── Tooltip.tsx             🔧 NEW — Hover tooltip
│   ├── layout/
│   │   ├── Shell.tsx               ✅ App shell (icon rail + sidebar + topbar + content)
│   │   ├── IconRail.tsx            ✅ Far-left 56px rail
│   │   ├── Sidebar.tsx             ✅ Context-dependent sidebar panel
│   │   └── Topbar.tsx              ✅ Search bar, create button, navigation
│   └── features/                   ✅ All feature directories exist with stub components
│       ├── home/HomePage.tsx       ✅ (🔧 enhance: greeting, stats, widgets)
│       ├── inbox/InboxPage.tsx     ✅ (🔧 enhance: grouped feed, mark read, archive)
│       ├── mytasks/MyTasksPage.tsx ✅ (🔧 enhance: sections, inline add, view switcher)
│       ├── projects/
│       │   ├── ProjectsListPage.tsx ✅ (🔧 enhance: project cards grid)
│       │   ├── ProjectListView.tsx  ✅ (🔧 enhance: sections, columns, inline edit)
│       │   └── ProjectBoardView.tsx ✅ (🔧 enhance: drag-and-drop cards)
│       ├── taskdetail/TaskDetailPane.tsx ✅ (🔧 enhance: all fields, comments, subtasks)
│       ├── search/SearchOverlay.tsx ✅ (🔧 enhance: type-ahead, faceted filters)
│       ├── calendar/CalendarPage.tsx ✅ (🔧 enhance: month/week grid, task chips)
│       ├── dashboard/ProjectDashboard.tsx ✅ (🔧 enhance: charts with Recharts)
│       ├── overview/ProjectOverview.tsx ✅ (🔧 enhance: status, description, activity)
│       ├── bulk/BulkToolbar.tsx     ✅ (🔧 enhance: multi-select, floating action bar)
│       ├── tags/TagsPage.tsx        ✅ (🔧 enhance: tag management UI)
│       ├── customfields/CustomFieldsPage.tsx ✅ (🔧 enhance: field config UI)
│       ├── teams/TeamsPage.tsx      ✅ (🔧 enhance: team management)
│       ├── comments/               ✅ Directory exists (🔧 add CommentFeed, CommentItem, etc.)
│       ├── subtasks/               ✅ Directory exists (🔧 add SubtaskList, DependencyList)
│       ├── timeline/TimelinePage.tsx ✅ Tier 2 stub
│       ├── goals/GoalsPage.tsx      ✅ Tier 2 stub
│       ├── portfolios/PortfoliosPage.tsx ✅ Tier 2 stub
│       ├── workload/WorkloadPage.tsx ✅ Tier 2 stub
│       ├── reporting/ReportingPage.tsx ✅ Tier 2 stub
│       ├── forms/FormsPage.tsx      ✅ Tier 2 stub
│       ├── templates/TemplatesPage.tsx ✅ Tier 2 stub
│       ├── messages/MessagesPage.tsx ✅ Tier 2 stub
│       └── workflow/WorkflowPage.tsx ✅ Tier 2 stub
├── assets/                         ✅ Static assets (hero.png, etc.)
└── utils/                          🔧 NEW
    ├── dates.ts                    # formatDate, formatRelativeTime, isOverdue
    ├── colors.ts                   # Status color map, priority color map, Asana palette
    └── testIds.ts                  # data-testid string constants
```

### Key Frontend Notes

- **Frontend root is `app/frontend/asana-clone/`** (not `app/frontend/`). All paths in Dockerfiles and Makefile must reference this.
- **Login page is missing** — needs to be added as a new route outside the Shell layout.
- **No `pages/` directory** — pages live inside `components/features/*/`. Keep this pattern.
- **Existing routes in App.tsx** cover all navigation — missing `/login`, `/search`, `/settings`, `/task/:taskId`, `/team/:teamId`.
- **Data layer migration:** Currently uses `data/store.ts` (React useState) + `data/seed.ts` (hardcoded). Must migrate to `api/client.ts` → `POST /step` with TanStack Query hooks. Keep `seed.ts` as fallback for offline/demo mode.

### Key UI Specifications

#### Login Page
- Dark background (`--bg-content: #1e1f21`)
- Centered card (`--bg-card: #2a2b2d`) with Asana-style logo placeholder
- Username + password fields (`--bg-input: #353638`, `--border-input: #4a4b4d`)
- "Log In" button (coral `--color-create: #e8534b`)
- Error message display below fields (red text)
- Dev-mode hint showing available test accounts

#### App Shell Layout (matching DESIGN_TOKENS.md exactly)
```
┌──────────────────────────────────────────────────────┐
│ [☰] [+ Create] [←][→] [🔍 Search...............] ⚙ │  ← Topbar (48px, bg: #2e2f31)
├────┬───────┬─────────────────────────────────────────┤
│    │       │                                          │
│ W  │ Home  │                                          │
│ o  │ Inbox │         Content Area                     │
│ r  │ ──────│         (bg: #1e1f21)                    │
│ k  │My     │                                          │
│    │tasks  │   Routes render here                     │
│ ───│ ──────│                                          │
│ S  │Proj A │                                          │
│ t  │Proj B │                                          │
│ r  │Proj C │                                          │
│ a  │       │                                          │
│ t  │       │                                          │
│ ───│       │                                          │
│ W  │       │                                          │
│ f  │       │                                          │
│ ───│ ──────│                                          │
│ P  │ Trial │                                          │
├────┴───────┴─────────────────────────────────────────┤
│ 56px  200px              remainder                    │
│(#1a1a)(#2a2b)                                         │
└──────────────────────────────────────────────────────┘
```

**Icon Rail (56px, `--bg-icon-rail: #1a1a1a`):**
- Work (checkmark) → Work sidebar panel
- Strategy (triangle) → Strategy sidebar panel
- Workflow (nodes) → Workflow sidebar panel
- People (people) → People sidebar panel

**Sidebar Panel (200px, `--bg-sidebar: #2a2b2d`):**
Context changes based on icon rail selection. Work panel shows:
- Home, Inbox, divider, My tasks, divider
- Projects, Portfolios, Goals, divider
- Expandable project list with color dots

**Sidebar Header:** Hamburger | "+ Create" button (coral pill) | back/forward arrows

**Sidebar Footer:** Trial badge, "Add billing info", user avatar + "Invite teammates"

**Topbar:** Search bar (centered, full-width) | Asana logo (right) | Help (?) | Settings gear

#### Project List View
- Section headers: bold text, collapse chevron ▸/▾, task count, "+" add task
- Columns: ☐ Checkbox | Task name | Assignee avatar | Due date range | Priority pill | Status pill | + (add column)
- Row height: 36px (`--row-height`), hover: `--bg-row-hover: #333435`
- Inline editing: click any cell to edit in place
- Bottom of section: "+ Add task" placeholder row (gray text)
- Bottom of page: "+ Add section"
- Column header row with resize handles and sort indicators

#### Board View
- Columns: one per section, 280px wide, 12px gap between
- Column header: section name + task count + "+" add card button
- Cards: 260px wide, white/dark card with: task title, assignee avatar, due date, subtask progress (3/5), tag pills
- Drag-and-drop between columns via @dnd-kit
- "+ Add task" at bottom of each column
- "+ Add section" as final column

#### Task Detail Pane (right slide-over)
- Width: ~50% of content area, slides in from right
- Header bar: "Mark complete" button (green outline circle + text) | share | link | fullscreen | "..." menu | X close
- Fields stacked vertically with clear labels:
  - **Title** (20px, font-weight 500, editable text field)
  - **Assignee** (avatar + name, dropdown to change, "Recently assigned" label)
  - **Due date** (calendar icon + date range, clear X, calendar picker dropdown)
  - **Projects** (count badge + project name with color dot + section dropdown "To do")
  - **Dependencies** ("Add dependencies" link → dropdown)
  - **Custom fields** (per-project: Priority pill, Status pill, etc. — editable inline)
  - **Description** ("What is this task about?" — Tiptap rich text editor)
  - **Subtasks** (nested list with ☐ + title + assignee, "+" button to add)
  - **Comments/Activity** (two tabs: "Comments" | "All activity")
  - **Comment input** (bottom: user avatar + "Add a comment" rich text input)

#### Home Dashboard
- **Greeting:** "Good morning, {name}" + today's date (left-aligned)
- **Stats bar:** "My week" dropdown, tasks completed count, collaborators count, "Customize" button
- **Widget grid:**
  - My Tasks widget: avatar + "My tasks" + lock icon, tabs (Upcoming | Overdue | Completed), task list, "+ Create task"
  - Projects widget: list of projects with color dots and status
  - Notepad widget: simple editable text
- Each widget is a card (`--bg-card`) with header, draggable to reorder

#### Inbox
- Grouped sections: "Today", "Yesterday", "Earlier this week", "Older"
- Each notification: actor avatar | action text ("Sarah Connor assigned you a task") | task link | relative timestamp
- Click navigates to relevant task
- Top bar: "Archive" button, "Mark all read", filter dropdown

### `data-testid` Convention

Every interactive element gets a `data-testid` for Playwright selectors:

```
-- Navigation --
data-testid="icon-rail-work"                → Work rail button
data-testid="icon-rail-strategy"            → Strategy rail button
data-testid="icon-rail-workflow"            → Workflow rail button
data-testid="icon-rail-people"              → People rail button
data-testid="sidebar-nav-home"              → Home nav item
data-testid="sidebar-nav-inbox"             → Inbox nav item
data-testid="sidebar-nav-my-tasks"          → My Tasks nav item
data-testid="sidebar-nav-projects"          → Projects nav item
data-testid="sidebar-nav-project-{id}"      → Individual project (e.g., sidebar-nav-project-prj_001)
data-testid="create-button"                 → "+ Create" button (coral pill)
data-testid="search-input"                  → Global search input

-- Task List --
data-testid="task-row-{taskId}"             → Task row in list view
data-testid="task-checkbox-{taskId}"        → Completion checkbox
data-testid="task-title-{taskId}"           → Task title text
data-testid="add-task-button"               → "+ Add task" button
data-testid="add-section-button"            → "+ Add section" button
data-testid="section-header-{sectionId}"    → Collapsible section header

-- Board --
data-testid="board-column-{sectionId}"      → Board column
data-testid="task-card-{taskId}"            → Board card

-- Task Detail --
data-testid="detail-pane"                   → Slide-over container
data-testid="detail-title"                  → Task title (editable)
data-testid="detail-assignee"               → Assignee selector
data-testid="detail-due-date"               → Due date picker
data-testid="detail-description"            → Description editor
data-testid="detail-mark-complete"          → "Mark complete" button
data-testid="detail-close"                  → Close X button
data-testid="comment-input"                 → Comment input box
data-testid="comment-{commentId}"           → Individual comment
data-testid="subtask-{taskId}"              → Subtask row

-- Project --
data-testid="project-tab-overview"          → Overview tab
data-testid="project-tab-list"              → List tab
data-testid="project-tab-board"             → Board tab
data-testid="project-tab-timeline"          → Timeline tab
data-testid="project-tab-dashboard"         → Dashboard tab
data-testid="project-tab-calendar"          → Calendar tab
data-testid="project-tab-workflow"          → Workflow tab
data-testid="project-tab-messages"          → Messages tab
data-testid="project-tab-files"             → Files tab

-- Bulk --
data-testid="bulk-action-bar"               → Floating bulk action toolbar
data-testid="bulk-assign"                   → Bulk assign button
data-testid="bulk-complete"                 → Bulk complete button
data-testid="bulk-delete"                   → Bulk delete button

-- Auth --
data-testid="login-username"                → Username input
data-testid="login-password"                → Password input
data-testid="login-submit"                  → Login button
data-testid="login-error"                   → Error message

-- Notifications --
data-testid="notification-{id}"             → Notification item
data-testid="notification-badge"            → Unread count badge
data-testid="inbox-archive-all"             → Archive all button

-- Page content wrapper --
data-testid="page-content"                  → Main content area (for no-404 checks)
```

---

## Step 5: Seed Data

### Seed Strategy
- **All data seeded via `POST /step` tool calls** — this validates that every tool works correctly
- **Deterministic:** fixed IDs, fixed names, dates relative to a base date (seed date = `2026-04-01`)
- **Idempotent:** seed script checks if data exists before creating (safe to rerun)
- **Order:** organization → users → teams → team_members → projects → project_members → sections → user_task_sections → tasks → subtasks → task_projects → dependencies → comments → tags → task_tags → custom_fields → custom_field_values → attachments → notifications → goals → portfolios → templates → messages → forms → dashboard_widgets

### Seeded Users (8)

| ID | Username | Password | Name | Role | Email | Team |
|----|----------|----------|------|------|-------|------|
| usr_001 | admin | admin | Admin User | admin | admin@acme.corp | — |
| usr_002 | sarah.connor | password | Sarah Connor | standard | sarah@acme.corp | Engineering |
| usr_003 | john.smith | password | John Smith | standard | john@acme.corp | Engineering |
| usr_004 | viewer | password | View Only | viewer | viewer@acme.corp | — |
| usr_005 | emily.chen | password | Emily Chen | standard | emily@acme.corp | Design |
| usr_006 | marcus.johnson | password | Marcus Johnson | standard | marcus@acme.corp | Marketing |
| usr_007 | alex.rivera | password | Alex Rivera | standard | alex@acme.corp | Engineering |
| usr_008 | priya.patel | password | Priya Patel | standard | priya@acme.corp | Design |

### Organization (1)
```json
{ "id": "org_001", "name": "Acme Corp" }
```

### Teams (3)
| ID | Name | Members |
|----|------|---------|
| team_001 | Engineering | sarah.connor (admin), john.smith, alex.rivera |
| team_002 | Design | emily.chen (admin), priya.patel |
| team_003 | Marketing | marcus.johnson (admin) |

### Projects (6)
| ID | Name | Team | Color | Status | Owner |
|----|------|------|-------|--------|-------|
| prj_001 | Website Redesign | Design | #4186e0 (blue) | on_track | emily.chen |
| prj_002 | API v2 Migration | Engineering | #62d26f (green) | at_risk | sarah.connor |
| prj_003 | Q2 Marketing Campaign | Marketing | #aa62e3 (purple) | on_track | marcus.johnson |
| prj_004 | Mobile App Launch | Engineering | #fd612c (orange) | on_track | john.smith |
| prj_005 | Design System | Design | #37c5ab (teal) | off_track | priya.patel |
| prj_006 | Sprint Planning | Engineering | #eec300 (yellow) | on_track | sarah.connor |

### Sections per Project (3-5 each, ~24 total)

| Project | Sections (in order) |
|---------|-------------------|
| prj_001 (Website Redesign) | To do, In progress, In review, Done |
| prj_002 (API v2 Migration) | Backlog, In progress, Testing, Deployed |
| prj_003 (Q2 Marketing) | Planning, Creating, Reviewing, Published |
| prj_004 (Mobile App) | To do, Doing, Done |
| prj_005 (Design System) | Components, Tokens, Documentation, Done |
| prj_006 (Sprint Planning) | Sprint 1, Sprint 2, Sprint 3, Icebox |

### User Task Sections (per user, 4 each = 32 total)
Every user gets: "Recently assigned", "Do today", "Do next week", "Do later"

### Tasks (100 total)
Distribution:
- **60** incomplete (various due dates, assignees, priorities, across all projects)
- **25** completed (with `completed_at` dates in the past)
- **15** overdue (past `due_date`, NOT completed — critical for testing overdue features)
- Spread across all 6 projects (15-20 per project)
- **10** unassigned tasks
- Priorities: 25 high, 40 medium, 20 low, 15 none
- **10** tasks with `start_date` + `due_date` ranges (for calendar/timeline)
- Mix of short and long descriptions (some with rich text: bold, lists, links)

### Subtasks (25)
- 5 parent tasks each with 3-7 subtasks
- Mix: some fully complete, some partially complete, some all incomplete
- At least one nested subtask (subtask of a subtask, 2 levels)

### Dependencies (12)
- 6 "blocking" and 6 "blocked_by" relationships
- At least one chain: Task A blocks Task B blocks Task C
- No circular dependencies

### Comments (60)
- 2-5 comments per task on ~15 tasks
- Include @mentions: `<span data-mention="usr_002">@Sarah Connor</span>`
- Mix of short ("Looks good!") and longer paragraph comments
- 10 comments with likes (from various users)
- At least 3 comments that have been edited (edited_at set)

### Tags (15)
| ID | Name | Color |
|----|------|-------|
| tag_001 | Bug | #e8384f (red) |
| tag_002 | Feature | #4186e0 (blue) |
| tag_003 | Urgent | #fd612c (orange) |
| tag_004 | Design | #aa62e3 (purple) |
| tag_005 | Backend | #62d26f (green) |
| tag_006 | Frontend | #37c5ab (aqua) |
| tag_007 | Documentation | #8da3a6 (gray) |
| tag_008 | Performance | #fd9a00 (yellow-orange) |
| tag_009 | Security | #e8384f (red) |
| tag_010 | UX | #7a6ff0 (indigo) |
| tag_011 | Research | #20aaea (aqua) |
| tag_012 | Testing | #a4cf30 (green) |
| tag_013 | Blocked | #e362e3 (pink) |
| tag_014 | Quick Win | #eec300 (yellow) |
| tag_015 | Tech Debt | #8da3a6 (gray) |

~50 task-tag assignments across the 100 tasks.

### Custom Fields (5, attached to all Tier 1 projects)
1. **Status** (dropdown): Not Started (#8da3a6), In Progress (#20aaea), In Review (#7a6ff0), Complete (#62d26f)
2. **Priority** (dropdown): Critical (#e8384f), High (#fd612c), Medium (#fd9a00), Low (#a4cf30)
3. **Effort** (number): values 1, 2, 3, 5, 8, 13 (story points)
4. **Reviewer** (people): assigned user IDs
5. **Approved** (checkbox): true/false

~80 task_custom_field_values across the 100 tasks.

### Attachments (10)
- Spread across 8 tasks
- Mix of file types: .pdf, .png, .sketch, .csv, .docx
- Dummy URLs (e.g., `/static/attachments/wireframe-v2.png`)

### Notifications (35)
| Type | Count | Read | Unread |
|------|-------|------|--------|
| task_assigned | 10 | 5 | 5 |
| comment_added | 8 | 4 | 4 |
| task_completed | 7 | 5 | 2 |
| mentioned | 5 | 2 | 3 |
| due_date_approaching | 3 | 1 | 2 |
| project_update | 2 | 1 | 1 |

Distributed across users (mostly sarah.connor and john.smith as primary test users).

### Tier 2 Seed Data
- **Goals** (5): 2 company-level ("Increase revenue 20%", "Improve NPS to 50+"), 3 team-level, 2 with sub-goals, varied progress (15%-85%)
- **Portfolios** (2): "Product" (prj_001, prj_002, prj_004), "Marketing & Design" (prj_003, prj_005)
- **Templates** (6): Sprint Planning, Product Launch, Bug Bash, Design Sprint, Marketing Campaign, Employee Onboarding
- **Messages** (4): 2 threads in prj_001, 2 in prj_002, each with 2-4 replies
- **Forms** (2): "Bug Report" form (fields: title, severity dropdown, steps to reproduce, expected behavior), "Feature Request" form (fields: title, priority, description, use case)
- **Dashboard widgets** (per user): My Tasks, Projects, Notepad (3 widgets each for 4 active users = 12 widgets)

### Record Count Summary
| Entity | Count |
|--------|-------|
| Organizations | 1 |
| Users | 8 |
| Teams | 3 |
| Team members | 6 |
| Projects | 6 |
| Project members | ~15 |
| Sections | ~24 |
| User task sections | 32 |
| Tasks | 100 |
| Subtasks | 25 |
| Task-project links | ~110 |
| Task dependencies | 12 |
| Comments | 60 |
| Comment likes | 10 |
| Mentions | ~15 |
| Tags | 15 |
| Task-tag links | ~50 |
| Custom fields | 5 |
| Custom field options | 12 |
| Task field values | ~80 |
| Attachments | 10 |
| Notifications | 35 |
| Goals | 5 |
| Portfolios | 2 |
| Portfolio-project links | 5 |
| Templates | 6 |
| Messages | 4 |
| Message replies | ~12 |
| Forms | 2 |
| Dashboard widgets | 12 |
| **TOTAL** | **~200** |

### Seed File Structure
```
app/seed_data/
├── organization.json
├── users.json              # includes passwords in plain text
├── teams.json
├── team_members.json
├── projects.json
├── project_members.json
├── sections.json
├── user_task_sections.json
├── tasks.json
├── subtasks.json
├── task_projects.json
├── dependencies.json
├── comments.json
├── tags.json
├── task_tags.json
├── custom_fields.json
├─��� custom_field_values.json
├── attachments.json
├── notifications.json
├── goals.json
├── portfolios.json
├── templates.json
├── messages.json
├── forms.json
└── dashboard_widgets.json
```

**`app/seed/seed_app.py`** reads each JSON file in order and calls `POST /step` with the appropriate tool for each record. Uses `shared/seed_runner.py` utilities: `wait_for_health()`, `call_tool()`, `verify_seed()`.

---

## Step 6: Docker Packaging

### docker-compose.dev.yml
```yaml
version: "3.8"
services:
  postgres:
    build:
      context: .
      dockerfile: dockerfiles/Dockerfile.postgres
    environment:
      POSTGRES_DB: asana_clone
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 2s
      timeout: 5s
      retries: 10

  app:
    build:
      context: .
      dockerfile: dockerfiles/Dockerfile.app
    ports:
      - "8030:8030"   # Tool server (FastAPI)
      - "3000:3000"   # Frontend (Vite preview or static serve)
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/asana_clone
      PORT: 8030
      FRONTEND_PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy

  seed:
    build:
      context: .
      dockerfile: dockerfiles/Dockerfile.seed
    environment:
      TOOL_SERVER_URL: http://app:8030
    depends_on:
      app:
        condition: service_started

volumes:
  pgdata:
```

**Note:** Seed is NOT gated behind a profile — it runs as a one-shot container that exits after seeding.

### Dockerfile.app (multi-stage)
```dockerfile
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend/asana-clone
COPY app/frontend/asana-clone/package*.json ./
RUN npm ci
COPY app/frontend/asana-clone/ ./
RUN npm run build

# Stage 2: Python backend + serve built frontend
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./
COPY --from=frontend-build /app/frontend/asana-clone/dist ./frontend/dist

# FastAPI serves both API on :8030 and static frontend files
EXPOSE 8030
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8030"]
```

**Note:** The frontend lives at `app/frontend/asana-clone/` (existing Vite + React scaffold). FastAPI serves the built frontend as static files from `frontend/dist/` and proxies all `/step`, `/tools`, `/health`, `/auth/*` API routes. Single port (8030) in production Docker mode. Vite dev server on :3000 only for local dev with hot reload.

### Dockerfile.postgres
```dockerfile
FROM postgres:16
COPY app/postgres/init.sql /docker-entrypoint-initdb.d/init.sql
```

### Dockerfile.seed
```dockerfile
FROM python:3.12-slim
WORKDIR /seed
COPY shared/ ./shared/
COPY app/seed/ ./
COPY app/seed_data/ ./seed_data/
RUN pip install requests
CMD ["python", "seed_app.py"]
```

### Makefile
```makefile
.PHONY: up down seed test dev-backend dev-frontend desktop-dev desktop validate lint

up:
	docker compose -f docker-compose.dev.yml up --build -d postgres app

down:
	docker compose -f docker-compose.dev.yml down

seed:
	docker compose -f docker-compose.dev.yml run --rm seed

test:
	pytest app/tests/ -v && cd app/frontend/asana-clone && npx playwright test

dev-backend:
	cd app && uvicorn server:app --reload --host 0.0.0.0 --port 8030

dev-frontend:
	cd app/frontend/asana-clone && npm run dev

desktop-dev:
	cd app/frontend/asana-clone && npm run electron:dev

desktop:
	cd app/frontend/asana-clone && npm run electron:build

validate:
	@echo "=== Checking repo structure ==="
	test -f FEATURES.md
	test -f app/postgres/init.sql
	test -f app/server.py
	test -f app/models.py
	test -f app/schema.py
	test -f app/seed/seed_app.py
	test -d app/frontend/asana-clone/src
	test -d app/tests
	@echo "=== Linting ==="
	ruff check app/ --select E,W,F
	cd app/frontend/asana-clone && npx tsc --noEmit
	cd app/frontend/asana-clone && npx eslint src/ --max-warnings 0
	@echo "=== Tests ==="
	pytest app/tests/ -v
	cd app/frontend/asana-clone && npx playwright test
	@echo "=== All checks passed ==="

lint:
	ruff check app/ && cd app/frontend/asana-clone && npx eslint src/
```

---

## Step 7: Electron Desktop App

### Setup
- **electron-builder** for packaging (.dmg for macOS, .exe for Windows, .AppImage for Linux)
- Electron main process loads `http://localhost:3000` in dev, bundled `dist/index.html` in production
- Playwright has native Electron support: `const app = await electron.launch({ args: ['electron/main.js'] })`

### File Structure
```
app/frontend/asana-clone/
├── electron/
│   ├── main.ts             # Electron main process
│   ├── preload.ts           # Context bridge (minimal)
│   └── electron-builder.yml # Build config for .dmg/.exe/.AppImage
├── package.json             # scripts: electron:dev, electron:build (add to existing)
```

### electron/main.ts
```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',    // macOS: native traffic lights, no title bar
    backgroundColor: '#1e1f21',       // match --bg-content, prevents white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Dev: load from Vite dev server; Prod: load built files
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
```

### electron-builder.yml
```yaml
appId: com.acme.asana-clone
productName: Asana Clone
directories:
  output: release
files:
  - dist/**/*
  - electron/**/*
mac:
  target: dmg
  icon: assets/icon.icns
win:
  target: nsis
  icon: assets/icon.ico
linux:
  target: AppImage
  icon: assets/icon.png
```

---

## Step 8: Tests

### Unit Tests (`app/tests/test_tools.py`)

Test every tool via `POST /step`. Use `shared/test_helpers.py` for `ToolServerClient` and assertion helpers.

#### Test Structure by Module

**System Endpoints (7 tests):**
```python
class TestSystemEndpoints:
    def test_health(self, client):              # GET /health → {status: healthy}
    def test_tools_list(self, client):          # GET /tools → 83 tools with valid schemas
    def test_tools_have_input_schema(self, client):  # Every tool has name, description, input_schema
    def test_reset(self, client):               # POST /reset clears all data
    def test_snapshot(self, client):            # GET /snapshot returns all table data
    def test_auth_login_valid(self, client):    # Login admin/admin → session token
    def test_auth_login_invalid(self, client):  # Login bad/pass → 401 error
```

**Task Tools (12 tests):**
```python
class TestTaskTools:
    def test_create_task_full(self, client):         # All fields, verify response
    def test_create_task_minimal(self, client):      # Title only
    def test_create_task_invalid_project(self, client):  # Error: bad project_id
    def test_get_task(self, client):                 # Fetch by ID, verify fields
    def test_get_task_not_found(self, client):       # Error: tsk_999
    def test_get_task_detail(self, client):          # Includes subtasks, comments, etc.
    def test_update_task_title(self, client):        # Partial update
    def test_update_task_assignee(self, client):     # Verify notification created
    def test_complete_task(self, client):             # completed_at set, activity logged
    def test_delete_task_cascades(self, client):     # Subtasks and comments deleted
    def test_reorder_tasks(self, client):            # 3 tasks, new positions
    def test_duplicate_task_with_subtasks(self, client):  # Deep copy
```

**Project Tools (8 tests):**
```python
class TestProjectTools:
    def test_create_project(self, client):
    def test_get_project(self, client):
    def test_update_project(self, client):
    def test_delete_project(self, client):
    def test_get_project_list_filtered(self, client):    # Filter by team
    def test_get_project_tasks_by_section(self, client): # Filter by section
    def test_get_board_view(self, client):               # Sections with nested tasks
    def test_archive_project(self, client):              # archived=true
```

**Section Tools (6 tests):**
```python
class TestSectionTools:
    def test_create_section(self, client):
    def test_update_section(self, client):
    def test_delete_section(self, client):
    def test_reorder_sections(self, client):
    def test_move_task_to_section(self, client):
    def test_move_task_position(self, client):     # Verify position after move
```

**Subtask & Dependency Tools (8 tests):**
```python
class TestSubtaskDependencyTools:
    def test_add_subtask(self, client):
    def test_remove_subtask_detaches(self, client):       # Becomes top-level
    def test_get_subtask_tree(self, client):               # Nested structure
    def test_convert_subtask_to_task(self, client):
    def test_set_dependency(self, client):
    def test_remove_dependency(self, client):
    def test_circular_dependency_error(self, client):      # A→B→A should error
    def test_self_dependency_error(self, client):           # A→A should error
```

**Comment Tools (7 tests):**
```python
class TestCommentTools:
    def test_add_comment(self, client):
    def test_add_comment_with_mention(self, client):       # Verify mention + notification
    def test_edit_comment(self, client):                    # edited_at set
    def test_delete_comment(self, client):
    def test_like_comment_toggle(self, client):             # Like, then unlike
    def test_get_activity_log(self, client):                # Returns field changes
    def test_activity_log_filtered(self, client):           # By task, by user
```

**Custom Field Tools (5 tests):**
```python
class TestCustomFieldTools:
    def test_create_dropdown_field(self, client):
    def test_set_dropdown_value(self, client):
    def test_set_number_value(self, client):
    def test_set_checkbox_value(self, client):
    def test_type_mismatch_error(self, client):             # Number value on text field
```

**Tag Tools (5 tests):**
```python
class TestTagTools:
    def test_create_tag(self, client):
    def test_add_tag_to_task(self, client):
    def test_remove_tag_from_task(self, client):
    def test_get_tags_search(self, client):                 # Fuzzy search
    def test_filter_tasks_by_tag(self, client):
```

**Notification Tools (5 tests):**
```python
class TestNotificationTools:
    def test_get_notifications(self, client):
    def test_mark_read(self, client):
    def test_archive(self, client):
    def test_bulk_archive(self, client):
    def test_unread_count(self, client):
```

**Search Tools (5 tests):**
```python
class TestSearchTools:
    def test_search_tasks_by_title(self, client):
    def test_search_tasks_with_filters(self, client):      # Assignee + priority
    def test_search_projects(self, client):
    def test_search_all(self, client):                      # Mixed results
    def test_save_search_view(self, client):
```

**Dashboard Tools (4 tests):**
```python
class TestDashboardTools:
    def test_get_dashboard_data(self, client):              # Verify structure
    def test_get_overdue_tasks(self, client):
    def test_update_dashboard_layout(self, client):
    def test_get_recent_items(self, client):
```

**Project Status Tools (4 tests):**
```python
class TestProjectStatusTools:
    def test_get_project_stats(self, client):               # Verify all chart data
    def test_set_project_status(self, client):
    def test_post_status_update(self, client):
    def test_get_completion_chart_data(self, client):
```

**Team Tools (5 tests):**
```python
class TestTeamTools:
    def test_create_team(self, client):
    def test_add_member(self, client):
    def test_remove_member(self, client):
    def test_update_member_role(self, client):
    def test_get_members(self, client):
```

**Follower & Attachment Tools (5 tests):**
```python
class TestFollowerAttachmentTools:
    def test_add_follower(self, client):
    def test_remove_follower(self, client):
    def test_add_attachment(self, client):
    def test_get_attachments(self, client):
    def test_delete_attachment(self, client):
```

**Bulk Operation Tools (5 tests):**
```python
class TestBulkTools:
    def test_bulk_complete(self, client):
    def test_bulk_assign(self, client):
    def test_bulk_move(self, client):
    def test_bulk_update_tags(self, client):
    def test_bulk_delete(self, client):
```

**Calendar Tools (3 tests):**
```python
class TestCalendarTools:
    def test_get_calendar_tasks(self, client):              # Date range filter
    def test_create_task_on_date(self, client):
    def test_update_task_dates(self, client):               # Start + due date
```

**Total: ~104 unit tests** across 16 test classes.

### Playwright E2E Tests (`app/tests/e2e/`)

```
app/tests/e2e/
├── conftest.py             # Playwright fixtures: browser, page, login helper, base URL, seed check
├── test_login.py           # Login/logout flow, role-based access, invalid credentials
├── test_home.py            # Dashboard renders, greeting text, widget content
├── test_inbox.py           # Notifications render, mark as read, archive
├── test_my_tasks.py        # Task list, add task, complete task, view switcher
├── test_project_list.py    # Sections, column headers, inline edit, add task
├── test_project_board.py   # Board columns render, cards show, drag simulation
├── test_task_detail.py     # Open pane, edit title, change assignee, add comment
├── test_search.py          # Global search, type-ahead, filter, results display
├── test_calendar.py        # Calendar grid renders, tasks on correct dates
├── test_bulk_ops.py        # Multi-select, bulk complete, bulk action bar
├── test_custom_fields.py   # Custom field pills in list view, edit in detail pane
├── test_navigation.py      # CRITICAL: every sidebar link + every project tab renders (no 404s, no blanks)
└── test_stubs.py           # All 8+ Tier 2 pages render with seed data content
```

#### Critical Flows

**Login:**
```python
async def test_login_as_standard_user(page):
    await page.goto("/login")
    await page.fill('[data-testid="login-username"]', 'sarah.connor')
    await page.fill('[data-testid="login-password"]', 'password')
    await page.click('[data-testid="login-submit"]')
    await expect(page.locator('[data-testid="sidebar-nav-home"]')).to_be_visible()
    # Verify greeting
    await expect(page.locator('text=Good')).to_be_visible()  # "Good morning/afternoon, Sarah"
```

**Task CRUD through UI:**
```python
async def test_create_and_complete_task(page, logged_in):
    await page.goto("/my-tasks")
    await page.click('[data-testid="add-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Playwright test task')
    await page.press('[data-testid="task-title-input"]', 'Enter')
    # Verify it appears
    row = page.locator('text=Playwright test task')
    await expect(row).to_be_visible()
    # Complete it
    checkbox = page.locator('[data-testid^="task-checkbox-"]').last
    await checkbox.click()
    # Verify completion visual
    await expect(checkbox).to_have_attribute('data-completed', 'true')
```

**No Dead Links (CRITICAL — prevents 404s for Playwright agents):**
```python
async def test_all_sidebar_navigation(page, logged_in):
    """Every sidebar nav item renders content — no 404s, no blank pages."""
    nav_items = [
        'sidebar-nav-home',
        'sidebar-nav-inbox',
        'sidebar-nav-my-tasks',
        'sidebar-nav-projects',
        # Add all seeded project nav items
    ]
    for item in nav_items:
        await page.click(f'[data-testid="{item}"]')
        content = page.locator('[data-testid="page-content"]')
        await expect(content).to_be_visible(timeout=5000)
        # Must not show 404 or error
        await expect(page.locator('text=404')).not_to_be_visible()
        await expect(page.locator('text=Not Found')).not_to_be_visible()

async def test_all_project_tabs(page, logged_in):
    """Every project tab renders — Overview through Files."""
    await page.goto("/project/prj_001/list")
    tabs = ['overview', 'list', 'board', 'timeline', 'dashboard', 'calendar', 'workflow', 'messages', 'files']
    for tab in tabs:
        await page.click(f'[data-testid="project-tab-{tab}"]')
        content = page.locator('[data-testid="page-content"]')
        await expect(content).to_be_visible(timeout=5000)
```

**Total: ~50-60 Playwright tests** across 14 test files.

---

## Acceptance Criteria Cross-Reference

| # | Criterion | How We Meet It |
|---|-----------|----------------|
| 1 | Working database, accessible via GUI + API | 35 Postgres tables, seeded via `POST /step`, React UI reads/writes via same `/step` endpoint |
| 2 | Authentication: login page, roles, sessions | `users` + `sessions` tables, 3 roles (admin/standard/viewer), cookie-based sessions, login page matching Asana |
| 3 | 10-15 rich Tier 1 features | 15 Tier 1: includes dashboards (home + project), charts (Recharts), bulk ops, custom fields, search with facets, calendar view — not just CRUD |
| 4 | 5-10 Tier 2 stubs | 8 Tier 2 stubs: Timeline, Goals, Portfolios, Workload, Reporting, Forms, Templates, Messages — all render with seed data |
| 5 | 95% visual fidelity | Design tokens extracted from real Asana dark mode, CSS variables match exactly, layout dimensions verified |
| 6 | Every operation via BOTH UI and API | Frontend uses `POST /step` for all operations — same endpoint agents use. No separate REST API. |
| 7 | Extensive unit tests | ~104 tests covering all 83 tools + edge cases + system endpoints |
| 8 | Playwright browser tests | ~55 tests: every Tier 1 CRUD flow, all navigation, all stubs render |
| 9 | 50-200 seeded records | ~200 deterministic records seeded via tool server API |

## Delivery Checklist

- [ ] `FEATURES.md` filled in with 23 features (15 Tier 1 + 8 Tier 2), tiered
- [ ] `design-tokens.css` has real values extracted from Asana dark mode
- [ ] Login page works: `admin`/`admin`, `sarah.connor`/`password`, `john.smith`/`password`, `viewer`/`password`
- [ ] All 83 Tier 1 tools implemented and working via both API (`POST /step`) and UI
- [ ] Tier 1 includes rich features: home dashboard, project dashboard with charts, calendar view, bulk ops, custom fields, search with facets
- [ ] Seed data creates ~200 realistic, deterministic records
- [ ] Frontend matches Asana dark mode at 95% visual fidelity
- [ ] All 8 Tier 2 stub pages render with seeded content (no 404s anywhere in navigation)
- [ ] `make desktop` builds the Electron .dmg/.exe
- [ ] Desktop app launches and renders the clone correctly
- [ ] `make test` passes (104 unit + 55 Playwright tests)
- [ ] `make validate` passes (structure + lint + types + tests)
- [ ] CI is green

---

## Build Order (Parallelized Implementation Waves)

Steps 0-1 (design research + feature research) are handled by a separate agent. Implementation begins at Step 2.

**Key principle:** Maximize parallel agents. Each "wave" contains tasks that can run simultaneously. A wave starts only after all its dependencies from prior waves are complete.

---

### Wave 1 — Foundation (3 parallel agents)
> No dependencies. All start immediately.
> **Note:** Frontend scaffold already exists at `app/frontend/asana-clone/` — no agent needed for it.

| Agent | Task | Files | Output |
|-------|------|-------|--------|
| **A** | Database schema | `app/postgres/init.sql` | All 35 CREATE TABLE statements |
| **B** | Seed data fixtures | `app/seed_data/*.json` (24 files) | All JSON seed files (~200 records) |
| **D** | Docker setup (Dockerfiles + compose + Makefile) | `docker-compose.dev.yml`, `dockerfiles/*`, `Makefile` | Dockerfile templates ready (will wire up later) |

---

### Wave 2 — Backend Core (3 parallel agents)
> Depends on: Wave 1A (init.sql)

| Agent | Task | Files | Output |
|-------|------|-------|--------|
| **E** | SQLAlchemy models + DB connection | `app/models.py`, `app/db.py` | All ORM models matching init.sql |
| **F** | Pydantic schemas (all 83 tools) | `app/schema.py` | All Args classes for tool input validation |
| **G** | Auth module | `app/auth.py` | Login/logout/session middleware, cookie handling |

---

### Wave 3 — Server + Tool Handlers (5 parallel agents)
> Depends on: Wave 2E (models), 2F (schemas), 2G (auth)

| Agent | Task | Files | Output |
|-------|------|-------|--------|
| **H** | FastAPI skeleton + dispatcher + tool registry | `app/server.py`, `app/tools/__init__.py`, `app/audit.py` | `/step`, `/tools`, `/health`, `/reset`, `/snapshot`, `/auth/*` endpoints |
| **I** | Tool handlers: Tasks + Subtasks + Dependencies (Modules 2, 6) | `app/tools/tasks.py`, `app/tools/subtasks.py` | Tools 5-13, 29-34 (15 tools) |
| **J** | Tool handlers: Projects + Sections + Members + Status (Modules 3, 4, 5, 13) | `app/tools/projects.py`, `sections.py`, `project_members.py`, `project_status.py` | Tools 14-28, 62-65 (19 tools) |
| **K** | Tool handlers: Comments + Custom Fields + Tags + Followers + Attachments (Modules 7, 8, 9, 15) | `app/tools/comments.py`, `custom_fields.py`, `tags.py`, `followers.py` | Tools 35-48, 71-75 (19 tools) |
| **L** | Tool handlers: Notifications + Search + Dashboard + Teams + Bulk + Calendar (Modules 10-12, 14, 16-17) | `app/tools/notifications.py`, `search.py`, `dashboard.py`, `teams.py`, `bulk.py`, `calendar.py` | Tools 49-61, 66-70, 76-83 (30 tools) |

**Note:** Agents I-L depend on the server skeleton (H) for the tool registration pattern and dispatcher, BUT they can start writing tool handler functions in parallel with H since they follow a known pattern. Each agent imports from `models.py` and `schema.py` (Wave 2) and registers tools in the standard format. Agent H creates the `__init__.py` that imports from all modules.

---

### Wave 4 — Integration + Frontend API Layer + Login (3 parallel agents)
> Depends on: Wave 3 (all tools registered), Wave 1B (seed data)
> **Note:** Frontend scaffold already exists — agents enhance existing files, not create from scratch.

| Agent | Task | Files | Output |
|-------|------|-------|--------|
| **M** | Seed script + Docker wiring + `make up && make seed` verification | `app/seed/seed_app.py`, finalize `docker-compose.dev.yml` and Dockerfiles | Working `make up && make seed` that populates all 200 records |
| **N** | Frontend API layer: `callTool()` client + TanStack Query hooks + Zustand stores + install deps (Tailwind, Zustand, TanStack Query, date-fns) | `api/client.ts`, `api/auth.ts`, `hooks/*.ts`, install npm deps, update `App.tsx` to wrap with QueryClientProvider | Frontend wired to backend via `POST /step`, all hooks ready for pages |
| **O** | Login page + auth flow (new route + AuthLayout outside Shell) | `LoginPage.tsx`, Zustand `authStore.ts`, add `/login` route to `App.tsx` | Working login/logout, session persistence, redirect to home |

**Note:** N and O both enhance the existing frontend at `app/frontend/asana-clone/`. O depends on the auth API (Wave 2G/3H) being available. N installs missing npm dependencies and creates the API layer that all Wave 5 pages will use.

---

### Wave 5 — Frontend Pages: Tier 1 (7 parallel agents)
> Depends on: Wave 4N (app shell with routing), Wave 4O (auth flow), Wave 4M (seed data available via API)

| Agent | Task | Files | Output |
|-------|------|-------|--------|
| **P** | Home Dashboard | `HomePage.tsx`, `GreetingHeader.tsx`, `MyTasksWidget.tsx`, `ProjectsWidget.tsx`, `NotepadWidget.tsx`, `DashboardGrid.tsx`, `hooks/useDashboard.ts` | Home page with greeting, stats, widgets |
| **Q** | My Tasks page + Task list components | `MyTasksPage.tsx`, `TaskRow.tsx`, `TaskForm.tsx`, `InlineTaskAdd.tsx`, `TaskCompletionCheckbox.tsx`, `SectionHeader.tsx`, `hooks/useTasks.ts` | My Tasks with sections, add/complete/reorder tasks, view tabs |
| **R** | Project List View + Board View | `ProjectViewPage.tsx`, `ProjectHeader.tsx`, `ProjectTabs.tsx`, `ColumnHeaders.tsx`, `AddTaskRow.tsx`, `BoardColumn.tsx`, `BoardCard.tsx`, `AddColumnButton.tsx`, `hooks/useProjects.ts` | List view with sections + Board view with drag-and-drop |
| **S** | Task Detail Pane + Comments + Subtasks | `TaskDetailPane.tsx`, `SubtaskList.tsx`, `DependencyList.tsx`, `CommentFeed.tsx`, `CommentItem.tsx`, `CommentInput.tsx`, `ActivityItem.tsx`, `RichTextEditor.tsx`, `hooks/useComments.ts` | Full task detail slide-over with all fields, comments, subtasks |
| **T** | Search + Inbox pages | `GlobalSearchOverlay.tsx`, `SearchPage.tsx`, `SearchFilters.tsx`, `SearchResultsList.tsx`, `InboxPage.tsx`, `InboxList.tsx`, `NotificationItem.tsx`, `NotificationBadge.tsx`, `hooks/useSearch.ts`, `hooks/useNotifications.ts` | Global search overlay + full search page + inbox with notification feed |
| **U** | Calendar View + Project Dashboard (Charts) | `CalendarGrid.tsx`, `CalendarDay.tsx`, `CalendarTaskChip.tsx`, `ProjectDashboardPage.tsx`, `CompletionChart.tsx`, `TasksBySection.tsx`, `TasksByAssignee.tsx`, `StatusIndicator.tsx` | Calendar month/week views + project dashboard with Recharts |
| **V** | Common components + Custom Fields + Tags + Bulk Ops + Teams | `Avatar.tsx`, `Badge.tsx`, `Button.tsx`, `Checkbox.tsx`, `DatePicker.tsx`, `Dropdown.tsx`, `Modal.tsx`, `Pill.tsx`, `SearchInput.tsx`, `Spinner.tsx`, `EmptyState.tsx`, `Tooltip.tsx`, `BulkActionBar.tsx`, `TeamsPage.tsx`, `TeamDetailPage.tsx`, `hooks/useCustomFields.ts`, `hooks/useTags.ts`, `hooks/useTeams.ts` | All shared components + custom field inline editing + tag pills + bulk action bar + teams pages |

**Note:** All 7 agents enhance existing stub components at `app/frontend/asana-clone/src/components/features/`. They use the same `callTool()` API client (from Wave 4N) and the same design tokens. They can work fully independently since they touch different feature directories. Agent V builds shared components in `components/common/` that others may reference — if needed, other agents can create local stubs and V's final versions replace them.

---

### Wave 6 — Tier 2 Stubs + Electron (2 parallel agents)
> Depends on: Wave 5 (core pages working). Tier 2 stub files already exist — agents enhance them with seed data rendering.

| Agent | Task | Files | Output |
|-------|------|-------|--------|
| **W** | All Tier 2 stub pages (8 pages) | `stubs/TimelinePage.tsx`, `GoalsPage.tsx`, `PortfoliosPage.tsx`, `WorkloadPage.tsx`, `ReportingPage.tsx`, `FormsPage.tsx`, `TemplatesPage.tsx`, `MessagesPage.tsx`, `SettingsPage.tsx` | All stub pages render with seeded data, no 404s |
| **X** | Electron desktop app setup | `electron/main.ts`, `electron/preload.ts`, `electron-builder.yml`, package.json scripts | `make desktop` builds .dmg/.exe/.AppImage |

---

### Wave 7 — Tests (2 parallel agents)
> Depends on: Wave 4M (seed working), Wave 3 (all tools), Wave 6 (all pages)

| Agent | Task | Files | Output |
|-------|------|-------|--------|
| **Y** | Unit tests (all 104 tool tests) | `app/tests/test_tools.py`, `shared/test_helpers.py` | `pytest app/tests/ -v` passes |
| **Z** | Playwright E2E tests (all 55 tests) | `app/tests/e2e/*.py` (14 test files), `conftest.py` | `npx playwright test` passes |

---

### Wave 8 — Polish + Validation (1 agent)
> Depends on: All waves complete

| Agent | Task | Files | Output |
|-------|------|-------|--------|
| **AA** | Visual polish (Computer Use comparison) + `make validate` | All UI files | 95% fidelity confirmed, all checks pass |

---

### Parallelism Summary

| Wave | Agents | Running in parallel | Cumulative agents |
|------|--------|--------------------:|------------------:|
| 1 | A, B, D | 3 | 3 |
| 2 | E, F, G | 3 | 6 |
| 3 | H, I, J, K, L | 5 | 11 |
| 4 | M, N, O | 3 | 14 |
| 5 | P, Q, R, S, T, U, V | 7 | 21 |
| 6 | W, X | 2 | 23 |
| 7 | Y, Z | 2 | 25 |
| 8 | AA | 1 | 26 |

**Total: 26 agent slots across 8 waves.** Maximum concurrency: **7 agents** (Wave 5).
Frontend scaffold (previously Wave 1C) is already complete — saves one agent slot.

### Agent Dependency Graph

```
                    [Existing: Frontend Scaffold at app/frontend/asana-clone/]
                                          │
Wave 1:  [A: DB Schema]  [B: Seed JSON]  │  [D: Docker Files]
              │                 │          │        │
              ▼                 │          │        │
Wave 2:  [E: Models]  [F: Schemas]  [G: Auth]      │
              │            │           │            │
              ▼            ▼           ▼            │
Wave 3:  [H: Server] [I: Task Tools] [J: Proj Tools] [K: Comment Tools] [L: Notif/Search Tools]
              │            │           │               │                  │
              ▼            ▼           ▼               ▼                  ▼
Wave 4:  [M: Seed Script + Docker]  [N: API Layer + Hooks]  [O: Login Page]
              │                          │                        │
              ▼                          ▼                        ▼
Wave 5:  [P: Home] [Q: My Tasks] [R: Projects] [S: Task Detail] [T: Search+Inbox] [U: Calendar+Charts] [V: Common+Tags+Bulk+Teams]
              │          │            │              │                │                  │                       │
              ▼          ▼            ▼              ▼                ▼                  ▼                       ▼
Wave 6:  [W: Tier 2 Stubs]  [X: Electron]
              │                   │
              ▼                   ▼
Wave 7:  [Y: Unit Tests]  [Z: Playwright Tests]
              │                   │
              ▼                   ▼
Wave 8:  [AA: Visual Polish + Validation]
```
