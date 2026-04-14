import type { User, Organization, Team, Project, Section, Task, Comment, Tag, CustomField, Notification, Goal, Portfolio, TaskDependency, ActivityEntry, SavedSearch, Attachment } from '../types';

const avatar = (id: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;

export const currentUserId = 'usr_005';

export const organization: Organization = { id: 'org_001', name: 'Acme Corp' };

export const users: User[] = [
  { id: 'usr_001', name: 'Admin User', email: 'admin@acme.corp', avatarUrl: avatar('admin'), role: 'admin' },
  { id: 'usr_002', name: 'Sarah Connor', email: 'sarah@acme.corp', avatarUrl: avatar('sarah'), role: 'member' },
  { id: 'usr_003', name: 'John Smith', email: 'john@acme.corp', avatarUrl: avatar('john'), role: 'member' },
  { id: 'usr_004', name: 'View Only', email: 'viewer@acme.corp', avatarUrl: avatar('viewer'), role: 'member' },
  { id: 'usr_005', name: 'Emily Chen', email: 'emily@acme.corp', avatarUrl: avatar('emily'), role: 'member' },
  { id: 'usr_006', name: 'Marcus Johnson', email: 'marcus@acme.corp', avatarUrl: avatar('marcus'), role: 'member' },
  { id: 'usr_007', name: 'Alex Rivera', email: 'alex@acme.corp', avatarUrl: avatar('alex'), role: 'member' },
  { id: 'usr_008', name: 'Priya Patel', email: 'priya@acme.corp', avatarUrl: avatar('priya'), role: 'member' },
];

export const teams: Team[] = [
  { id: 'team_001', name: 'Engineering', organizationId: 'org_001', description: 'Product engineering team' },
  { id: 'team_002', name: 'Design', organizationId: 'org_001', description: 'Product design team' },
  { id: 'team_003', name: 'Marketing', organizationId: 'org_001', description: 'Growth and marketing team' },
];

export const teamMembers = [
  { teamId: 'team_001', userId: 'usr_001', role: 'admin' as const },
  { teamId: 'team_001', userId: 'usr_002', role: 'member' as const },
  { teamId: 'team_001', userId: 'usr_003', role: 'member' as const },
  { teamId: 'team_001', userId: 'usr_007', role: 'member' as const },
  { teamId: 'team_002', userId: 'usr_005', role: 'admin' as const },
  { teamId: 'team_002', userId: 'usr_006', role: 'member' as const },
  { teamId: 'team_002', userId: 'usr_008', role: 'member' as const },
  { teamId: 'team_003', userId: 'usr_004', role: 'admin' as const },
  { teamId: 'team_003', userId: 'usr_006', role: 'member' as const },
  { teamId: 'team_003', userId: 'usr_008', role: 'member' as const },
];

export const projects: Project[] = [
  { id: 'p1', name: 'Website Redesign', teamId: 't1', color: '#4186e0', icon: '🌐', status: 'on_track', ownerId: 'u1', archived: false, createdAt: '2026-03-01', description: 'Complete redesign of the company website with modern UI/UX patterns.', enabledViews: ['overview', 'list', 'board', 'timeline', 'dashboard'] },
  { id: 'p2', name: 'Mobile App v2', teamId: 't1', color: '#7a6ff0', icon: '📱', status: 'at_risk', ownerId: 'u2', archived: false, createdAt: '2026-02-15', description: 'Second major version of our mobile application.', enabledViews: ['overview', 'list', 'board', 'timeline', 'dashboard'] },
  { id: 'p3', name: 'Brand Guidelines', teamId: 't2', color: '#aa62e3', icon: '🎨', status: 'on_track', ownerId: 'u4', archived: false, createdAt: '2026-03-10', description: 'Establish comprehensive brand guidelines for all marketing materials.', enabledViews: ['overview', 'list', 'board', 'timeline', 'dashboard'] },
  { id: 'p4', name: 'Q2 Marketing Campaign', teamId: 't3', color: '#fd612c', icon: '📣', status: 'off_track', ownerId: 'u7', archived: false, createdAt: '2026-03-20', description: 'Cross-channel marketing campaign for Q2 product launch.', enabledViews: ['overview', 'list', 'board', 'timeline', 'dashboard'] },
  { id: 'p5', name: 'API Platform', teamId: 't1', color: '#37c5ab', icon: '⚡', status: 'on_track', ownerId: 'u3', archived: false, createdAt: '2026-01-10', description: 'Public API platform for third-party integrations.', enabledViews: ['overview', 'list', 'board', 'timeline', 'dashboard'] },
  { id: 'p6', name: 'Design System', teamId: 't2', color: '#e362e3', icon: '🧩', status: 'on_track', ownerId: 'u6', archived: false, createdAt: '2026-02-01', description: 'Shared design system and component library.', enabledViews: ['overview', 'list', 'board', 'timeline', 'dashboard'] },
];

export const sections: Section[] = [
  // Website Redesign
  { id: 's1', name: 'To do', projectId: 'p1', position: 0 },
  { id: 's2', name: 'In Progress', projectId: 'p1', position: 1 },
  { id: 's3', name: 'Done', projectId: 'p1', position: 2 },
  // Mobile App v2
  { id: 's4', name: 'Backlog', projectId: 'p2', position: 0 },
  { id: 's5', name: 'Sprint', projectId: 'p2', position: 1 },
  { id: 's6', name: 'In Review', projectId: 'p2', position: 2 },
  { id: 's7', name: 'Done', projectId: 'p2', position: 3 },
  // Brand Guidelines
  { id: 's8', name: 'Research', projectId: 'p3', position: 0 },
  { id: 's9', name: 'Drafting', projectId: 'p3', position: 1 },
  { id: 's10', name: 'Review', projectId: 'p3', position: 2 },
  { id: 's11', name: 'Approved', projectId: 'p3', position: 3 },
  // Q2 Marketing
  { id: 's12', name: 'Planning', projectId: 'p4', position: 0 },
  { id: 's13', name: 'Content Creation', projectId: 'p4', position: 1 },
  { id: 's14', name: 'Scheduled', projectId: 'p4', position: 2 },
  { id: 's15', name: 'Published', projectId: 'p4', position: 3 },
  // API Platform
  { id: 's16', name: 'To do', projectId: 'p5', position: 0 },
  { id: 's17', name: 'Doing', projectId: 'p5', position: 1 },
  { id: 's18', name: 'Done', projectId: 'p5', position: 2 },
  // Design System
  { id: 's19', name: 'Backlog', projectId: 'p6', position: 0 },
  { id: 's20', name: 'In Progress', projectId: 'p6', position: 1 },
  { id: 's21', name: 'Complete', projectId: 'p6', position: 2 },
];

let taskId = 0;
const t = (overrides: Partial<Task> & Pick<Task, 'title' | 'sectionId' | 'projectId'>): Task => ({
  id: `task${++taskId}`,
  description: '',
  assigneeId: null,
  dueDate: null,
  startDate: null,
  completed: false,
  completedAt: null,
  parentTaskId: null,
  position: taskId,
  createdBy: 'u1',
  createdAt: '2026-03-15',
  tagIds: [],
  customFieldValues: {},
  myTaskSection: 'Recently assigned',
  ...overrides,
});

export const tasks: Task[] = [
  // Website Redesign - To do
  t({ title: 'Design homepage hero section', sectionId: 's1', projectId: 'p1', assigneeId: 'u4', dueDate: '2026-04-20', startDate: '2026-04-14', tagIds: ['tag1'], customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Implement responsive navigation', sectionId: 's1', projectId: 'p1', assigneeId: 'u1', dueDate: '2026-04-22', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Create contact form', sectionId: 's1', projectId: 'p1', assigneeId: 'u2', dueDate: '2026-04-25', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Set up analytics tracking', sectionId: 's1', projectId: 'p1', assigneeId: 'u5', dueDate: '2026-04-28', customFieldValues: { cf1: 'Low', cf2: 'On track' } }),
  t({ title: 'Write SEO meta tags', sectionId: 's1', projectId: 'p1', assigneeId: null, dueDate: '2026-04-30', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  // Website Redesign - In Progress
  t({ title: 'Build component library', sectionId: 's2', projectId: 'p1', assigneeId: 'u1', dueDate: '2026-04-18', startDate: '2026-04-05', tagIds: ['tag2', 'tag5'], customFieldValues: { cf1: 'High', cf2: 'At risk' } }),
  t({ title: 'Design about page layouts', sectionId: 's2', projectId: 'p1', assigneeId: 'u4', dueDate: '2026-04-16', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Implement dark mode theme', sectionId: 's2', projectId: 'p1', assigneeId: 'u5', dueDate: '2026-04-17', tagIds: ['tag3'], customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  // Website Redesign - Done
  t({ title: 'Set up project repository', sectionId: 's3', projectId: 'p1', assigneeId: 'u1', completed: true, completedAt: '2026-03-20', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Create wireframes', sectionId: 's3', projectId: 'p1', assigneeId: 'u4', completed: true, completedAt: '2026-03-25', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Define color palette', sectionId: 's3', projectId: 'p1', assigneeId: 'u6', completed: true, completedAt: '2026-03-22', tagIds: ['tag1'], customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),

  // Mobile App v2 - Backlog
  t({ title: 'Research push notification providers', sectionId: 's4', projectId: 'p2', assigneeId: 'u3', dueDate: '2026-05-01', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Design onboarding flow', sectionId: 's4', projectId: 'p2', assigneeId: 'u4', dueDate: '2026-05-05', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Plan offline mode architecture', sectionId: 's4', projectId: 'p2', assigneeId: 'u1', dueDate: '2026-05-10', customFieldValues: { cf1: 'High', cf2: 'At risk' } }),
  t({ title: 'Write API migration guide', sectionId: 's4', projectId: 'p2', assigneeId: null, customFieldValues: { cf1: 'Low', cf2: 'On track' } }),
  // Mobile App v2 - Sprint
  t({ title: 'Implement authentication flow', sectionId: 's5', projectId: 'p2', assigneeId: 'u2', dueDate: '2026-04-15', startDate: '2026-04-08', tagIds: ['tag4'], customFieldValues: { cf1: 'High', cf2: 'At risk' } }),
  t({ title: 'Build user profile screen', sectionId: 's5', projectId: 'p2', assigneeId: 'u5', dueDate: '2026-04-16', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Create task list component', sectionId: 's5', projectId: 'p2', assigneeId: 'u1', dueDate: '2026-04-17', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  // Mobile App v2 - In Review
  t({ title: 'Set up CI/CD pipeline', sectionId: 's6', projectId: 'p2', assigneeId: 'u3', dueDate: '2026-04-12', tagIds: ['tag6'], customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  // Mobile App v2 - Done
  t({ title: 'Initialize React Native project', sectionId: 's7', projectId: 'p2', assigneeId: 'u1', completed: true, completedAt: '2026-03-15', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Set up design tokens', sectionId: 's7', projectId: 'p2', assigneeId: 'u6', completed: true, completedAt: '2026-03-18', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),

  // Brand Guidelines
  t({ title: 'Audit existing brand assets', sectionId: 's8', projectId: 'p3', assigneeId: 'u4', dueDate: '2026-04-20', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Research competitor branding', sectionId: 's8', projectId: 'p3', assigneeId: 'u6', dueDate: '2026-04-22', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Draft typography guidelines', sectionId: 's9', projectId: 'p3', assigneeId: 'u4', dueDate: '2026-04-25', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Create logo usage rules', sectionId: 's9', projectId: 'p3', assigneeId: 'u8', dueDate: '2026-04-27', tagIds: ['tag7'], customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Define color system', sectionId: 's10', projectId: 'p3', assigneeId: 'u6', dueDate: '2026-04-18', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Finalize icon set', sectionId: 's11', projectId: 'p3', assigneeId: 'u4', completed: true, completedAt: '2026-04-10', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),

  // Q2 Marketing Campaign
  t({ title: 'Define target audience segments', sectionId: 's12', projectId: 'p4', assigneeId: 'u7', dueDate: '2026-04-10', customFieldValues: { cf1: 'High', cf2: 'Off track' } }),
  t({ title: 'Create campaign brief', sectionId: 's12', projectId: 'p4', assigneeId: 'u7', dueDate: '2026-04-08', customFieldValues: { cf1: 'High', cf2: 'Off track' } }),
  t({ title: 'Design social media templates', sectionId: 's13', projectId: 'p4', assigneeId: 'u8', dueDate: '2026-04-20', tagIds: ['tag8'], customFieldValues: { cf1: 'Medium', cf2: 'At risk' } }),
  t({ title: 'Write blog post series', sectionId: 's13', projectId: 'p4', assigneeId: 'u6', dueDate: '2026-04-25', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Produce launch video', sectionId: 's13', projectId: 'p4', assigneeId: null, dueDate: '2026-05-01', customFieldValues: { cf1: 'High', cf2: 'At risk' } }),
  t({ title: 'Schedule email drip campaign', sectionId: 's14', projectId: 'p4', assigneeId: 'u7', dueDate: '2026-04-28', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Publish landing page', sectionId: 's15', projectId: 'p4', assigneeId: 'u1', completed: true, completedAt: '2026-04-05', customFieldValues: { cf1: 'High', cf2: 'On track' } }),

  // API Platform
  t({ title: 'Design REST API schema', sectionId: 's16', projectId: 'p5', assigneeId: 'u3', dueDate: '2026-04-20', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Implement rate limiting', sectionId: 's16', projectId: 'p5', assigneeId: 'u5', dueDate: '2026-04-25', tagIds: ['tag4'], customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Build OAuth2 flow', sectionId: 's16', projectId: 'p5', assigneeId: 'u2', dueDate: '2026-04-28', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Write API documentation', sectionId: 's17', projectId: 'p5', assigneeId: 'u3', dueDate: '2026-04-18', startDate: '2026-04-10', tagIds: ['tag9'], customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Create SDK wrapper', sectionId: 's17', projectId: 'p5', assigneeId: 'u1', dueDate: '2026-04-22', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Set up API monitoring', sectionId: 's18', projectId: 'p5', assigneeId: 'u5', completed: true, completedAt: '2026-04-01', customFieldValues: { cf1: 'High', cf2: 'On track' } }),

  // Design System
  t({ title: 'Create button component variants', sectionId: 's19', projectId: 'p6', assigneeId: 'u6', dueDate: '2026-04-20', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Build form input components', sectionId: 's19', projectId: 'p6', assigneeId: 'u4', dueDate: '2026-04-22', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Design modal system', sectionId: 's19', projectId: 'p6', assigneeId: 'u8', dueDate: '2026-04-25', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Implement card component', sectionId: 's20', projectId: 'p6', assigneeId: 'u6', dueDate: '2026-04-16', startDate: '2026-04-10', tagIds: ['tag10'], customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Build navigation components', sectionId: 's20', projectId: 'p6', assigneeId: 'u4', dueDate: '2026-04-18', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Create spacing and layout tokens', sectionId: 's21', projectId: 'p6', assigneeId: 'u6', completed: true, completedAt: '2026-04-05', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Define color palette tokens', sectionId: 's21', projectId: 'p6', assigneeId: 'u6', completed: true, completedAt: '2026-04-03', customFieldValues: { cf1: 'High', cf2: 'On track' } }),

  // Extra tasks for bulk
  t({ title: 'Review accessibility compliance', sectionId: 's1', projectId: 'p1', assigneeId: 'u2', dueDate: '2026-05-02', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Performance audit', sectionId: 's1', projectId: 'p1', assigneeId: 'u5', dueDate: '2026-05-05', tagIds: ['tag11'], customFieldValues: { cf1: 'Low', cf2: 'On track' } }),
  t({ title: 'Create end-to-end tests', sectionId: 's4', projectId: 'p2', assigneeId: 'u3', dueDate: '2026-05-15', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Design notification center', sectionId: 's4', projectId: 'p2', assigneeId: 'u4', dueDate: '2026-05-20', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Implement deep linking', sectionId: 's5', projectId: 'p2', assigneeId: 'u2', dueDate: '2026-04-19', customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Write brand voice guidelines', sectionId: 's9', projectId: 'p3', assigneeId: 'u8', dueDate: '2026-04-30', tagIds: ['tag7'], customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Create presentation template', sectionId: 's9', projectId: 'p3', assigneeId: 'u6', dueDate: '2026-05-02', customFieldValues: { cf1: 'Low', cf2: 'On track' } }),
  t({ title: 'Set up A/B testing framework', sectionId: 's12', projectId: 'p4', assigneeId: 'u5', dueDate: '2026-04-30', customFieldValues: { cf1: 'High', cf2: 'At risk' } }),
  t({ title: 'Design email newsletter template', sectionId: 's13', projectId: 'p4', assigneeId: 'u8', dueDate: '2026-04-22', tagIds: ['tag8'], customFieldValues: { cf1: 'Medium', cf2: 'On track' } }),
  t({ title: 'Implement webhook system', sectionId: 's16', projectId: 'p5', assigneeId: 'u1', dueDate: '2026-05-05', customFieldValues: { cf1: 'High', cf2: 'On track' } }),
  t({ title: 'Build tooltip component', sectionId: 's19', projectId: 'p6', assigneeId: 'u4', dueDate: '2026-04-28', customFieldValues: { cf1: 'Low', cf2: 'On track' } }),
  t({ title: 'Create data table component', sectionId: 's20', projectId: 'p6', assigneeId: 'u6', dueDate: '2026-04-20', tagIds: ['tag10'], customFieldValues: { cf1: 'High', cf2: 'On track' } }),

  // Overdue tasks
  t({ title: 'Fix login page bug', sectionId: 's5', projectId: 'p2', assigneeId: 'u1', dueDate: '2026-04-05', customFieldValues: { cf1: 'High', cf2: 'Off track' } }),
  t({ title: 'Update privacy policy', sectionId: 's12', projectId: 'p4', assigneeId: 'u7', dueDate: '2026-04-01', customFieldValues: { cf1: 'High', cf2: 'Off track' } }),
  t({ title: 'Migrate legacy endpoints', sectionId: 's17', projectId: 'p5', assigneeId: 'u3', dueDate: '2026-04-08', customFieldValues: { cf1: 'High', cf2: 'At risk' } }),
];

// Subtasks
export const subtasks: Task[] = [
  t({ title: 'Hero section - desktop layout', sectionId: 's1', projectId: 'p1', parentTaskId: 'task1', assigneeId: 'u4', dueDate: '2026-04-18' }),
  t({ title: 'Hero section - mobile layout', sectionId: 's1', projectId: 'p1', parentTaskId: 'task1', assigneeId: 'u4', dueDate: '2026-04-19' }),
  t({ title: 'Hero section - animations', sectionId: 's1', projectId: 'p1', parentTaskId: 'task1', assigneeId: 'u5', dueDate: '2026-04-20' }),
  t({ title: 'Nav - hamburger menu', sectionId: 's1', projectId: 'p1', parentTaskId: 'task2', assigneeId: 'u1', dueDate: '2026-04-20' }),
  t({ title: 'Nav - dropdown menus', sectionId: 's1', projectId: 'p1', parentTaskId: 'task2', assigneeId: 'u1', dueDate: '2026-04-21' }),
  t({ title: 'Auth flow - login screen', sectionId: 's5', projectId: 'p2', parentTaskId: 'task16', assigneeId: 'u2', dueDate: '2026-04-13' }),
  t({ title: 'Auth flow - signup screen', sectionId: 's5', projectId: 'p2', parentTaskId: 'task16', assigneeId: 'u2', dueDate: '2026-04-14' }),
  t({ title: 'Auth flow - password reset', sectionId: 's5', projectId: 'p2', parentTaskId: 'task16', assigneeId: 'u2', dueDate: '2026-04-15' }),
  t({ title: 'API docs - getting started guide', sectionId: 's17', projectId: 'p5', parentTaskId: 'task38', assigneeId: 'u3', dueDate: '2026-04-16' }),
  t({ title: 'API docs - authentication section', sectionId: 's17', projectId: 'p5', parentTaskId: 'task38', assigneeId: 'u3', dueDate: '2026-04-17' }),
  // More subtasks for depth
  t({ title: 'Button - primary variant', sectionId: 's19', projectId: 'p6', parentTaskId: 'task41', assigneeId: 'u6', dueDate: '2026-04-18' }),
  t({ title: 'Button - secondary variant', sectionId: 's19', projectId: 'p6', parentTaskId: 'task41', assigneeId: 'u6', dueDate: '2026-04-19' }),
  t({ title: 'Button - ghost variant', sectionId: 's19', projectId: 'p6', parentTaskId: 'task41', assigneeId: 'u6', dueDate: '2026-04-20' }),
  t({ title: 'Rate limit - token bucket algorithm', sectionId: 's16', projectId: 'p5', parentTaskId: 'task36', assigneeId: 'u5', dueDate: '2026-04-22' }),
  t({ title: 'Rate limit - response headers', sectionId: 's16', projectId: 'p5', parentTaskId: 'task36', assigneeId: 'u5', dueDate: '2026-04-23' }),
  t({ title: 'Card component - header slot', sectionId: 's20', projectId: 'p6', parentTaskId: 'task44', assigneeId: 'u6', dueDate: '2026-04-15' }),
  t({ title: 'Card component - footer slot', sectionId: 's20', projectId: 'p6', parentTaskId: 'task44', assigneeId: 'u6', dueDate: '2026-04-16' }),
  t({ title: 'Contact form - validation', sectionId: 's1', projectId: 'p1', parentTaskId: 'task3', assigneeId: 'u2', dueDate: '2026-04-24' }),
  t({ title: 'Contact form - email integration', sectionId: 's1', projectId: 'p1', parentTaskId: 'task3', assigneeId: 'u2', dueDate: '2026-04-25' }),
  t({ title: 'Onboarding - welcome screen', sectionId: 's4', projectId: 'p2', parentTaskId: 'task13', assigneeId: 'u4', dueDate: '2026-05-03' }),
  t({ title: 'Onboarding - feature tour', sectionId: 's4', projectId: 'p2', parentTaskId: 'task13', assigneeId: 'u4', dueDate: '2026-05-04' }),
];

// Merge subtasks into tasks
tasks.push(...subtasks);

export const tags: Tag[] = [
  { id: 'tag1', name: 'Design', color: '#aa62e3', organizationId: 'org1' },
  { id: 'tag2', name: 'Frontend', color: '#4186e0', organizationId: 'org1' },
  { id: 'tag3', name: 'Dark Mode', color: '#8da3a6', organizationId: 'org1' },
  { id: 'tag4', name: 'Security', color: '#e8384f', organizationId: 'org1' },
  { id: 'tag5', name: 'Component Library', color: '#37c5ab', organizationId: 'org1' },
  { id: 'tag6', name: 'DevOps', color: '#fd9a00', organizationId: 'org1' },
  { id: 'tag7', name: 'Branding', color: '#e362e3', organizationId: 'org1' },
  { id: 'tag8', name: 'Social Media', color: '#fd612c', organizationId: 'org1' },
  { id: 'tag9', name: 'Documentation', color: '#eec300', organizationId: 'org1' },
  { id: 'tag10', name: 'UI Components', color: '#7a6ff0', organizationId: 'org1' },
  { id: 'tag11', name: 'Performance', color: '#a4cf30', organizationId: 'org1' },
  { id: 'tag12', name: 'Bug', color: '#e8384f', organizationId: 'org1' },
  { id: 'tag13', name: 'Enhancement', color: '#62d26f', organizationId: 'org1' },
  { id: 'tag14', name: 'Research', color: '#20aaea', organizationId: 'org1' },
  { id: 'tag15', name: 'Urgent', color: '#fd612c', organizationId: 'org1' },
  { id: 'tag16', name: 'Blocked', color: '#e8384f', organizationId: 'org1' },
];

export const customFields: CustomField[] = [
  {
    id: 'cf1', name: 'Priority', type: 'dropdown', projectId: 'all',
    options: [
      { id: 'cf1-1', name: 'Low', color: '#62d26f', position: 0 },
      { id: 'cf1-2', name: 'Medium', color: '#f1bd6c', position: 1 },
      { id: 'cf1-3', name: 'High', color: '#e8384f', position: 2 },
    ]
  },
  {
    id: 'cf2', name: 'Status', type: 'dropdown', projectId: 'all',
    options: [
      { id: 'cf2-1', name: 'On track', color: '#62d26f', position: 0 },
      { id: 'cf2-2', name: 'At risk', color: '#f1bd6c', position: 1 },
      { id: 'cf2-3', name: 'Off track', color: '#e8384f', position: 2 },
    ]
  },
  {
    id: 'cf3', name: 'Effort', type: 'number', projectId: 'all', options: []
  },
  {
    id: 'cf4', name: 'Review Date', type: 'date', projectId: 'all', options: []
  },
  {
    id: 'cf5', name: 'Reviewer', type: 'people', projectId: 'all', options: []
  },
];

export const comments: Comment[] = [
  { id: 'c1', taskId: 'task1', authorId: 'u4', body: 'I\'ve started working on the hero section. Going with a bold gradient approach. @Jack Fan thoughts?', createdAt: '2026-04-10T10:30:00Z', editedAt: null, likes: ['u1', 'u2'] },
  { id: 'c2', taskId: 'task1', authorId: 'u1', body: 'Looks great! Let\'s make sure we have a strong CTA above the fold.', createdAt: '2026-04-10T11:00:00Z', editedAt: null, likes: ['u4'] },
  { id: 'c3', taskId: 'task6', authorId: 'u1', body: 'The component library is taking longer than expected. We might need to adjust the timeline for dependent tasks.', createdAt: '2026-04-12T09:00:00Z', editedAt: null, likes: [] },
  { id: 'c4', taskId: 'task6', authorId: 'u2', body: 'I can help with the form components if that would speed things up.', createdAt: '2026-04-12T09:30:00Z', editedAt: null, likes: ['u1'] },
  { id: 'c5', taskId: 'task16', authorId: 'u2', body: 'Auth flow is progressing. OAuth integration is proving tricky with the new provider.', createdAt: '2026-04-11T14:00:00Z', editedAt: '2026-04-11T14:15:00Z', likes: [] },
  { id: 'c6', taskId: 'task16', authorId: 'u3', body: '@Sarah Chen I had a similar issue last month. Check the token refresh endpoint — it changed in their v3 API.', createdAt: '2026-04-11T14:30:00Z', editedAt: null, likes: ['u2', 'u5'] },
  { id: 'c7', taskId: 'task19', authorId: 'u3', body: 'CI/CD pipeline is ready for review. Added staging environment auto-deploy.', createdAt: '2026-04-11T16:00:00Z', editedAt: null, likes: ['u1', 'u2', 'u5'] },
  { id: 'c8', taskId: 'task22', authorId: 'u4', body: 'Completed initial brand audit. Found 47 inconsistencies across our digital properties.', createdAt: '2026-04-09T10:00:00Z', editedAt: null, likes: ['u6', 'u7'] },
  { id: 'c9', taskId: 'task28', authorId: 'u7', body: 'Campaign brief needs another round of revisions. Client feedback was mixed.', createdAt: '2026-04-07T11:00:00Z', editedAt: null, likes: [] },
  { id: 'c10', taskId: 'task35', authorId: 'u3', body: 'REST API schema draft is ready. Using OpenAPI 3.1 spec. @Alex Kim please review the auth endpoints.', createdAt: '2026-04-13T08:00:00Z', editedAt: null, likes: [] },
  // More comments
  { id: 'c11', taskId: 'task2', authorId: 'u1', body: 'Starting with mobile-first approach for the navigation.', createdAt: '2026-04-13T09:00:00Z', editedAt: null, likes: ['u4'] },
  { id: 'c12', taskId: 'task7', authorId: 'u4', body: 'About page layouts are in Figma. Three options to choose from.', createdAt: '2026-04-12T15:00:00Z', editedAt: null, likes: ['u1', 'u6'] },
  { id: 'c13', taskId: 'task38', authorId: 'u3', body: 'Documentation is looking good. Added interactive code examples.', createdAt: '2026-04-13T10:00:00Z', editedAt: null, likes: ['u1'] },
  { id: 'c14', taskId: 'task44', authorId: 'u6', body: 'Card component supports all spacing variants now. Demo in Storybook.', createdAt: '2026-04-12T16:00:00Z', editedAt: null, likes: ['u4', 'u8'] },
  { id: 'c15', taskId: 'task8', authorId: 'u5', body: 'Dark mode implementation is 80% complete. Need to fix contrast issues on secondary buttons.', createdAt: '2026-04-13T11:00:00Z', editedAt: null, likes: [] },

  // Additional comments for richness
  { id: 'c16', taskId: 'task3', authorId: 'u2', body: 'Contact form wireframe is done. Adding reCAPTCHA integration.', createdAt: '2026-04-11T13:00:00Z', editedAt: null, likes: ['u1'] },
  { id: 'c17', taskId: 'task13', authorId: 'u4', body: 'Onboarding flow mockups ready. 5-step wizard with skip option.', createdAt: '2026-04-10T09:00:00Z', editedAt: null, likes: ['u2', 'u3'] },
  { id: 'c18', taskId: 'task24', authorId: 'u4', body: 'Typography system finalized: 4 heading levels + 2 body sizes.', createdAt: '2026-04-11T10:00:00Z', editedAt: null, likes: ['u6'] },
  { id: 'c19', taskId: 'task30', authorId: 'u8', body: 'Social media templates looking good, but need dark variants.', createdAt: '2026-04-12T14:00:00Z', editedAt: null, likes: [] },
  { id: 'c20', taskId: 'task41', authorId: 'u6', body: 'Button variants finalized: primary, secondary, ghost, danger, and link styles.', createdAt: '2026-04-13T07:00:00Z', editedAt: null, likes: ['u4', 'u8'] },
];

export const activityLog: ActivityEntry[] = [
  { id: 'a1', taskId: 'task1', userId: 'u1', action: 'changed', fieldChanged: 'due_date', oldValue: 'Apr 18', newValue: 'Apr 20', createdAt: '2026-04-09T10:00:00Z' },
  { id: 'a2', taskId: 'task6', userId: 'u1', action: 'changed', fieldChanged: 'status', oldValue: 'On track', newValue: 'At risk', createdAt: '2026-04-12T09:00:00Z' },
  { id: 'a3', taskId: 'task9', userId: 'u1', action: 'completed', fieldChanged: null, oldValue: null, newValue: null, createdAt: '2026-03-20T15:00:00Z' },
  { id: 'a4', taskId: 'task16', userId: 'u2', action: 'changed', fieldChanged: 'assignee', oldValue: 'Unassigned', newValue: 'Sarah Chen', createdAt: '2026-04-08T09:00:00Z' },
  { id: 'a5', taskId: 'task19', userId: 'u3', action: 'moved', fieldChanged: 'section', oldValue: 'Sprint', newValue: 'In Review', createdAt: '2026-04-11T16:00:00Z' },
];

export const notifications: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'task_assigned', taskId: 'task2', projectId: 'p1', actorId: 'u4', read: false, archived: false, bookmarked: false, createdAt: '2026-04-13T09:00:00Z', preview: 'Emily Johnson assigned "Implement responsive navigation" to you' },
  { id: 'n2', userId: 'u1', type: 'comment_added', taskId: 'task1', projectId: 'p1', actorId: 'u4', read: false, archived: false, bookmarked: false, createdAt: '2026-04-13T08:30:00Z', preview: 'Emily Johnson commented on "Design homepage hero section"' },
  { id: 'n3', userId: 'u1', type: 'mentioned', taskId: 'task1', projectId: 'p1', actorId: 'u4', read: false, archived: false, bookmarked: true, createdAt: '2026-04-13T08:30:00Z', preview: 'Emily Johnson mentioned you in "Design homepage hero section"' },
  { id: 'n4', userId: 'u1', type: 'task_completed', taskId: 'task10', projectId: 'p1', actorId: 'u4', read: true, archived: false, bookmarked: false, createdAt: '2026-04-12T17:00:00Z', preview: 'Emily Johnson completed "Create wireframes"' },
  { id: 'n5', userId: 'u1', type: 'comment_added', taskId: 'task6', projectId: 'p1', actorId: 'u2', read: true, archived: false, bookmarked: false, createdAt: '2026-04-12T09:30:00Z', preview: 'Sarah Chen commented on "Build component library"' },
  { id: 'n6', userId: 'u1', type: 'due_date', taskId: 'task18', projectId: 'p2', actorId: 'u1', read: false, archived: false, bookmarked: false, createdAt: '2026-04-13T07:00:00Z', preview: '"Create task list component" is due tomorrow' },
  { id: 'n7', userId: 'u1', type: 'project_update', taskId: null, projectId: 'p4', actorId: 'u7', read: false, archived: false, bookmarked: false, createdAt: '2026-04-12T16:00:00Z', preview: 'David Thompson posted a status update on "Q2 Marketing Campaign"' },
  { id: 'n8', userId: 'u1', type: 'task_assigned', taskId: 'task39', projectId: 'p5', actorId: 'u3', read: true, archived: false, bookmarked: false, createdAt: '2026-04-11T10:00:00Z', preview: 'Marcus Rivera assigned "Create SDK wrapper" to you' },
  { id: 'n9', userId: 'u1', type: 'comment_added', taskId: 'task19', projectId: 'p2', actorId: 'u3', read: true, archived: true, bookmarked: false, createdAt: '2026-04-11T16:00:00Z', preview: 'Marcus Rivera commented on "Set up CI/CD pipeline"' },
  { id: 'n10', userId: 'u1', type: 'mentioned', taskId: 'task10', projectId: 'p1', actorId: 'u6', read: true, archived: true, bookmarked: false, createdAt: '2026-04-10T14:00:00Z', preview: 'Priya Patel mentioned you in "Create wireframes"' },
  // More notifications
  { id: 'n11', userId: 'u1', type: 'task_completed', taskId: 'task40', projectId: 'p5', actorId: 'u5', read: true, archived: false, bookmarked: false, createdAt: '2026-04-10T11:00:00Z', preview: 'Alex Kim completed "Set up API monitoring"' },
  { id: 'n12', userId: 'u1', type: 'comment_added', taskId: 'task7', projectId: 'p1', actorId: 'u4', read: true, archived: false, bookmarked: true, createdAt: '2026-04-12T15:00:00Z', preview: 'Emily Johnson commented on "Design about page layouts"' },
  { id: 'n13', userId: 'u1', type: 'due_date', taskId: 'task57', projectId: 'p2', actorId: 'u1', read: false, archived: false, bookmarked: false, createdAt: '2026-04-13T07:00:00Z', preview: '"Fix login page bug" is overdue' },
  { id: 'n14', userId: 'u1', type: 'task_assigned', taskId: 'task56', projectId: 'p5', actorId: 'u3', read: false, archived: false, bookmarked: false, createdAt: '2026-04-12T10:00:00Z', preview: 'Marcus Rivera assigned "Implement webhook system" to you' },
  { id: 'n15', userId: 'u1', type: 'comment_added', taskId: 'task38', projectId: 'p5', actorId: 'u3', read: false, archived: false, bookmarked: false, createdAt: '2026-04-13T10:00:00Z', preview: 'Marcus Rivera commented on "Write API documentation"' },
  { id: 'n16', userId: 'u1', type: 'project_update', taskId: null, projectId: 'p2', actorId: 'u2', read: true, archived: false, bookmarked: false, createdAt: '2026-04-11T17:00:00Z', preview: 'Sarah Chen posted a status update on "Mobile App v2"' },

  // Extra for pagination feel
  { id: 'n17', userId: 'u1', type: 'task_completed', taskId: 'task34', projectId: 'p4', actorId: 'u1', read: true, archived: false, bookmarked: false, createdAt: '2026-04-05T12:00:00Z', preview: 'You completed "Publish landing page"' },
  { id: 'n18', userId: 'u1', type: 'comment_added', taskId: 'task22', projectId: 'p3', actorId: 'u4', read: true, archived: false, bookmarked: false, createdAt: '2026-04-09T10:30:00Z', preview: 'Emily Johnson commented on "Audit existing brand assets"' },
];

export const dependencies: TaskDependency[] = [
  { taskId: 'task6', dependsOnTaskId: 'task9', type: 'blocked_by' },
  { taskId: 'task7', dependsOnTaskId: 'task10', type: 'blocked_by' },
  { taskId: 'task8', dependsOnTaskId: 'task11', type: 'blocked_by' },
  { taskId: 'task1', dependsOnTaskId: 'task10', type: 'blocked_by' },
  { taskId: 'task16', dependsOnTaskId: 'task20', type: 'blocked_by' },
  { taskId: 'task17', dependsOnTaskId: 'task16', type: 'blocked_by' },
  { taskId: 'task24', dependsOnTaskId: 'task22', type: 'blocked_by' },
  { taskId: 'task30', dependsOnTaskId: 'task28', type: 'blocked_by' },
  { taskId: 'task37', dependsOnTaskId: 'task35', type: 'blocked_by' },
  { taskId: 'task39', dependsOnTaskId: 'task38', type: 'blocked_by' },
  { taskId: 'task45', dependsOnTaskId: 'task41', type: 'blocked_by' },
];

export const attachments: Attachment[] = [
  { id: 'att1', taskId: 'task1', filename: 'hero-mockup-v2.fig', url: '#', uploadedBy: 'u4', createdAt: '2026-04-10T10:00:00Z' },
  { id: 'att2', taskId: 'task10', filename: 'wireframes-final.pdf', url: '#', uploadedBy: 'u4', createdAt: '2026-03-24T14:00:00Z' },
  { id: 'att3', taskId: 'task22', filename: 'brand-audit-report.xlsx', url: '#', uploadedBy: 'u4', createdAt: '2026-04-09T10:00:00Z' },
  { id: 'att4', taskId: 'task28', filename: 'campaign-brief-v3.docx', url: '#', uploadedBy: 'u7', createdAt: '2026-04-07T11:00:00Z' },
  { id: 'att5', taskId: 'task38', filename: 'api-schema.yaml', url: '#', uploadedBy: 'u3', createdAt: '2026-04-13T08:00:00Z' },
];

export const savedSearches: SavedSearch[] = [
  { id: 'ss1', userId: 'u1', name: 'My overdue tasks', filters: { assignee: 'u1', overdue: 'true' } },
  { id: 'ss2', userId: 'u1', name: 'High priority unassigned', filters: { priority: 'High', assignee: 'unassigned' } },
  { id: 'ss3', userId: 'u1', name: 'Engineering tasks this week', filters: { team: 't1', dueThisWeek: 'true' } },
];

export const goals: Goal[] = [
  { id: 'g1', name: 'Launch redesigned website', ownerId: 'u1', teamId: 't1', timePeriod: 'Q2 2026', status: 'on_track', progress: 45, parentGoalId: null },
  { id: 'g2', name: 'Ship Mobile App v2', ownerId: 'u2', teamId: 't1', timePeriod: 'Q2 2026', status: 'at_risk', progress: 30, parentGoalId: null },
  { id: 'g3', name: 'Establish brand identity', ownerId: 'u4', teamId: 't2', timePeriod: 'Q2 2026', status: 'on_track', progress: 60, parentGoalId: null },
  { id: 'g4', name: 'Increase MQLs by 40%', ownerId: 'u7', teamId: 't3', timePeriod: 'Q2 2026', status: 'off_track', progress: 15, parentGoalId: null },
  { id: 'g5', name: 'Complete homepage redesign', ownerId: 'u1', teamId: 't1', timePeriod: 'Q2 2026', status: 'on_track', progress: 50, parentGoalId: 'g1' },
  { id: 'g6', name: 'Build component library', ownerId: 'u1', teamId: 't1', timePeriod: 'Q2 2026', status: 'at_risk', progress: 35, parentGoalId: 'g1' },
  { id: 'g7', name: 'Complete core features', ownerId: 'u2', teamId: 't1', timePeriod: 'Q2 2026', status: 'at_risk', progress: 25, parentGoalId: 'g2' },
];

export const portfolios: Portfolio[] = [
  { id: 'port1', name: 'Product Development', ownerId: 'u1', projectIds: ['p1', 'p2', 'p5'] },
  { id: 'port2', name: 'Brand & Marketing', ownerId: 'u7', projectIds: ['p3', 'p4', 'p6'] },
];

export const projectStatusUpdates = [
  { id: 'psu1', projectId: 'p1', authorId: 'u1', status: 'on_track' as const, text: 'Website redesign progressing well. Component library taking a bit longer but overall on schedule.', createdAt: '2026-04-12T10:00:00Z' },
  { id: 'psu2', projectId: 'p2', authorId: 'u2', status: 'at_risk' as const, text: 'Auth integration issues causing delays. May need to push back sprint deadline by 3 days.', createdAt: '2026-04-11T17:00:00Z' },
  { id: 'psu3', projectId: 'p4', authorId: 'u7', status: 'off_track' as const, text: 'Campaign brief requires major revisions. Target audience research was insufficient.', createdAt: '2026-04-12T16:00:00Z' },
];
