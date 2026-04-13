import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../../../data/AppContext';
import { Checkbox } from '../../common/Checkbox';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';
import type { ViewType } from '../../../types';

const viewTabs: { key: ViewType | string; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'list', label: 'List' },
  { key: 'board', label: 'Board' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'workflow', label: 'Workflow' },
  { key: 'messages', label: 'Messages' },
  { key: 'files', label: 'Files' },
];

export function ProjectListView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { tasks, sections, completeTask, addTask, setSelectedTaskId, setSelectedTasks, selectedTasks, seed } = useApp();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [view, setView] = useState('list');

  const project = seed.projects.find(p => p.id === projectId);
  if (!project) return <div style={{ padding: 32, color: 'var(--text-secondary)' }}>Project not found</div>;

  const projectSections = sections.filter(s => s.projectId === projectId).sort((a, b) => a.position - b.position);
  const projectTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);
  const members = seed.teamMembers.filter(tm => tm.teamId === project.teamId).map(tm => tm.userId);

  const toggleCollapse = (id: string) => setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAdd = (sectionId: string) => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), sectionId, projectId: project.id });
    setNewTitle('');
    setAddingTo(null);
  };

  const handleViewChange = (v: string) => {
    setView(v);
    if (v === 'board') navigate(`/project/${projectId}/board`);
    else if (v === 'overview') navigate(`/project/${projectId}/overview`);
    else if (v === 'timeline') navigate(`/project/${projectId}/timeline`);
    else if (v === 'dashboard') navigate(`/project/${projectId}/dashboard`);
    else if (v === 'calendar') navigate(`/project/${projectId}/calendar`);
    else if (v === 'workflow') navigate(`/project/${projectId}/workflow`);
    else if (v === 'messages') navigate(`/project/${projectId}/messages`);
  };

  const now = new Date('2026-04-13');

  return (
    <div>
      {/* Project header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>{project.icon}</span>
        <h1 style={{ font: 'var(--font-h1)' }}>{project.name}</h1>
        <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>▾</span>
        <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>⭐</span>
        <a style={{ color: 'var(--text-link)', fontSize: 12, cursor: 'pointer' }}>Set status</a>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {members.slice(0, 3).map(uid => <Avatar key={uid} userId={uid} size={24} />)}
        </div>
        <button style={{ padding: '4px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>Share</button>
        <button style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}>⋯</button>
        <button style={{ padding: '4px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>Customize</button>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-divider)', marginBottom: 12 }}>
        {viewTabs.map(vt => (
          <button key={vt.key} onClick={() => handleViewChange(vt.key)} style={{
            padding: '8px 12px', fontSize: 13,
            color: view === vt.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: view === vt.key ? '2px solid var(--color-primary)' : '2px solid transparent',
          }}>
            {vt.label}
          </button>
        ))}
        <button style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-placeholder)' }}>+</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setAddingTo(projectSections[0]?.id)} style={{
          color: 'var(--color-primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4
        }}>+ Add task</button>
        <div style={{ flex: 1 }} />
        <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Filter</button>
        <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sort</button>
        <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Group</button>
        <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⋯</button>
        <span style={{ color: 'var(--text-placeholder)', fontSize: 14 }}>🔍</span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '30px 30px 1fr 100px 120px 80px 80px 30px',
        gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-table)', fontSize: 12, color: 'var(--text-secondary)',
      }}>
        <span></span><span></span><span>Name</span><span>Assignee</span><span>Due date</span><span>Priority</span><span>Status</span><span>+</span>
      </div>

      {/* Sections */}
      {projectSections.map(section => {
        const sectionTasks = projectTasks.filter(t => t.sectionId === section.id);
        return (
          <div key={section.id} style={{ marginBottom: 4 }}>
            <button onClick={() => toggleCollapse(section.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', width: '100%',
            }}>
              <span style={{ transform: collapsed.has(section.id) ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', fontSize: 10 }}>▼</span>
              {section.name}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12 }}>({sectionTasks.length})</span>
            </button>

            {!collapsed.has(section.id) && (
              <>
                {sectionTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    style={{
                      display: 'grid', gridTemplateColumns: '30px 30px 1fr 100px 120px 80px 80px 30px',
                      gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
                      cursor: 'pointer', fontSize: 13,
                      background: selectedTasks.includes(task.id) ? 'var(--bg-sidebar-selected)' : undefined,
                    }}
                    onMouseEnter={e => { if (!selectedTasks.includes(task.id)) e.currentTarget.style.background = 'var(--bg-row-hover)'; }}
                    onMouseLeave={e => { if (!selectedTasks.includes(task.id)) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <input type="checkbox" checked={selectedTasks.includes(task.id)} onChange={() => setSelectedTasks(prev => prev.includes(task.id) ? prev.filter(x => x !== task.id) : [...prev, task.id])} onClick={e => e.stopPropagation()} style={{ width: 14, height: 14, accentColor: 'var(--color-primary)' }} />
                    <Checkbox checked={task.completed} onChange={() => completeTask(task.id)} />
                    <span className="truncate" style={{ textDecoration: task.completed ? 'line-through' : undefined, color: task.completed ? 'var(--text-secondary)' : undefined }}>{task.title}</span>
                    <Avatar userId={task.assigneeId} size={20} />
                    <span style={{ fontSize: 11, color: task.dueDate && new Date(task.dueDate) < now && !task.completed ? 'var(--color-error)' : 'var(--text-secondary)' }}>
                      {task.dueDate ? (task.startDate ? `${new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ` : '') + new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                    {task.customFieldValues.cf1 ? <StatusBadge status={task.customFieldValues.cf1} /> : <span>—</span>}
                    {task.customFieldValues.cf2 ? <StatusBadge status={task.customFieldValues.cf2} /> : <span>—</span>}
                    <span></span>
                  </div>
                ))}

                {addingTo === section.id && (
                  <div style={{ display: 'grid', gridTemplateColumns: '30px 30px 1fr', gap: 8, padding: '6px 0', alignItems: 'center' }}>
                    <span /><Checkbox checked={false} onChange={() => {}} />
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(section.id); if (e.key === 'Escape') setAddingTo(null); }}
                      onBlur={() => { if (newTitle.trim()) handleAdd(section.id); else setAddingTo(null); }}
                      placeholder="Write a task name" style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: 13, color: 'var(--text-primary)' }}
                    />
                  </div>
                )}
                <button onClick={() => setAddingTo(section.id)} style={{ color: 'var(--text-placeholder)', fontSize: 12, padding: '4px 0 4px 68px' }}>
                  Add task...
                </button>
              </>
            )}
          </div>
        );
      })}

      <button style={{ color: 'var(--text-placeholder)', fontSize: 13, padding: '12px 0' }}>
        + Add section
      </button>
    </div>
  );
}
