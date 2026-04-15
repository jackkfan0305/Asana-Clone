import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { currentUserId, users } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { Checkbox } from '../../common/Checkbox';
import { Badge } from '../../common/Badge';
import { useState, useRef, useEffect } from 'react';
import { Lock, Check, Users as UsersIcon, MoreHorizontal, ChevronDown, Plus, Eye, Trash2 } from 'lucide-react';

export function HomePage() {
  const { tasks, completeTask, setSelectedTaskId, projects } = useApp();
  const navigate = useNavigate();
  const user = users.find(u => u.id === currentUserId)!;
  const myTasks = tasks.filter(t => t.assigneeId === currentUserId && !t.parentTaskId);
  const [tab, setTab] = useState<'upcoming' | 'overdue' | 'completed'>('upcoming');
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Widget state
  const [tasksMenuOpen, setTasksMenuOpen] = useState(false);
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);
  const [tasksSize, setTasksSize] = useState<'half' | 'full'>('full');
  const [projectsSize, setProjectsSize] = useState<'half' | 'full'>('full');
  const [showTasks, setShowTasks] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const tasksMenuRef = useRef<HTMLDivElement>(null);
  const projectsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTimeDropdownOpen(false);
      }
      if (tasksMenuRef.current && !tasksMenuRef.current.contains(e.target as Node)) {
        setTasksMenuOpen(false);
      }
      if (projectsMenuRef.current && !projectsMenuRef.current.contains(e.target as Node)) {
        setProjectsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const now = new Date();
  const upcoming = myTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= now);
  const overdue = myTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now);
  const completed = myTasks.filter(t => t.completed);
  const tabTasks = tab === 'upcoming' ? upcoming : tab === 'overdue' ? overdue : completed;

  const completedCount = myTasks.filter(t => t.completed).length;
  const collaborators = new Set(tasks.filter(t => t.assigneeId && t.assigneeId !== currentUserId).map(t => t.assigneeId)).size;

  // Format like real Asana: "Monday, April 13"
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Dynamic greeting based on time of day
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const menuItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px', width: '100%', textAlign: 'left',
    fontSize: 13, color: 'var(--text-primary)',
  };

  const handleNewProject = () => {
    setProjectsMenuOpen(false);
    navigate('/create-project');
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Greeting row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        paddingBottom: 16, marginBottom: 24,
      }}>
        <div>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, marginBottom: 2 }}>{dateStr}</p>
          <h1 style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.2 }}>
            {greeting}, {user.name.split(' ')[0]}
          </h1>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-btn)',
            border: '1px solid var(--border-default)',
          }}>
            {/* My week/month dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setTimeDropdownOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 400,
                  borderRight: '1px solid var(--border-default)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                My {timeRange}
                <ChevronDown size={12} strokeWidth={2} />
              </button>
              {timeDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4,
                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-card)', padding: '4px 0',
                  boxShadow: 'var(--shadow-dropdown)', zIndex: 10, minWidth: 140,
                }}>
                  {(['week', 'month'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setTimeRange(opt); setTimeDropdownOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px', width: '100%', textAlign: 'left',
                        fontSize: 14, color: 'var(--text-primary)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {timeRange === opt && <Check size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />}
                      {timeRange !== opt && <span style={{ width: 14 }} />}
                      My {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks completed */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRight: '1px solid var(--border-default)',
            }}>
              <Check size={13} strokeWidth={2.5} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontWeight: 500 }}>{completedCount}</span>
              <span style={{ color: 'var(--text-secondary)' }}>tasks completed</span>
            </div>

            {/* Collaborators */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            }}>
              <UsersIcon size={13} strokeWidth={1.8} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontWeight: 500 }}>{collaborators}</span>
              <span style={{ color: 'var(--text-secondary)' }}>collaborators</span>
            </div>
          </div>

        </div>
      </div>
      {/* Widgets row — side by side when both half size */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        {/* My tasks widget */}
        {showTasks && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-card)',
            padding: '16px 20px',
            border: '1px solid var(--border-default)',
            flex: tasksSize === 'half' ? '0 0 calc(50% - 8px)' : '1 1 100%',
            minWidth: 0,
          }}>
            {/* Widget header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Avatar userId={currentUserId} size={28} />
              <span style={{ fontWeight: 500, fontSize: 15 }}>My tasks</span>
              <Lock size={13} strokeWidth={1.8} style={{ color: 'var(--text-placeholder)' }} />
              <div style={{ flex: 1 }} />
              <div ref={tasksMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setTasksMenuOpen(v => !v)}
                  style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4 }}
                >
                  <MoreHorizontal size={16} />
                </button>
                {tasksMenuOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 4,
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-card)', padding: '4px 0',
                    boxShadow: 'var(--shadow-dropdown)', zIndex: 20, minWidth: 200,
                  }}>
                    <button
                      onClick={() => { navigate('/my-tasks'); setTasksMenuOpen(false); }}
                      style={menuItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                      Create task
                    </button>
                    <button
                      onClick={() => { navigate('/my-tasks'); setTasksMenuOpen(false); }}
                      style={menuItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Eye size={14} strokeWidth={1.8} style={{ color: 'var(--text-secondary)' }} />
                      View all my tasks
                    </button>
                    <div style={{ height: 1, background: 'var(--border-divider)', margin: '4px 0' }} />
                    <button
                      onClick={() => { setTasksSize('half'); setTasksMenuOpen(false); }}
                      style={menuItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {tasksSize === 'half' ? <Check size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} /> : <span style={{ width: 14 }} />}
                      Half size
                    </button>
                    <button
                      onClick={() => { setTasksSize('full'); setTasksMenuOpen(false); }}
                      style={menuItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {tasksSize === 'full' ? <Check size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} /> : <span style={{ width: 14 }} />}
                      Full size
                    </button>
                    <div style={{ height: 1, background: 'var(--border-divider)', margin: '4px 0' }} />
                    <button
                      onClick={() => { setShowTasks(false); setTasksMenuOpen(false); }}
                      style={{ ...menuItemStyle, color: '#e8744f' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={14} strokeWidth={1.8} style={{ color: '#e8744f' }} />
                      Remove widget
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
              {(['upcoming', 'overdue', 'completed'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '6px 14px 10px',
                    fontSize: 13,
                    color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                    fontWeight: tab === t ? 500 : 400,
                    marginBottom: -1,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--border-divider)', marginBottom: 4 }} />

            <button
              onClick={() => navigate('/my-tasks')}
              style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '6px 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              + Create task
            </button>

            {/* Task list */}
            <div>
              {tabTasks.length === 0 && (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <Check size={40} strokeWidth={1} style={{ color: 'var(--text-placeholder)', marginBottom: 8 }} />
                  <p style={{ color: 'var(--text-placeholder)', fontSize: 13 }}>
                    {tab === 'overdue' ? "You don't have any overdue tasks. Nice!" : 'No tasks'}
                  </p>
                </div>
              )}
              {tabTasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 0',
                      borderBottom: '1px solid var(--border-divider)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Checkbox checked={task.completed} onChange={() => completeTask(task.id)} />
                    <span className="truncate" style={{
                      flex: 1, fontSize: 13,
                      textDecoration: task.completed ? 'line-through' : undefined,
                      color: task.completed ? 'var(--text-secondary)' : undefined,
                    }}>{task.title}</span>
                    {project && <Badge label={project.name} color={project.color} size="sm" />}
                    {task.dueDate && (
                      <span style={{
                        fontSize: 11,
                        color: new Date(task.dueDate) < now && !task.completed ? 'var(--color-error)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}>
                        {task.startDate
                          ? `${new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Projects widget */}
        {showProjects && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-card)',
            padding: '16px 20px',
            border: '1px solid var(--border-default)',
            flex: projectsSize === 'half' ? '0 0 calc(50% - 8px)' : '1 1 100%',
            minWidth: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 500 }}>Projects</h2>
              <button style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                Recents <ChevronDown size={10} strokeWidth={2} />
              </button>
              <div style={{ flex: 1 }} />
              <div ref={projectsMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setProjectsMenuOpen(v => !v)}
                  style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4 }}
                >
                  <MoreHorizontal size={16} />
                </button>
                {projectsMenuOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 4,
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-card)', padding: '4px 0',
                    boxShadow: 'var(--shadow-dropdown)', zIndex: 20, minWidth: 200,
                  }}>
                    <button
                      onClick={handleNewProject}
                      style={menuItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                      New project
                    </button>
                    <div style={{ height: 1, background: 'var(--border-divider)', margin: '4px 0' }} />
                    <button
                      onClick={() => { setProjectsSize('half'); setProjectsMenuOpen(false); }}
                      style={menuItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {projectsSize === 'half' ? <Check size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} /> : <span style={{ width: 14 }} />}
                      Half size
                    </button>
                    <button
                      onClick={() => { setProjectsSize('full'); setProjectsMenuOpen(false); }}
                      style={menuItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {projectsSize === 'full' ? <Check size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} /> : <span style={{ width: 14 }} />}
                      Full size
                    </button>
                    <div style={{ height: 1, background: 'var(--border-divider)', margin: '4px 0' }} />
                    <button
                      onClick={() => { setShowProjects(false); setProjectsMenuOpen(false); }}
                      style={{ ...menuItemStyle, color: '#e8744f' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={14} strokeWidth={1.8} style={{ color: '#e8744f' }} />
                      Remove widget
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Create project card */}
              <div
                onClick={handleNewProject}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', padding: '8px 4px', minWidth: 180,
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 8,
                  border: '2px dashed var(--border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)', fontSize: 20,
                }}>+</div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Create project</span>
              </div>

              {/* Existing projects */}
              {projects.map(p => {
                const projectTasks = tasks.filter(t => t.projectId === p.id && !t.completed && t.dueDate);
                const dueSoonCount = projectTasks.filter(t => {
                  const due = new Date(t.dueDate!);
                  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                  return diff >= 0 && diff <= 7;
                }).length;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/project/${p.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer', padding: '8px 4px', minWidth: 180,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: p.color || '#a0d1c4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="4" width="16" height="2.5" rx="1" fill="rgba(255,255,255,0.9)" />
                        <rect x="4" y="9" width="16" height="2.5" rx="1" fill="rgba(255,255,255,0.9)" />
                        <rect x="4" y="14" width="16" height="2.5" rx="1" fill="rgba(255,255,255,0.9)" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {dueSoonCount > 0
                          ? `${dueSoonCount} task${dueSoonCount !== 1 ? 's' : ''} due soon`
                          : `${projectTasks.length} task${projectTasks.length !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
