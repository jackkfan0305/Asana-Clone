# Asana Clone Missing Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the feature gaps between the real Asana desktop app and our clone, focusing on CRUD flows, task detail completeness, and upgrading read-only stub pages to functional ones.

**Architecture:** The frontend uses React with inline CSS (CSS vars), local state via custom hooks in `store.ts`, and fire-and-forget API calls to a FastAPI backend via `callTool()`. Each feature follows the pattern: add types → add store methods → add backend tool (if needed) → build UI component → wire up.

**Tech Stack:** React 19, TypeScript, FastAPI (Python), SQLAlchemy, PostgreSQL, lucide-react icons, recharts, date-fns

---

## File Map

### Existing files to modify
- `app/frontend/asana-clone/src/types/index.ts` — add new types (Favorite, FileView)
- `app/frontend/asana-clone/src/data/store.ts` — add goal/portfolio stores, favorites store
- `app/frontend/asana-clone/src/data/seed.ts` — add seed data for favorites
- `app/frontend/asana-clone/src/data/AppContext.tsx` — wire new stores
- `app/frontend/asana-clone/src/components/features/taskdetail/TaskDetailPane.tsx` — add dependencies UI, subtasks UI improvements, rich description
- `app/frontend/asana-clone/src/components/features/goals/GoalsPage.tsx` — upgrade from read-only stub to CRUD
- `app/frontend/asana-clone/src/components/features/portfolios/PortfoliosPage.tsx` — upgrade from read-only stub to CRUD
- `app/frontend/asana-clone/src/components/features/messages/MessagesPage.tsx` — upgrade from 61-line stub to functional page
- `app/frontend/asana-clone/src/components/features/projects/ProjectLayout.tsx` — add Files + Messages tabs
- `app/frontend/asana-clone/src/components/layout/Sidebar.tsx` — add favorites/starred section
- `app/frontend/asana-clone/src/components/layout/Topbar.tsx` — expand Create menu options

### New files to create
- `app/frontend/asana-clone/src/components/features/files/ProjectFilesPage.tsx` — files tab for projects
- `app/frontend/asana-clone/src/components/common/RichTextEditor.tsx` — minimal rich text for task descriptions
- `app/frontend/asana-clone/src/components/features/taskdetail/DependenciesSection.tsx` — dependencies UI
- `app/frontend/asana-clone/src/components/features/taskdetail/SubtasksSection.tsx` — subtasks UI

### Backend files (already exist, may need minor additions)
- `app/tools/subtasks.py` — already has full dependency CRUD
- `app/tools/followers.py` — already has attachment CRUD
- `app/tools/projects.py` — already has project CRUD
- `app/models.py` — may need Goal/Portfolio model additions if not present

---

## Task 1: Task Dependencies UI in Detail Pane

The backend already has `set_dependency`, `remove_dependency` tools. The frontend `TaskDependency` type exists in `types/index.ts`. But there's no UI for viewing or managing dependencies in the task detail pane.

**Files:**
- Create: `app/frontend/asana-clone/src/components/features/taskdetail/DependenciesSection.tsx`
- Modify: `app/frontend/asana-clone/src/components/features/taskdetail/TaskDetailPane.tsx:1018` (insert before Description)
- Modify: `app/frontend/asana-clone/src/data/store.ts` (add dependency helpers to task store)
- Modify: `app/frontend/asana-clone/src/types/index.ts` (no changes needed, TaskDependency exists)

- [ ] **Step 1: Add dependency state and methods to the task store**

In `store.ts`, add state for dependencies and methods to add/remove them inside `useTaskStore`:

```typescript
// Inside useTaskStore, after the tasks state:
const [dependencies, setDependencies] = useState<TaskDependency[]>(() =>
  loadFromStorage('asana_dependencies', [])
);

useEffect(() => { saveToStorage('asana_dependencies', dependencies); }, [dependencies]);

const addDependency = useCallback((taskId: string, dependsOnTaskId: string) => {
  const dep: TaskDependency = { taskId, dependsOnTaskId, type: 'blocked_by' };
  setDependencies(prev => [...prev, dep]);
  callTool('set_dependency', {
    task_id: taskId,
    depends_on_task_id: dependsOnTaskId,
    dependency_type: 'blocked_by',
  }).catch(() => {});
}, []);

const removeDependency = useCallback((taskId: string, dependsOnTaskId: string) => {
  setDependencies(prev =>
    prev.filter(d => !(d.taskId === taskId && d.dependsOnTaskId === dependsOnTaskId))
  );
  callTool('remove_dependency', {
    task_id: taskId,
    depends_on_task_id: dependsOnTaskId,
  }).catch(() => {});
}, []);
```

Return `dependencies`, `addDependency`, `removeDependency` from the hook.

- [ ] **Step 2: Wire dependencies into AppContext**

In `AppContext.tsx`, add `dependencies`, `addDependency`, `removeDependency` to the AppContextType and the Provider value.

- [ ] **Step 3: Create DependenciesSection component**

Create `DependenciesSection.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../data/AppContext';
import { Plus, X, ArrowRight } from 'lucide-react';

export function DependenciesSection({ taskId }: { taskId: string }) {
  const { tasks, dependencies, addDependency, removeDependency } = useApp();
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const taskDeps = dependencies.filter(d => d.taskId === taskId);
  const blocking = dependencies.filter(d => d.dependsOnTaskId === taskId);
  const otherTasks = tasks.filter(
    t => t.id !== taskId && !taskDeps.some(d => d.dependsOnTaskId === t.id)
  );
  const filtered = search
    ? otherTasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : otherTasks.slice(0, 8);

  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 90 }}>Dependencies</span>
        <div style={{ position: 'relative' }} ref={ref}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: 'var(--text-placeholder)', cursor: 'pointer',
              padding: '2px 6px', borderRadius: 4, background: 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={12} strokeWidth={2} /> Add dependencies
          </button>

          {showSearch && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
              minWidth: 260, background: '#2a2d2f', border: '1px solid var(--border-divider)',
              borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', padding: '4px 0',
            }}>
              <div style={{ padding: '6px 8px' }}>
                <input
                  autoFocus
                  placeholder="Search tasks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', fontSize: 13, padding: '6px 8px',
                    background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                    borderRadius: 'var(--radius-input)', color: 'var(--text-primary)',
                  }}
                />
              </div>
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => { addDependency(taskId, t.id); setShowSearch(false); setSearch(''); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 12px', fontSize: 13, color: 'var(--text-primary)',
                    cursor: 'pointer', background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Show existing dependencies */}
      {taskDeps.map(dep => {
        const depTask = tasks.find(t => t.id === dep.dependsOnTaskId);
        if (!depTask) return null;
        return (
          <div key={dep.dependsOnTaskId} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 4px 102px', fontSize: 13,
          }}>
            <ArrowRight size={12} style={{ color: 'var(--text-placeholder)' }} />
            <span style={{ color: 'var(--text-primary)' }}>Blocked by: {depTask.title}</span>
            <button
              onClick={() => removeDependency(taskId, dep.dependsOnTaskId)}
              style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 2 }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
      {blocking.map(dep => {
        const blockingTask = tasks.find(t => t.id === dep.taskId);
        if (!blockingTask) return null;
        return (
          <div key={dep.taskId} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 4px 102px', fontSize: 13,
          }}>
            <ArrowRight size={12} style={{ color: 'var(--text-placeholder)', transform: 'rotate(180deg)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Blocking: {blockingTask.title}</span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Integrate DependenciesSection into TaskDetailPane**

In `TaskDetailPane.tsx`, import `DependenciesSection` and add it after the project section (around line 1018, before the Description divider):

```tsx
import { DependenciesSection } from './DependenciesSection';

// ... inside the body, after the project/section fields, before the Description divider:
<DependenciesSection taskId={task.id} />
```

- [ ] **Step 5: Verify and commit**

Run: `cd app/frontend/asana-clone && npx tsc --noEmit`
Expected: No type errors.

```bash
git add -A && git commit -m "feat: add task dependencies UI in detail pane"
```

---

## Task 2: Subtasks Section in Task Detail Pane

The TaskDetailPane currently references subtasks conceptually but doesn't have a proper inline subtask creation/display UI. Real Asana shows subtasks with checkboxes, assignees, and an inline add form.

**Files:**
- Create: `app/frontend/asana-clone/src/components/features/taskdetail/SubtasksSection.tsx`
- Modify: `app/frontend/asana-clone/src/components/features/taskdetail/TaskDetailPane.tsx` (replace any existing subtask stub)
- Modify: `app/frontend/asana-clone/src/data/store.ts` (add `addSubtask` method)

- [ ] **Step 1: Add addSubtask to the task store**

In `store.ts` inside `useTaskStore`, add:

```typescript
const addSubtask = useCallback((parentTaskId: string, title: string) => {
  const parent = tasks.find(t => t.id === parentTaskId);
  if (!parent) return;
  const tempId = `task${Date.now()}`;
  const subtask: Task = {
    id: tempId,
    title,
    description: '',
    assigneeId: null,
    dueDate: null,
    startDate: null,
    completed: false,
    completedAt: null,
    parentTaskId,
    sectionId: parent.sectionId,
    projectId: parent.projectId,
    position: tasks.filter(t => t.parentTaskId === parentTaskId).length,
    createdBy: seed.currentUserId,
    createdAt: new Date().toISOString(),
    tagIds: [],
    customFieldValues: {},
    myTaskSection: 'Recently assigned',
  };
  setTasks(prev => [...prev, subtask]);
  callTool('add_subtask', {
    parent_task_id: parentTaskId,
    title,
    assignee_id: null,
  }).then(res => {
    const data = unwrap(res);
    if (data?.subtask?.id) {
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: data.subtask.id } : t));
    }
  }).catch(() => {});
}, [tasks]);
```

Return `addSubtask` from the hook.

- [ ] **Step 2: Wire addSubtask into AppContext**

Add `addSubtask` to `AppContextType` and the Provider value in `AppContext.tsx`.

- [ ] **Step 3: Create SubtasksSection component**

Create `SubtasksSection.tsx`:

```tsx
import { useState } from 'react';
import { useApp } from '../../../data/AppContext';
import { Avatar } from '../../common/Avatar';
import { Checkbox } from '../../common/Checkbox';
import { Plus } from 'lucide-react';

export function SubtasksSection({ taskId }: { taskId: string }) {
  const { tasks, completeTask, addSubtask, setSelectedTaskId } = useApp();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const subtasks = tasks
    .filter(t => t.parentTaskId === taskId)
    .sort((a, b) => a.position - b.position);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addSubtask(taskId, newTitle.trim());
    setNewTitle('');
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Subtasks</span>
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, color: 'var(--text-placeholder)', cursor: 'pointer',
            padding: '2px 6px', borderRadius: 4, background: 'transparent',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Plus size={12} strokeWidth={2} />
        </button>
      </div>

      {subtasks.map(st => (
        <div key={st.id} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
          borderBottom: '1px solid var(--border-divider)',
        }}>
          <Checkbox
            checked={st.completed}
            onChange={() => completeTask(st.id)}
          />
          <span
            onClick={() => setSelectedTaskId(st.id)}
            style={{
              flex: 1, fontSize: 13, cursor: 'pointer',
              textDecoration: st.completed ? 'line-through' : 'none',
              color: st.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
            }}
          >
            {st.title}
          </span>
          {st.assigneeId && <Avatar userId={st.assigneeId} size={20} />}
          {st.dueDate && (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {new Date(st.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      ))}

      {adding && (
        <div style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'center' }}>
          <Checkbox checked={false} onChange={() => {}} />
          <input
            autoFocus
            placeholder="Write a subtask name"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
            }}
            onBlur={() => { if (newTitle.trim()) handleAdd(); setAdding(false); setNewTitle(''); }}
            style={{
              flex: 1, fontSize: 13, padding: '4px 8px',
              background: 'transparent', border: '1px solid var(--border-input)',
              borderRadius: 'var(--radius-input)', color: 'var(--text-primary)',
            }}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Integrate into TaskDetailPane**

In `TaskDetailPane.tsx`, replace the existing subtasks stub area (search for "Subtasks" comment around line 1000-1020) with:

```tsx
import { SubtasksSection } from './SubtasksSection';

// Before the Description section:
<SubtasksSection taskId={task.id} />
```

- [ ] **Step 5: Verify and commit**

Run: `cd app/frontend/asana-clone && npx tsc --noEmit`

```bash
git add -A && git commit -m "feat: add subtasks section with inline creation in task detail"
```

---

## Task 3: Rich Text Description Editor

Real Asana has a full rich text editor for task descriptions with bold, italic, lists, links. The clone currently uses a plain `<textarea>`. We'll add a minimal rich text editor using `contenteditable` (no new dependencies needed).

**Files:**
- Create: `app/frontend/asana-clone/src/components/common/RichTextEditor.tsx`
- Modify: `app/frontend/asana-clone/src/components/features/taskdetail/TaskDetailPane.tsx:1023` (replace textarea)

- [ ] **Step 1: Create RichTextEditor component**

Create `RichTextEditor.tsx`:

```tsx
import { useRef, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Link, Strikethrough } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
  };

  const toolbarBtn = (icon: React.ReactNode, command: string, value?: string) => (
    <button
      onMouseDown={e => { e.preventDefault(); exec(command, value); }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 4, background: 'transparent',
        color: 'var(--text-secondary)', cursor: 'pointer', border: 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
    </button>
  );

  const handleLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

  return (
    <div>
      {/* Toolbar — show on focus */}
      {showToolbar && (
        <div style={{
          display: 'flex', gap: 2, padding: '4px 4px', marginBottom: 4,
          background: '#2a2d2f', borderRadius: 6, border: '1px solid var(--border-divider)',
        }}>
          {toolbarBtn(<Bold size={14} />, 'bold')}
          {toolbarBtn(<Italic size={14} />, 'italic')}
          {toolbarBtn(<Strikethrough size={14} />, 'strikeThrough')}
          <div style={{ width: 1, background: 'var(--border-divider)', margin: '2px 4px' }} />
          {toolbarBtn(<List size={14} />, 'insertUnorderedList')}
          {toolbarBtn(<ListOrdered size={14} />, 'insertOrderedList')}
          <div style={{ width: 1, background: 'var(--border-divider)', margin: '2px 4px' }} />
          <button
            onMouseDown={handleLink}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 4, background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer', border: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Link size={14} />
          </button>
        </div>
      )}

      {/* Editor */}
      <div style={{ position: 'relative' }}>
        {isEmpty && !focused && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            fontSize: 13, color: 'var(--text-placeholder)', pointerEvents: 'none',
          }}>
            {placeholder || 'What is this task about?'}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: value }}
          onInput={() => onChange(editorRef.current?.innerHTML || '')}
          onFocus={() => { setFocused(true); setShowToolbar(true); }}
          onBlur={() => { setFocused(false); setTimeout(() => setShowToolbar(false), 200); }}
          style={{
            minHeight: 60,
            padding: 8,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            background: 'transparent',
            border: `1px solid ${focused ? 'var(--border-input)' : 'transparent'}`,
            borderRadius: 'var(--radius-input)',
            outline: 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace textarea in TaskDetailPane**

In `TaskDetailPane.tsx` around line 1023, replace the `<textarea>` block:

```tsx
import { RichTextEditor } from '../../common/RichTextEditor';

// Replace:
//   <textarea
//     placeholder="What is this task about?"
//     value={task.description}
//     onChange={e => updateTask(task.id, { description: e.target.value })}
//     ...
//   />

// With:
<RichTextEditor
  value={task.description}
  onChange={(val) => updateTask(task.id, { description: val })}
  placeholder="What is this task about?"
/>
```

- [ ] **Step 3: Add CSS for rich text content styling**

In `app/frontend/asana-clone/src/styles/global.css`, add:

```css
[contenteditable] ul, [contenteditable] ol {
  padding-left: 20px;
  margin: 4px 0;
}
[contenteditable] a {
  color: var(--text-link);
  text-decoration: underline;
}
[contenteditable] b, [contenteditable] strong {
  font-weight: 600;
}
```

- [ ] **Step 4: Verify and commit**

```bash
cd app/frontend/asana-clone && npx tsc --noEmit
git add -A && git commit -m "feat: add rich text editor for task descriptions"
```

---

## Task 4: Goals Page — Upgrade from Read-Only Stub to CRUD

Real Asana has: create goal, edit goal, delete goal, set progress, sub-goals, team goals / my goals tabs, strategy map. The clone currently renders goals from seed data with a "read-only stub" notice.

**Files:**
- Modify: `app/frontend/asana-clone/src/components/features/goals/GoalsPage.tsx` (full rewrite)
- Modify: `app/frontend/asana-clone/src/data/store.ts` (add goal store)
- Modify: `app/frontend/asana-clone/src/data/AppContext.tsx` (wire goal store)
- Modify: `app/frontend/asana-clone/src/data/seed.ts` (ensure goals seed data is correct)

- [ ] **Step 1: Add goal store to store.ts**

```typescript
import type { Task, Comment, Notification, Tag, Section, Project, Goal } from '../types';

// After useProjectStore:
export function useGoalStore() {
  const [goals, setGoals] = useState<Goal[]>(() => loadFromStorage('asana_goals', seed.goals));

  useEffect(() => { saveToStorage('asana_goals', goals); }, [goals]);

  const addGoal = useCallback((goal: Partial<Goal> & Pick<Goal, 'name'>) => {
    const newGoal: Goal = {
      id: `goal${Date.now()}`,
      name: goal.name,
      ownerId: goal.ownerId || seed.currentUserId,
      teamId: goal.teamId || seed.teams[0]?.id || '',
      timePeriod: goal.timePeriod || 'Q2 2026',
      status: goal.status || 'on_track',
      progress: goal.progress || 0,
      parentGoalId: goal.parentGoalId || null,
    };
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id && g.parentGoalId !== id));
  }, []);

  return { goals, addGoal, updateGoal, deleteGoal };
}
```

- [ ] **Step 2: Wire goal store into AppContext**

In `AppContext.tsx`:
- Import `useGoalStore` from store
- Call it in `AppProvider`
- Spread it into the Provider value
- Add to `AppContextType`

- [ ] **Step 3: Rewrite GoalsPage with CRUD**

Replace the full content of `GoalsPage.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../data/AppContext';
import { teams, currentUserId } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';
import { ProgressBar } from '../../common/ProgressBar';
import { Plus, MoreHorizontal, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import type { Goal } from '../../../types';

type Tab = 'strategy' | 'team' | 'my';

const statusOptions = [
  { value: 'on_track' as const, label: 'On track' },
  { value: 'at_risk' as const, label: 'At risk' },
  { value: 'off_track' as const, label: 'Off track' },
];

const timePeriodOptions = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'FY 2026'];

export function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useApp();
  const [tab, setTab] = useState<Tab>('team');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [collapsedGoals, setCollapsedGoals] = useState<Set<string>>(new Set());
  const [menuGoalId, setMenuGoalId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newTeamId, setNewTeamId] = useState(teams[0]?.id || '');
  const [newTimePeriod, setNewTimePeriod] = useState('Q2 2026');
  const [newParentId, setNewParentId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuGoalId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const topLevel = goals.filter(g => !g.parentGoalId);
  const myGoals = goals.filter(g => g.ownerId === currentUserId);

  const toggleCollapse = (id: string) => {
    setCollapsedGoals(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    addGoal({
      name: newName.trim(),
      teamId: newTeamId,
      timePeriod: newTimePeriod,
      parentGoalId: newParentId,
    });
    setNewName('');
    setShowCreateForm(false);
    setNewParentId(null);
  };

  const renderGoal = (goal: Goal, depth = 0) => {
    const team = teams.find(t => t.id === goal.teamId);
    const children = goals.filter(g => g.parentGoalId === goal.id);
    const isCollapsed = collapsedGoals.has(goal.id);
    const isEditing = editingGoalId === goal.id;

    return (
      <div key={goal.id}>
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px 100px 80px 32px',
            gap: 12, padding: '10px 0 10px ' + (depth * 24 + 12) + 'px',
            borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {children.length > 0 && (
              <button onClick={() => toggleCollapse(goal.id)} style={{ color: 'var(--text-secondary)', display: 'flex' }}>
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            {isEditing ? (
              <input
                autoFocus
                value={goal.name}
                onChange={e => updateGoal(goal.id, { name: e.target.value })}
                onBlur={() => setEditingGoalId(null)}
                onKeyDown={e => { if (e.key === 'Enter') setEditingGoalId(null); }}
                style={{
                  fontSize: 13, background: 'transparent', border: '1px solid var(--border-input)',
                  borderRadius: 'var(--radius-input)', padding: '2px 6px', color: 'var(--text-primary)',
                }}
              />
            ) : (
              <span style={{ fontSize: 13 }}>{goal.name}</span>
            )}
          </div>

          {/* Status dropdown */}
          <select
            value={goal.status}
            onChange={e => updateGoal(goal.id, { status: e.target.value as Goal['status'] })}
            style={{
              fontSize: 11, padding: '2px 4px', borderRadius: 4,
              background: goal.status === 'on_track' ? 'rgba(93,162,131,0.2)' :
                goal.status === 'at_risk' ? 'rgba(240,210,107,0.2)' : 'rgba(240,154,154,0.2)',
              color: goal.status === 'on_track' ? '#5da283' :
                goal.status === 'at_risk' ? '#f0d26b' : '#f09a9a',
              border: 'none', cursor: 'pointer',
            }}
          >
            {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range" min={0} max={100} value={goal.progress}
              onChange={e => updateGoal(goal.id, { progress: parseInt(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--color-primary)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 28 }}>{goal.progress}%</span>
          </div>

          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{goal.timePeriod}</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{team?.name}</span>
          <Avatar userId={goal.ownerId} size={20} />

          {/* Menu */}
          <div style={{ position: 'relative' }} ref={menuGoalId === goal.id ? menuRef : undefined}>
            <button
              onClick={() => setMenuGoalId(menuGoalId === goal.id ? null : goal.id)}
              style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 4, borderRadius: 4, cursor: 'pointer' }}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuGoalId === goal.id && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', zIndex: 50,
                background: '#2a2d2f', border: '1px solid var(--border-divider)',
                borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', padding: '4px 0', minWidth: 160,
              }}>
                <button onClick={() => { setEditingGoalId(goal.id); setMenuGoalId(null); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px',
                  fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', background: 'transparent',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => { setNewParentId(goal.id); setShowCreateForm(true); setMenuGoalId(null); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px',
                  fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', background: 'transparent',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Plus size={13} /> Add sub-goal
                </button>
                <button onClick={() => { deleteGoal(goal.id); setMenuGoalId(null); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px',
                  fontSize: 13, color: '#f09a9a', cursor: 'pointer', background: 'transparent',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {!isCollapsed && children.map(child => renderGoal(child, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10.5 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Goals</h1>
        <button
          onClick={() => { setShowCreateForm(true); setNewParentId(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            borderRadius: 'var(--radius-btn)', fontSize: 13, fontWeight: 500,
            background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
          }}
        >
          <Plus size={14} strokeWidth={2.5} /> Create goal
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-card)', padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
            {newParentId ? 'New sub-goal' : 'New goal'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              autoFocus
              placeholder="Goal name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreateForm(false); }}
              style={{
                flex: 1, fontSize: 13, padding: '8px 12px',
                background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius-input)', color: 'var(--text-primary)',
              }}
            />
            <select value={newTeamId} onChange={e => setNewTeamId(e.target.value)} style={{
              fontSize: 13, padding: '6px 8px', background: 'var(--bg-input)',
              border: '1px solid var(--border-input)', borderRadius: 'var(--radius-input)',
              color: 'var(--text-primary)',
            }}>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={newTimePeriod} onChange={e => setNewTimePeriod(e.target.value)} style={{
              fontSize: 13, padding: '6px 8px', background: 'var(--bg-input)',
              border: '1px solid var(--border-input)', borderRadius: 'var(--radius-input)',
              color: 'var(--text-primary)',
            }}>
              {timePeriodOptions.map(tp => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-btn)', fontSize: 13,
              background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
            }}>Create</button>
            <button onClick={() => { setShowCreateForm(false); setNewName(''); }} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-btn)', fontSize: 13,
              color: 'var(--text-secondary)', cursor: 'pointer', background: 'transparent',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        {([['strategy', 'Strategy map'], ['team', 'Team goals'], ['my', 'My goals']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as Tab)} style={{
            padding: '8px 16px', fontSize: 13,
            color: tab === key ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: tab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
          }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ height: 1, background: '#404244', margin: '0.5px -24px 16px' }} />

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px 100px 80px 32px',
        gap: 12, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border-table)',
      }}>
        <span>Name</span><span>Status</span><span>Progress</span><span>Time period</span><span>Team</span><span>Owner</span><span />
      </div>

      {tab === 'strategy' && topLevel.map(g => renderGoal(g))}
      {tab === 'team' && topLevel.map(g => renderGoal(g))}
      {tab === 'my' && myGoals.map(g => renderGoal(g))}

      {goals.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-placeholder)' }}>
          <p style={{ fontSize: 14, marginBottom: 8 }}>No goals yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{ fontSize: 13, color: 'var(--color-primary)', cursor: 'pointer' }}
          >
            Create your first goal
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify and commit**

```bash
cd app/frontend/asana-clone && npx tsc --noEmit
git add -A && git commit -m "feat: upgrade goals page from read-only stub to full CRUD"
```

---

## Task 5: Portfolios Page — Upgrade from Read-Only Stub to CRUD

Real Asana lets you create portfolios, add/remove projects, view status and progress. The clone is currently display-only.

**Files:**
- Modify: `app/frontend/asana-clone/src/components/features/portfolios/PortfoliosPage.tsx` (full rewrite)
- Modify: `app/frontend/asana-clone/src/data/store.ts` (add portfolio store)
- Modify: `app/frontend/asana-clone/src/data/AppContext.tsx` (wire portfolio store)

- [ ] **Step 1: Add portfolio store to store.ts**

```typescript
export function usePortfolioStore() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(() =>
    loadFromStorage('asana_portfolios', seed.portfolios)
  );

  useEffect(() => { saveToStorage('asana_portfolios', portfolios); }, [portfolios]);

  const addPortfolio = useCallback((name: string) => {
    const newPortfolio: Portfolio = {
      id: `portfolio${Date.now()}`,
      name,
      ownerId: seed.currentUserId,
      projectIds: [],
    };
    setPortfolios(prev => [...prev, newPortfolio]);
    return newPortfolio;
  }, []);

  const updatePortfolio = useCallback((id: string, updates: Partial<Portfolio>) => {
    setPortfolios(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePortfolio = useCallback((id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
  }, []);

  const addProjectToPortfolio = useCallback((portfolioId: string, projectId: string) => {
    setPortfolios(prev => prev.map(p =>
      p.id === portfolioId && !p.projectIds.includes(projectId)
        ? { ...p, projectIds: [...p.projectIds, projectId] }
        : p
    ));
  }, []);

  const removeProjectFromPortfolio = useCallback((portfolioId: string, projectId: string) => {
    setPortfolios(prev => prev.map(p =>
      p.id === portfolioId
        ? { ...p, projectIds: p.projectIds.filter(id => id !== projectId) }
        : p
    ));
  }, []);

  return { portfolios, addPortfolio, updatePortfolio, deletePortfolio, addProjectToPortfolio, removeProjectFromPortfolio };
}
```

- [ ] **Step 2: Wire portfolio store into AppContext**

Same pattern as goal store: import, call hook, spread into Provider value.

- [ ] **Step 3: Rewrite PortfoliosPage with CRUD**

Replace `PortfoliosPage.tsx` with a full implementation that includes:
- "Create portfolio" button that opens an inline form (name input + create/cancel buttons)
- Each portfolio card shows its projects in a table (Name, Status, Task Progress, Owner)
- "Add project" button per portfolio that opens a dropdown of available projects
- Remove project button (X icon) on each project row
- Delete portfolio button in a (...) menu
- Edit portfolio name via inline editing (click to edit)

Follow the exact same styling patterns as GoalsPage (CSS vars, inline styles, dropdown pattern with useRef + mousedown handler).

The component is large but follows the identical pattern as Task 4's GoalsPage. Key differences:
- Portfolio has `projectIds: string[]` instead of hierarchical goals
- The "add project" dropdown filters to projects not yet in the portfolio
- Progress is computed from task completion (already done in the existing stub)

- [ ] **Step 4: Verify and commit**

```bash
cd app/frontend/asana-clone && npx tsc --noEmit
git add -A && git commit -m "feat: upgrade portfolios page from read-only stub to full CRUD"
```

---

## Task 6: Messages Page — Project-Level Discussions

Real Asana has a Messages tab per project for team discussions. The clone has a 61-line stub. We'll build a functional messaging page.

**Files:**
- Modify: `app/frontend/asana-clone/src/components/features/messages/MessagesPage.tsx` (full rewrite)
- Modify: `app/frontend/asana-clone/src/types/index.ts` (add Message type)
- Modify: `app/frontend/asana-clone/src/data/seed.ts` (add seed messages)
- Modify: `app/frontend/asana-clone/src/data/store.ts` (add message store)
- Modify: `app/frontend/asana-clone/src/data/AppContext.tsx` (wire message store)
- Modify: `app/frontend/asana-clone/src/components/features/projects/ProjectLayout.tsx:6-14` (add Messages tab)
- Modify: `app/frontend/asana-clone/src/App.tsx` (add messages route under project)

- [ ] **Step 1: Add Message type**

In `types/index.ts`:

```typescript
export interface Message {
  id: string;
  projectId: string;
  authorId: string;
  body: string;
  createdAt: string;
  likes: string[];
}
```

- [ ] **Step 2: Add seed messages**

In `seed.ts`, add a `messages` export with 3-4 sample messages tied to existing project IDs.

- [ ] **Step 3: Add message store**

In `store.ts`:

```typescript
export function useMessageStore() {
  const [messages, setMessages] = useState<Message[]>(() =>
    loadFromStorage('asana_messages', seed.messages)
  );

  useEffect(() => { saveToStorage('asana_messages', messages); }, [messages]);

  const addMessage = useCallback((projectId: string, body: string) => {
    const msg: Message = {
      id: `msg${Date.now()}`,
      projectId,
      authorId: seed.currentUserId,
      body,
      createdAt: new Date().toISOString(),
      likes: [],
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  const likeMessage = useCallback((id: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== id) return m;
      const likes = m.likes.includes(seed.currentUserId)
        ? m.likes.filter(uid => uid !== seed.currentUserId)
        : [...m.likes, seed.currentUserId];
      return { ...m, likes };
    }));
  }, []);

  return { messages, addMessage, likeMessage };
}
```

- [ ] **Step 4: Wire message store into AppContext**

Same pattern.

- [ ] **Step 5: Rewrite MessagesPage**

Build a discussion thread UI:
- Shows messages for the current project (get `projectId` from `useParams()`)
- Each message shows author avatar, name, timestamp, body, like button
- Compose box at the bottom with avatar + textarea + send button (Cmd+Enter to send)
- Empty state: "No messages yet. Start a conversation with your team."

- [ ] **Step 6: Add Messages tab to ProjectLayout**

In `ProjectLayout.tsx` line 6-14, add to `viewTabs`:

```typescript
{ key: 'messages', label: 'Messages', path: 'messages' },
```

- [ ] **Step 7: Add Messages route**

In `App.tsx`, inside the `<Route path="/project/:projectId">` element, add:

```tsx
<Route path="messages" element={<MessagesPage />} />
```

Import `MessagesPage` at the top.

- [ ] **Step 8: Verify and commit**

```bash
cd app/frontend/asana-clone && npx tsc --noEmit
git add -A && git commit -m "feat: add project-level messages/discussions page"
```

---

## Task 7: Project Files Tab

Real Asana has a Files tab per project showing all attachments. The clone has attachment backend APIs but no Files view.

**Files:**
- Create: `app/frontend/asana-clone/src/components/features/files/ProjectFilesPage.tsx`
- Modify: `app/frontend/asana-clone/src/components/features/projects/ProjectLayout.tsx:6-14` (add Files tab)
- Modify: `app/frontend/asana-clone/src/App.tsx` (add files route)

- [ ] **Step 1: Create ProjectFilesPage**

```tsx
import { useParams } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { users } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { FileText, Image, Film, File, Download } from 'lucide-react';

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return <Image size={20} style={{ color: '#4573d2' }} />;
  if (['mp4', 'mov', 'avi'].includes(ext)) return <Film size={20} style={{ color: '#c27aeb' }} />;
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return <FileText size={20} style={{ color: '#5da283' }} />;
  return <File size={20} style={{ color: 'var(--text-secondary)' }} />;
}

export function ProjectFilesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { tasks } = useApp();

  // Collect all attachments from tasks in this project
  // For now, show from seed data. In a real implementation, fetch from API.
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  // Placeholder attachments derived from task data
  const attachments = projectTasks
    .filter(t => t.description && t.description.length > 0)
    .slice(0, 5)
    .map((t, i) => ({
      id: `att-${i}`,
      taskId: t.id,
      filename: `${t.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      uploadedBy: t.createdBy,
      createdAt: t.createdAt,
    }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ font: 'var(--font-h2)' }}>Files</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          Attachments from tasks in this project
        </p>
      </div>

      {attachments.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-placeholder)' }}>
          <File size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: 14, marginBottom: 4 }}>No files yet</p>
          <p style={{ fontSize: 12 }}>Files attached to tasks in this project will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {attachments.map(att => {
            const uploader = users.find(u => u.id === att.uploadedBy);
            return (
              <div key={att.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-card)', padding: 16, cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 12px' }}>
                  {getFileIcon(att.filename)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.filename}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <Avatar userId={att.uploadedBy} size={16} />
                  <span>{uploader?.name}</span>
                  <span>·</span>
                  <span>{new Date(att.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add Files tab to ProjectLayout**

In `ProjectLayout.tsx` `viewTabs` array, add:

```typescript
{ key: 'files', label: 'Files', path: 'files' },
```

- [ ] **Step 3: Add Files route**

In `App.tsx`, inside the project route group:

```tsx
import { ProjectFilesPage } from './components/features/files/ProjectFilesPage';

// Under <Route path="/project/:projectId">:
<Route path="files" element={<ProjectFilesPage />} />
```

- [ ] **Step 4: Verify and commit**

```bash
cd app/frontend/asana-clone && npx tsc --noEmit
git add -A && git commit -m "feat: add project files tab showing task attachments"
```

---

## Task 8: Starred/Favorite Projects in Sidebar

Real Asana lets you star projects that appear in a "Starred" section at the top of the sidebar. The clone doesn't have this.

**Files:**
- Modify: `app/frontend/asana-clone/src/types/index.ts` (no change needed, we'll use a string array)
- Modify: `app/frontend/asana-clone/src/data/store.ts` (add favorites to project store)
- Modify: `app/frontend/asana-clone/src/data/AppContext.tsx` (wire favorites)
- Modify: `app/frontend/asana-clone/src/components/layout/Sidebar.tsx` (add Starred section)
- Modify: `app/frontend/asana-clone/src/components/features/projects/ProjectLayout.tsx` (add star button)

- [ ] **Step 1: Add favorites state to project store**

In `store.ts` inside `useProjectStore` (or as a separate store), add:

```typescript
const [favoriteProjectIds, setFavoriteProjectIds] = useState<string[]>(() =>
  loadFromStorage('asana_favorites', [])
);

useEffect(() => { saveToStorage('asana_favorites', favoriteProjectIds); }, [favoriteProjectIds]);

const toggleFavorite = useCallback((projectId: string) => {
  setFavoriteProjectIds(prev =>
    prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
  );
}, []);
```

Return `favoriteProjectIds` and `toggleFavorite`.

- [ ] **Step 2: Wire into AppContext**

Add `favoriteProjectIds` and `toggleFavorite` to context.

- [ ] **Step 3: Add Starred section in Sidebar**

In `Sidebar.tsx`, before the "WORK" section with projects, add a "STARRED" section:

```tsx
const { favoriteProjectIds, toggleFavorite, projects } = useApp();
const favoriteProjects = projects.filter(p => favoriteProjectIds.includes(p.id));

// In the sidebar JSX, before the WORK projects section:
{favoriteProjects.length > 0 && (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      Starred
    </div>
    {favoriteProjects.map(p => (
      // Same project link style as WORK section
      <NavLink key={p.id} to={`/project/${p.id}`} ...>
        <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" />
        {p.name}
      </NavLink>
    ))}
  </div>
)}
```

- [ ] **Step 4: Add star toggle to ProjectLayout header**

In `ProjectLayout.tsx`, near the project name, add a star button:

```tsx
import { Star } from 'lucide-react';

const { favoriteProjectIds, toggleFavorite } = useApp();
const isFavorited = favoriteProjectIds.includes(project.id);

// Next to the project name:
<button
  onClick={() => toggleFavorite(project.id)}
  style={{ display: 'flex', padding: 4, cursor: 'pointer' }}
>
  <Star
    size={16}
    fill={isFavorited ? 'var(--color-warning)' : 'transparent'}
    stroke={isFavorited ? 'var(--color-warning)' : 'var(--text-placeholder)'}
  />
</button>
```

- [ ] **Step 5: Verify and commit**

```bash
cd app/frontend/asana-clone && npx tsc --noEmit
git add -A && git commit -m "feat: add starred/favorite projects in sidebar"
```

---

## Task 9: Expand Create Menu with Portfolio, Goal, Message Options

Real Asana's Create button opens a menu with: Task, Project, Message, Portfolio, Goal, Invite. The clone likely only has Task and Project.

**Files:**
- Modify: `app/frontend/asana-clone/src/components/layout/Topbar.tsx` (expand create menu)

- [ ] **Step 1: Read Topbar.tsx to find the Create menu**

Read the current Create dropdown implementation to understand its structure.

- [ ] **Step 2: Add new menu items**

Add these items to the Create dropdown, following the existing item pattern:

```tsx
{ label: 'Message', icon: <MessageSquare size={16} />, onClick: () => navigate('/project/' + firstProjectId + '/messages') },
{ label: 'Portfolio', icon: <Briefcase size={16} />, onClick: () => navigate('/portfolios') },
{ label: 'Goal', icon: <Target size={16} />, onClick: () => navigate('/goals') },
```

Import `MessageSquare`, `Briefcase`, `Target` from lucide-react.

The "navigate to page" approach matches the clone's pattern (no modal for portfolio/goal creation; the pages themselves have create forms now from Tasks 4 and 5).

- [ ] **Step 3: Verify and commit**

```bash
cd app/frontend/asana-clone && npx tsc --noEmit
git add -A && git commit -m "feat: expand create menu with portfolio, goal, message options"
```

---

## Task 10: Task Visibility Setting

Real Asana lets you set task visibility to "My workspace" or "Only me" via a dropdown. The clone shows a static "visible to everyone" notice but no toggle.

**Files:**
- Modify: `app/frontend/asana-clone/src/types/index.ts` (add `visibility` field to Task)
- Modify: `app/frontend/asana-clone/src/data/store.ts` (default visibility)
- Modify: `app/frontend/asana-clone/src/components/features/taskdetail/TaskDetailPane.tsx` (add visibility dropdown)

- [ ] **Step 1: Add visibility to Task type**

In `types/index.ts`, add to the Task interface:

```typescript
visibility?: 'workspace' | 'private';
```

- [ ] **Step 2: Default visibility in store**

In `store.ts` where new tasks are created (`addTask`), add `visibility: 'workspace'` to defaults.

- [ ] **Step 3: Add visibility toggle in TaskDetailPane**

Replace the static visibility notice (around line 339) with an interactive dropdown:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
  <select
    value={task.visibility || 'workspace'}
    onChange={e => updateTask(task.id, { visibility: e.target.value as 'workspace' | 'private' })}
    style={{
      fontSize: 12, color: 'var(--text-secondary)', background: 'transparent',
      border: 'none', cursor: 'pointer', padding: '2px 0',
    }}
  >
    <option value="workspace">Visible to everyone in My workspace</option>
    <option value="private">Only visible to me</option>
  </select>
  <Info size={12} strokeWidth={1.8} style={{ color: 'var(--text-placeholder)' }} />
</div>
```

- [ ] **Step 4: Verify and commit**

```bash
cd app/frontend/asana-clone && npx tsc --noEmit
git add -A && git commit -m "feat: add task visibility toggle (workspace/private)"
```

---

## Summary of All Tasks

| # | Feature | Priority | Est. Complexity |
|---|---------|----------|-----------------|
| 1 | Task Dependencies UI | High | Medium |
| 2 | Subtasks Section | High | Medium |
| 3 | Rich Text Description Editor | High | Medium |
| 4 | Goals Page CRUD | High | Large |
| 5 | Portfolios Page CRUD | High | Large |
| 6 | Messages Page | High | Medium |
| 7 | Project Files Tab | Medium | Small |
| 8 | Starred/Favorite Projects | Medium | Small |
| 9 | Expand Create Menu | Medium | Small |
| 10 | Task Visibility Setting | Medium | Small |

Tasks 1-6 are high priority and close the biggest gaps vs. real Asana. Tasks 7-10 are medium priority polish items. All tasks are independent and can be executed in any order or in parallel.
