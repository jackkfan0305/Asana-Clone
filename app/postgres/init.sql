-- Asana Clone Database Schema
-- 35 tables: 24 Tier 1 core + 6 Tier 2 stubs + audit_log + 4 junction tables

-- ============================================================
-- 1. Organizations
-- ============================================================
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Users
-- ============================================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'standard', 'viewer')),
  organization_id TEXT REFERENCES organizations(id),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Sessions
-- ============================================================
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Teams
-- ============================================================
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Team Members (junction)
-- ============================================================
CREATE TABLE team_members (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- ============================================================
-- 6. Projects
-- ============================================================
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  team_id TEXT REFERENCES teams(id),
  owner_id TEXT REFERENCES users(id),
  color TEXT,
  icon TEXT,
  status TEXT CHECK (status IN ('on_track', 'at_risk', 'off_track', 'on_hold', 'complete')) DEFAULT 'on_track',
  default_view TEXT CHECK (default_view IN ('list', 'board', 'calendar', 'timeline', 'dashboard')) DEFAULT 'list',
  enabled_views TEXT[] DEFAULT ARRAY['overview', 'list', 'board', 'timeline', 'dashboard'],
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_fulltext ON projects USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));
CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);

-- ============================================================
-- 7. Project Members (junction)
-- ============================================================
CREATE TABLE project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')) DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ============================================================
-- 8. Sections
-- ============================================================
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sections_project ON sections(project_id);

-- ============================================================
-- 9. User Task Sections (personal My Tasks sections)
-- ============================================================
CREATE TABLE user_task_sections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_task_sections_user ON user_task_sections(user_id);

-- ============================================================
-- 10. Tasks
-- ============================================================
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT REFERENCES users(id),
  parent_task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  user_task_section_id TEXT REFERENCES user_task_sections(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  task_type TEXT DEFAULT 'task' CHECK (task_type IN ('task', 'milestone', 'approval')),
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tasks_fulltext ON tasks USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_section ON tasks(section_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_user_section ON tasks(user_task_section_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- ============================================================
-- 11. Task Projects (many-to-many: task can belong to multiple projects)
-- ============================================================
CREATE TABLE task_projects (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES sections(id),
  position INTEGER DEFAULT 0,
  PRIMARY KEY (task_id, project_id)
);

-- ============================================================
-- 12. Task Followers (junction)
-- ============================================================
CREATE TABLE task_followers (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- ============================================================
-- 13. Task Dependencies
-- ============================================================
CREATE TABLE task_dependencies (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL CHECK (dependency_type IN ('blocking', 'blocked_by')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- ============================================================
-- 14. Comments
-- ============================================================
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_task ON comments(task_id);

-- ============================================================
-- 15. Comment Likes (junction)
-- ============================================================
CREATE TABLE comment_likes (
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- ============================================================
-- 16. Mentions
-- ============================================================
CREATE TABLE mentions (
  id TEXT PRIMARY KEY,
  comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  mentioned_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);

-- ============================================================
-- 17. Activity Log
-- ============================================================
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_task ON activity_log(task_id);
CREATE INDEX idx_activity_project ON activity_log(project_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);

-- ============================================================
-- 18. Tags
-- ============================================================
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  organization_id TEXT REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. Task Tags (junction)
-- ============================================================
CREATE TABLE task_tags (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, tag_id)
);

-- ============================================================
-- 20. Custom Fields
-- ============================================================
CREATE TABLE custom_fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('dropdown', 'multi_select', 'text', 'number', 'date', 'people', 'checkbox')),
  organization_id TEXT REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 21. Custom Field Options (for dropdown/multi-select)
-- ============================================================
CREATE TABLE custom_field_options (
  id TEXT PRIMARY KEY,
  custom_field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cfo_field ON custom_field_options(custom_field_id);

-- ============================================================
-- 22. Project Custom Fields (which fields attached to which projects)
-- ============================================================
CREATE TABLE project_custom_fields (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  custom_field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (project_id, custom_field_id)
);

-- ============================================================
-- 23. Task Custom Field Values
-- ============================================================
CREATE TABLE task_custom_field_values (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  custom_field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  string_value TEXT,
  number_value NUMERIC,
  date_value DATE,
  option_id TEXT REFERENCES custom_field_options(id) ON DELETE SET NULL,
  user_ids TEXT[],
  boolean_value BOOLEAN,
  PRIMARY KEY (task_id, custom_field_id)
);

-- ============================================================
-- 24. Notifications
-- ============================================================
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'comment_added', 'task_completed', 'mentioned', 'due_date_approaching', 'project_update', 'follower_added')),
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, archived);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================================
-- 25. Notification Preferences
-- ============================================================
CREATE TABLE notification_preferences (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, notification_type)
);

-- ============================================================
-- 26. Attachments
-- ============================================================
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_attachments_task ON attachments(task_id);

-- ============================================================
-- 27. Saved Searches
-- ============================================================
CREATE TABLE saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 28. Dashboard Widgets
-- ============================================================
CREATE TABLE dashboard_widgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('my_tasks', 'projects', 'notepad', 'recent', 'people', 'forms')),
  position INTEGER DEFAULT 0,
  config_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_widgets_user ON dashboard_widgets(user_id);

-- ============================================================
-- 29. Project Status Updates
-- ============================================================
CREATE TABLE project_status_updates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_status_updates_project ON project_status_updates(project_id);

-- ============================================================
-- Tier 2 Tables (30-34): seeded read-only data
-- ============================================================

-- 30. Goals
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT REFERENCES users(id),
  team_id TEXT REFERENCES teams(id),
  time_period TEXT,
  status TEXT CHECK (status IN ('on_track', 'at_risk', 'off_track')) DEFAULT 'on_track',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  parent_goal_id TEXT REFERENCES goals(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. Portfolios
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

-- 33. Project Templates
CREATE TABLE project_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  template_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. Messages & Replies
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

-- 35. Forms
CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  fields_json JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 36. Audit Log (for verifiers)
-- ============================================================
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
