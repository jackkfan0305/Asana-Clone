import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { currentUserId, users } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { Checkbox } from '../../common/Checkbox';
import { Badge } from '../../common/Badge';
import { useState, useRef, useEffect } from 'react';
import { Lock, Check, Users as UsersIcon, MoreHorizontal, ChevronDown } from 'lucide-react';

export function HomePage() {
  const { tasks, completeTask, setSelectedTaskId, seed } = useApp();
  const navigate = useNavigate();
  const user = users.find(u => u.id === currentUserId)!;
  const myTasks = tasks.filter(t => t.assigneeId === currentUserId && !t.parentTaskId);
  const [tab, setTab] = useState<'upcoming' | 'overdue' | 'completed'>('upcoming');
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTimeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const now = new Date('2026-04-13');
  const upcoming = myTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= now);
  const overdue = myTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now);
  const completed = myTasks.filter(t => t.completed);
  const tabTasks = tab === 'upcoming' ? upcoming : tab === 'overdue' ? overdue : completed;

  const completedCount = myTasks.filter(t => t.completed).length;
  const collaborators = new Set(tasks.filter(t => t.assigneeId && t.assigneeId !== currentUserId).map(t => t.assigneeId)).size;

  // Format like real Asana: "Monday, April 13"
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const learnCards = [
    { title: 'Getting Started', duration: '3 min', emoji: '🚀' },
    { title: 'Task Management', duration: '5 min read', emoji: '✏️' },
    { title: 'Team Collaboration', duration: '15 min', emoji: '🤝' },
    { title: 'Advanced Features', duration: '5 m...', emoji: '⚡' },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* Greeting row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, marginBottom: 2 }}>{dateStr}</p>
          <h1 style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.2 }}>
            Good afternoon, {user.name.split(' ')[0]}
          </h1>
        </div>

        {/* Stats bar — matching image-v13 exactly */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          {/* Stats group */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-btn)',
            border: '1px solid var(--border-default)',
            overflow: 'hidden',
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

          {/* Customize button — separate from stats group */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            color: 'var(--text-primary)', fontSize: 13,
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-btn)',
            border: '1px solid #4a4b4d',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Colorful 4-square grid icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0.5" y="0.5" width="5" height="5" rx="1" fill="#e8744f" />
              <rect x="8" y="0.5" width="5" height="5" rx="1" fill="#f5d365" />
              <rect x="0.5" y="8" width="5" height="5" rx="1" fill="#4ecbc4" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#7c6de6" />
            </svg>
            Customize
          </button>
        </div>
      </div>

      {/* My tasks widget */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-card)',
        padding: '16px 20px', marginBottom: 32,
        border: '1px solid var(--border-default)',
      }}>
        {/* Widget header — avatar + "My tasks" + lock + ... menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Avatar userId={currentUserId} size={28} />
          <span style={{ fontWeight: 500, fontSize: 15 }}>My tasks</span>
          <Lock size={13} strokeWidth={1.8} style={{ color: 'var(--text-placeholder)' }} />
          <div style={{ flex: 1 }} />
          <button style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Tabs — Upcoming | Overdue | Completed */}
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

        {/* "+ Create task" link */}
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
            const project = seed.projects.find(p => p.id === task.projectId);
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

      {/* Learn Asana — dark coral/magenta cards */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-card)',
        padding: '16px 20px',
        border: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>Learn Asana</h2>
          <button style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
            <MoreHorizontal size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
          {learnCards.map(card => (
            <div key={card.title} style={{
              flex: '1 1 0', minWidth: 160, borderRadius: 'var(--radius-card)', overflow: 'hidden',
              cursor: 'pointer',
            }}>
              {/* Dark coral/magenta thumbnail */}
              <div style={{
                height: 120,
                background: 'linear-gradient(145deg, #5c1a2a, #7a2040)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40, position: 'relative',
              }}>
                <span>{card.emoji}</span>
                {/* Duration badge */}
                <span style={{
                  position: 'absolute', bottom: 8, left: 8,
                  background: 'rgba(0,0,0,0.5)', color: '#fff',
                  padding: '2px 6px', borderRadius: 4, fontSize: 10,
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  ⏱ {card.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
