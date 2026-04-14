export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'member';
}

export interface Organization {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  description: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: 'admin' | 'member';
}

export interface Project {
  id: string;
  name: string;
  teamId: string;
  color: string;
  icon: string;
  status: 'on_track' | 'at_risk' | 'off_track' | 'none';
  ownerId: string;
  archived: boolean;
  createdAt: string;
  description: string;
  enabledViews: string[];
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface Section {
  id: string;
  name: string;
  projectId: string;
  position: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  dueDate: string | null;
  startDate: string | null;
  completed: boolean;
  completedAt: string | null;
  parentTaskId: string | null;
  sectionId: string;
  projectId: string;
  position: number;
  createdBy: string;
  createdAt: string;
  tagIds: string[];
  customFieldValues: Record<string, string>;
  myTaskSection?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  likes: string[];
}

export interface ActivityEntry {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  fieldChanged: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  organizationId: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'dropdown' | 'text' | 'number' | 'date' | 'people' | 'checkbox';
  projectId: string;
  options: CustomFieldOption[];
}

export interface CustomFieldOption {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'comment_added' | 'mentioned' | 'due_date' | 'project_update';
  taskId: string | null;
  projectId: string | null;
  actorId: string;
  read: boolean;
  archived: boolean;
  bookmarked: boolean;
  createdAt: string;
  preview: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  type: 'blocking' | 'blocked_by';
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: Record<string, string>;
}

export interface DashboardWidget {
  id: string;
  userId: string;
  type: 'my_tasks' | 'projects' | 'goals' | 'stats';
  position: number;
  config: Record<string, string>;
}

export interface ProjectStatusUpdate {
  id: string;
  projectId: string;
  authorId: string;
  status: 'on_track' | 'at_risk' | 'off_track';
  text: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  ownerId: string;
  teamId: string;
  timePeriod: string;
  status: 'on_track' | 'at_risk' | 'off_track';
  progress: number;
  parentGoalId: string | null;
}

export interface Portfolio {
  id: string;
  name: string;
  ownerId: string;
  projectIds: string[];
}

export type ViewType = 'list' | 'board' | 'calendar' | 'timeline' | 'dashboard' | 'overview' | 'workflow' | 'messages' | 'files';
