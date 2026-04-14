import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { CheckCircle, Folder, MoreHorizontal, X, Search, Trash2, Clock } from 'lucide-react';

type FilterType = 'tasks' | 'projects' | null;

const FILTER_PILLS: { type: FilterType; label: string; icon: React.ReactNode }[] = [
  { type: 'tasks', label: 'Tasks', icon: <CheckCircle size={13} strokeWidth={2} /> },
  { type: 'projects', label: 'Projects', icon: <Folder size={13} strokeWidth={2} /> },
];

const TASK_SUB_FILTERS = ['In project', 'Assigned to', 'With collaborators'];
const PROJECT_SUB_FILTERS = ['Owned by', 'In team', 'Status'];

function getSubFilters(type: FilterType): string[] {
  switch (type) {
    case 'tasks': return TASK_SUB_FILTERS;
    case 'projects': return PROJECT_SUB_FILTERS;
    default: return [];
  }
}

export function SearchOverlay() {
  const { searchQuery, setSearchQuery, setSearchOpen, tasks, setSelectedTaskId, projects } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const query = searchQuery.trim().toLowerCase();

  const filteredTasks = useMemo(() => {
    if (activeFilter && activeFilter !== 'tasks') return [];
    return tasks.filter(t =>
      !t.parentTaskId && (query.length === 0 || t.title.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [tasks, query, activeFilter]);

  const filteredProjects = useMemo(() => {
    if (activeFilter && activeFilter !== 'projects') return [];
    return projects.filter(p =>
      query.length === 0 || p.name.toLowerCase().includes(query)
    );
  }, [projects, query, activeFilter]);

  const hasResults = filteredTasks.length > 0 || filteredProjects.length > 0;

  const close = () => { setSearchOpen(false); setSearchQuery(''); };

  const navigateTo = (path: string) => { close(); navigate(path); };

  const handleFilterClick = (type: FilterType) => {
    if (activeFilter === type) {
      setActiveFilter(null);
      setActiveSubFilter(null);
    } else {
      setActiveFilter(type);
      setActiveSubFilter(null);
    }
  };

  // Build "Recents" from store data when no query
  const recents = useMemo(() => {
    if (query.length > 0) return [];
    const items: { id: string; type: string; name: string; subtitle?: string; color?: string; onClick: () => void }[] = [];

    // Add some tasks
    if (!activeFilter || activeFilter === 'tasks') {
      tasks.filter(t => !t.parentTaskId && !t.completed).slice(0, 3).forEach(t => {
        const proj = projects.find(p => p.id === t.projectId);
        items.push({
          id: t.id, type: 'task', name: t.title,
          subtitle: proj ? proj.name : undefined,
          color: proj?.color,
          onClick: () => { setSelectedTaskId(t.id); close(); },
        });
      });
    }

    // Add projects
    if (!activeFilter || activeFilter === 'projects') {
      projects.slice(0, 3).forEach(p => {
        items.push({
          id: p.id, type: 'project', name: p.name,
          subtitle: p.description ? p.description.slice(0, 50) : undefined,
          color: p.color,
          onClick: () => navigateTo(`/project/${p.id}`),
        });
      });
    }

    return items;
  }, [query, activeFilter, tasks, projects]);

  const pillStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', borderRadius: 16,
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    border: active ? '1px solid var(--color-primary)' : '1px solid var(--border-default)',
    background: active ? 'rgba(69, 115, 210, 0.15)' : 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  });

  const subPillStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '5px 12px', borderRadius: 16,
    fontSize: 13, fontWeight: 400, cursor: 'pointer',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
    cursor: 'pointer', borderRadius: 6, fontSize: 13,
  };

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'var(--bg-row-hover)'; },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'transparent'; },
  };

  const statusDot = (status: string) => {
    const color = status === 'on_track' ? 'var(--color-success)' : status === 'at_risk' ? '#f1bd6c' : '#e8384f';
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'var(--bg-modal-overlay)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', paddingTop: 60,
      }}
      onClick={close}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: 580, maxHeight: '75vh', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-modal)', boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Search input */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-divider)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} strokeWidth={2} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-placeholder)',
            }} />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              style={{
                width: '100%', padding: '8px 12px 8px 32px', fontSize: 14,
                background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                borderRadius: 6, color: 'var(--text-primary)',
              }}
              onKeyDown={e => { if (e.key === 'Escape') close(); }}
            />
          </div>
        </div>

        {/* Filter pills row */}
        <div style={{
          padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6,
          borderBottom: '1px solid var(--border-divider)', flexWrap: 'wrap',
        }}>
          {activeFilter ? (
            <>
              {/* Active filter pill with X */}
              <button
                onClick={() => handleFilterClick(activeFilter)}
                style={pillStyle(true)}
              >
                {FILTER_PILLS.find(f => f.type === activeFilter)?.icon}
                {FILTER_PILLS.find(f => f.type === activeFilter)?.label}
                <X size={12} strokeWidth={2.5} style={{ marginLeft: 2 }} />
              </button>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 4px' }} />

              {/* Sub-filter pills */}
              {getSubFilters(activeFilter).map(sf => (
                <button
                  key={sf}
                  onClick={() => setActiveSubFilter(activeSubFilter === sf ? null : sf)}
                  style={activeSubFilter === sf ? pillStyle(true) : subPillStyle}
                  onMouseEnter={e => {
                    if (activeSubFilter !== sf) e.currentTarget.style.background = 'var(--bg-row-hover)';
                  }}
                  onMouseLeave={e => {
                    if (activeSubFilter !== sf) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {sf}
                </button>
              ))}
            </>
          ) : (
            <>
              {FILTER_PILLS.map(f => (
                <button
                  key={f.type}
                  onClick={() => handleFilterClick(f.type)}
                  style={pillStyle(false)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-row-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
              <button
                style={{ ...subPillStyle, padding: '5px 8px' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-row-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <MoreHorizontal size={14} strokeWidth={2} />
                More
              </button>
            </>
          )}
        </div>

        {/* Results / Recents area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
          {/* No query: show recents */}
          {query.length === 0 && recents.length > 0 && (
            <>
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-placeholder)', fontWeight: 600, letterSpacing: 0.5 }}>
                Recents
              </div>
              {recents.map(item => (
                <div key={item.id} style={rowStyle} {...hoverHandlers} onClick={item.onClick}>
                  {item.type === 'project' ? (
                    <Folder size={16} strokeWidth={1.5} style={{ color: item.color || 'var(--text-tertiary)' }} />
                  ) : (
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      border: '2px solid var(--border-input)', display: 'inline-block',
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</div>
                    {item.subtitle && (
                      <div className="truncate" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {item.type === 'task' && item.color && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        )}
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                    {item.type === 'task' && <Clock size={14} strokeWidth={1.5} />}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Query results */}
          {query.length > 0 && (
            <>
              {filteredProjects.length > 0 && (
                <>
                  <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-placeholder)', fontWeight: 600, letterSpacing: 0.5 }}>
                    Projects
                  </div>
                  {filteredProjects.map(p => (
                    <div key={p.id} style={rowStyle} {...hoverHandlers}
                      onClick={() => navigateTo(`/project/${p.id}`)}>
                      <Folder size={16} strokeWidth={1.5} style={{ color: p.color || 'var(--text-tertiary)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="truncate" style={{ fontSize: 13 }}>{p.name}</div>
                      </div>
                      {statusDot(p.status)}
                    </div>
                  ))}
                </>
              )}

              {filteredTasks.length > 0 && (
                <>
                  <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-placeholder)', fontWeight: 600, letterSpacing: 0.5 }}>
                    Tasks
                  </div>
                  {filteredTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <div key={task.id} style={rowStyle} {...hoverHandlers}
                        onClick={() => { setSelectedTaskId(task.id); close(); }}>
                        <span style={{
                          width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${task.completed ? 'var(--color-success)' : 'var(--border-input)'}`,
                          background: task.completed ? 'var(--color-success)' : 'transparent',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="truncate" style={{ fontSize: 13 }}>{task.title}</div>
                          {project && (
                            <div className="truncate" style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
                              {project.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {!hasResults && (
                <p style={{ textAlign: 'center', color: 'var(--text-placeholder)', padding: 24, fontSize: 13 }}>
                  No results found
                </p>
              )}
            </>
          )}

          {/* Deleted */}
          {query.length === 0 && (
            <div style={{ ...rowStyle, gap: 8, marginTop: 8 }} {...hoverHandlers}>
              <Trash2 size={14} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Deleted</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px', borderTop: '1px solid var(--border-divider)',
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>
            ↵ to select · esc to close
          </span>
        </div>
      </div>
    </div>
  );
}
