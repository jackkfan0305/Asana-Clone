import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../data/AppContext';
import { Checkbox } from '../../common/Checkbox';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';
import {
  Filter, ArrowUpDown, Group, Search, Plus, X, GripVertical,
} from 'lucide-react';

type SortField = 'none' | 'start_date' | 'due_date' | 'created_on' | 'alphabetical';
type GroupField = 'sections' | 'none';

/* ─── Filter Panel ─── */
function FilterPanel({ filters, setFilters, onClose }: {
  filters: { incomplete: boolean; completed: boolean; dueThisWeek: boolean; dueNextWeek: boolean };
  setFilters: (f: typeof filters) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const toggle = (key: keyof typeof filters) => setFilters({ ...filters, [key]: !filters[key] });

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 12, width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Filters</span>
        <button onClick={() => setFilters({ incomplete: true, completed: false, dueThisWeek: false, dueNextWeek: false })} style={{ fontSize: 12, color: 'var(--text-link)' }}>Clear</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Quick filters</div>
      {([
        ['incomplete', 'Incomplete tasks'],
        ['completed', 'Completed tasks'],
        ['dueThisWeek', 'Due this week'],
        ['dueNextWeek', 'Due next week'],
      ] as const).map(([key, label]) => (
        <button key={key} onClick={() => toggle(key)} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', width: '100%',
          borderRadius: 4, fontSize: 13, color: 'var(--text-primary)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 16, height: 16, borderRadius: 3,
            border: filters[key] ? 'none' : '1px solid var(--border-input)',
            background: filters[key] ? '#4E72CA' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#fff',
          }}>
            {filters[key] && <span>&#10003;</span>}
          </div>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Sort Panel ─── */
function SortPanel({ sort, setSort, onClose }: { sort: SortField; setSort: (s: SortField) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const options: { value: SortField; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'start_date', label: 'Start date' },
    { value: 'due_date', label: 'Due date' },
    { value: 'created_on', label: 'Created on' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ];

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 4, width: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => { setSort(opt.value); onClose(); }} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%',
          borderRadius: 4, fontSize: 13, color: sort === opt.value ? '#fff' : 'var(--text-primary)',
          background: sort === opt.value ? '#4E72CA' : 'transparent',
        }}
          onMouseEnter={e => { if (sort !== opt.value) e.currentTarget.style.background = 'var(--bg-sidebar-hover)'; }}
          onMouseLeave={e => { if (sort !== opt.value) e.currentTarget.style.background = 'transparent'; }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Group Panel ─── */
function GroupPanel({ group, setGroup, onClose }: { group: GroupField; setGroup: (g: GroupField) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 12, width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Groups</span>
        <button onClick={onClose} style={{ color: 'var(--text-secondary)', display: 'flex' }}><X size={14} /></button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['sections', 'none'] as const).map(opt => (
          <button key={opt} onClick={() => { setGroup(opt); onClose(); }} style={{
            padding: '5px 12px', borderRadius: 4, fontSize: 12,
            background: group === opt ? '#4E72CA' : 'var(--bg-input)',
            color: group === opt ? '#fff' : 'var(--text-primary)',
          }}>
            {opt === 'sections' ? 'Sections' : 'None'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProjectListView() {
  const { projectId } = useParams();
  const { tasks, sections, completeTask, addTask, setSelectedTaskId, updateTask, reorderTasks, projects, addSection, renameSection } = useApp();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingSectionName, setAddingSectionName] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  // Drag state
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropTargetSection, setDropTargetSection] = useState<string | null>(null);

  // Toolbar state
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ incomplete: true, completed: false, dueThisWeek: false, dueNextWeek: false });
  const [sort, setSort] = useState<SortField>('none');
  const [group, setGroup] = useState<GroupField>('sections');

  const project = projects.find(p => p.id === projectId);
  if (!project) return <div style={{ padding: 32, color: 'var(--text-secondary)' }}>Project not found</div>;

  const projectSections = sections.filter(s => s.projectId === projectId).sort((a, b) => a.position - b.position);
  const projectTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);

  const now = new Date('2026-04-13');

  const applyFiltersAndSort = (taskList: typeof projectTasks) => {
    let filtered = taskList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q));
    }
    if (!filters.incomplete && !filters.completed) {
      filtered = [];
    } else if (!filters.incomplete) {
      filtered = filtered.filter(t => t.completed);
    } else if (!filters.completed) {
      filtered = filtered.filter(t => !t.completed);
    }
    if (filters.dueThisWeek) {
      filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= new Date('2026-04-19'));
    }
    if (filters.dueNextWeek) {
      filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) >= new Date('2026-04-20') && new Date(t.dueDate) <= new Date('2026-04-26'));
    }
    if (sort !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        switch (sort) {
          case 'due_date': return (a.dueDate || '9').localeCompare(b.dueDate || '9');
          case 'start_date': return (a.startDate || '9').localeCompare(b.startDate || '9');
          case 'created_on': return a.createdAt.localeCompare(b.createdAt);
          case 'alphabetical': return a.title.localeCompare(b.title);
          default: return 0;
        }
      });
    }
    return filtered;
  };

  const toggleCollapse = (id: string) => setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleShowAddRow = (sectionId: string) => {
    setAddingToSection(sectionId);
    setNewTaskTitle('');
  };

  const handleSubmitNewTask = (sectionId: string) => {
    if (!newTaskTitle.trim()) {
      setAddingToSection(null);
      setNewTaskTitle('');
      return;
    }
    const newTask = addTask({ title: newTaskTitle.trim(), sectionId, projectId: project.id });
    setSelectedTaskId(newTask.id);
    setAddingToSection(null);
    setNewTaskTitle('');
  };


  const handleDragEnd = () => {
    setDragTaskId(null);
    setDropTargetId(null);
    setDropTargetSection(null);
  };

  const gridCols = '24px 30px 1fr 100px 120px 80px 80px';

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '12px 0' }}>
        <button onClick={() => handleShowAddRow(projectSections[0]?.id)} style={{
          display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: 'var(--text-secondary)',
          padding: '5px 12px', fontSize: 12, fontWeight: 400, borderRadius: 6,
          border: '1px solid var(--border-default)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Plus size={13} strokeWidth={2} />Add task
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
          {/* Filter */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowFilter(v => !v); setShowSort(false); setShowGroup(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
              fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Filter size={12} strokeWidth={1.8} />Filter
            </button>
            {showFilter && <FilterPanel filters={filters} setFilters={setFilters} onClose={() => setShowFilter(false)} />}
          </div>
          {/* Sort */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowSort(v => !v); setShowFilter(false); setShowGroup(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
              fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ArrowUpDown size={12} strokeWidth={1.8} />Sort
            </button>
            {showSort && <SortPanel sort={sort} setSort={setSort} onClose={() => setShowSort(false)} />}
          </div>
          {/* Group */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowGroup(v => !v); setShowFilter(false); setShowSort(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
              fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Group size={12} strokeWidth={1.8} />Group
            </button>
            {showGroup && <GroupPanel group={group} setGroup={setGroup} onClose={() => setShowGroup(false)} />}
          </div>
          {/* Search */}
          {searchOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 4, padding: '2px 6px' }}>
              <Search size={12} strokeWidth={1.8} style={{ color: 'var(--text-secondary)' }} />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                onKeyDown={e => { if (e.key === 'Escape') { setSearchQuery(''); setSearchOpen(false); } }}
                placeholder="Search tasks..."
                style={{ background: 'transparent', border: 'none', fontSize: 12, color: 'var(--text-primary)', width: 120, outline: 'none' }} />
              <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} style={{ color: 'var(--text-placeholder)', display: 'flex' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} style={{ padding: '4px 8px', color: 'var(--text-secondary)', display: 'flex', borderRadius: 'var(--radius-btn)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Search size={14} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: gridCols,
        gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-table)', fontSize: 12, color: 'var(--text-secondary)',
      }}>
        <span></span><span></span><span>Name</span><span>Assignee</span><span>Due date</span><span>Priority</span><span>Status</span>
      </div>

      {/* Empty state for new projects */}
      {projectSections.length === 0 && projectTasks.length === 0 && (
        <div>
          {[
            'e.g. Determine project goal',
            'e.g. Schedule kickoff meeting',
            'e.g. Set final deadline',
          ].map((placeholder, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: gridCols,
              gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
              fontSize: 13,
            }}>
              <span />
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: '1.5px solid var(--border-input)', flexShrink: 0,
              }} />
              <span style={{ color: 'var(--text-placeholder)' }}>{placeholder}</span>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '1.5px solid var(--border-input)',
              }} />
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '1.5px solid var(--border-input)',
              }} />
              <span />
              <span />
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {projectSections.map(section => {
        const sectionTasks = applyFiltersAndSort(projectTasks.filter(t => t.sectionId === section.id));
        const isSectionDropTarget = dropTargetSection === section.id && dragTaskId && !sectionTasks.some(t => t.id === dropTargetId);
        return (
          <div
            key={section.id}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTargetSection(section.id); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTargetSection(prev => prev === section.id ? null : prev); }}
            onDrop={e => {
              e.preventDefault();
              const fromId = e.dataTransfer.getData('text/plain');
              if (fromId && dragTaskId) {
                if (dropTargetId && dropTargetId !== fromId) {
                  // Reorder: move task to position of drop target
                  updateTask(fromId, { sectionId: section.id });
                  const ids = sectionTasks.map(t => t.id);
                  if (!ids.includes(fromId)) ids.push(fromId);
                  const fromIdx = ids.indexOf(fromId);
                  const toIdx = ids.indexOf(dropTargetId);
                  if (fromIdx !== -1 && toIdx !== -1) {
                    ids.splice(fromIdx, 1);
                    ids.splice(toIdx, 0, fromId);
                    reorderTasks(ids);
                  }
                } else {
                  // Drop onto section (no specific target task) - move to end
                  updateTask(fromId, { sectionId: section.id });
                }
              }
              handleDragEnd();
            }}
            style={{
              background: isSectionDropTarget ? 'rgba(78,114,202,0.08)' : undefined,
              borderRadius: isSectionDropTarget ? 4 : undefined,
              transition: 'background 0.15s',
            }}
          >
            {/* Section header as a cell row */}
            <div
              onClick={() => toggleCollapse(section.id)}
              style={{
                display: 'grid', gridTemplateColumns: gridCols,
                gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
                cursor: 'pointer', fontSize: 13,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ transform: collapsed.has(section.id) ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', fontSize: 10 }}>&#9660;</span>
              </span>
              <span></span>
              {editingSectionId === section.id ? (
                <input
                  autoFocus
                  value={editingSectionName}
                  onChange={e => setEditingSectionName(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const name = editingSectionName.trim() || section.name;
                      renameSection(section.id, name);
                      setEditingSectionId(null);
                    }
                    if (e.key === 'Escape') setEditingSectionId(null);
                  }}
                  onBlur={() => {
                    const name = editingSectionName.trim() || section.name;
                    renameSection(section.id, name);
                    setEditingSectionId(null);
                  }}
                  style={{
                    fontWeight: 600, fontSize: 14, color: 'var(--text-primary)',
                    background: 'transparent', border: 'none', outline: 'none',
                    padding: '0',
                  }}
                />
              ) : (
                <span
                  onClick={e => {
                    e.stopPropagation();
                    setEditingSectionId(section.id);
                    setEditingSectionName(section.name);
                  }}
                  style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', cursor: 'text' }}
                >
                  {section.name}
                </span>
              )}
              <span></span><span></span><span></span><span></span>
            </div>

            {!collapsed.has(section.id) && (
              <>
                {/* Inline add-task row at top of section */}
                {addingToSection === section.id && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: gridCols,
                    gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
                    fontSize: 13, background: 'rgba(78,114,202,0.06)',
                  }}>
                    <span />
                    <Checkbox checked={false} onChange={() => {}} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        autoFocus
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSubmitNewTask(section.id);
                          if (e.key === 'Escape') { setAddingToSection(null); setNewTaskTitle(''); }
                        }}
                        onBlur={() => handleSubmitNewTask(section.id)}
                        placeholder="Write a task name"
                        style={{
                          flex: 1, background: 'transparent', border: 'none', padding: '4px 0',
                          fontSize: 13, color: 'var(--text-primary)', outline: 'none',
                        }}
                      />
                    </div>
                    {/* Assignee placeholder */}
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: '1.5px dashed var(--border-input)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-placeholder)' }}>
                        <circle cx="8" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    {/* Due date placeholder */}
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: '1.5px dashed var(--border-input)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-placeholder)' }}>
                        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="2" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span />
                    <span />
                  </div>
                )}

                {sectionTasks.map(task => {
                  const isDragging = dragTaskId === task.id;
                  const isTaskDropTarget = dropTargetId === task.id && dragTaskId !== task.id;
                  return (
                    <div
                      key={task.id}
                      draggable={dragTaskId === task.id}
                      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.id); }}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTargetId(task.id); setDropTargetSection(section.id); }}
                      onDragLeave={() => setDropTargetId(prev => prev === task.id ? null : prev)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedTaskId(task.id)}
                      style={{
                        display: 'grid', gridTemplateColumns: gridCols,
                        gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
                        cursor: 'pointer', fontSize: 13,
                        opacity: isDragging ? 0.4 : 1,
                        borderTop: isTaskDropTarget ? '2px solid #4E72CA' : '2px solid transparent',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-row-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span
                        onMouseDown={() => setDragTaskId(task.id)}
                        onMouseUp={() => { if (!isDragging) setDragTaskId(null); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', color: 'var(--text-placeholder)' }}
                        className="drag-handle"
                      >
                        <GripVertical size={14} strokeWidth={1.5} style={{ opacity: 0 }} />
                      </span>
                      <Checkbox checked={task.completed} onChange={() => completeTask(task.id)} />
                      <span className="truncate" style={{ textDecoration: task.completed ? 'line-through' : undefined, color: task.completed ? 'var(--text-secondary)' : undefined }}>{task.title}</span>
                      <Avatar userId={task.assigneeId} size={20} />
                      <span style={{ fontSize: 11, color: task.dueDate && new Date(task.dueDate) < now && !task.completed ? 'var(--color-error)' : 'var(--text-secondary)' }}>
                        {task.dueDate ? (task.startDate ? `${new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ` : '') + new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                      </span>
                      {task.customFieldValues.cf1 ? <StatusBadge status={task.customFieldValues.cf1} /> : <span>-</span>}
                      {task.customFieldValues.cf2 ? <StatusBadge status={task.customFieldValues.cf2} /> : <span>-</span>}
                    </div>
                  );
                })}

                <button onClick={() => handleShowAddRow(section.id)} style={{ color: 'var(--text-placeholder)', fontSize: 12, padding: '4px 0 4px 62px' }}>
                  Add task...
                </button>
              </>
            )}
          </div>
        );
      })}

      {/* Add section */}
      {addingSectionName ? (
        <div style={{
          display: 'grid', gridTemplateColumns: gridCols,
          gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
          fontSize: 13,
        }}>
          <span />
          <span />
          <input
            autoFocus
            value={newSectionName}
            onChange={e => setNewSectionName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const name = newSectionName.trim() || 'Untitled section';
                addSection(name, project.id);
                setNewSectionName('');
                setAddingSectionName(false);
              }
              if (e.key === 'Escape') {
                setNewSectionName('');
                setAddingSectionName(false);
              }
            }}
            onBlur={() => {
              const name = newSectionName.trim();
              if (name) {
                addSection(name, project.id);
              }
              setNewSectionName('');
              setAddingSectionName(false);
            }}
            placeholder="Section name"
            style={{
              fontWeight: 600, fontSize: 14, color: 'var(--text-primary)',
              background: 'transparent', border: 'none', outline: 'none',
              padding: '4px 0',
            }}
          />
          <span /><span /><span /><span />
        </div>
      ) : (
        <button
          onClick={() => setAddingSectionName(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
            padding: '10px 0', marginTop: 4,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <Plus size={14} strokeWidth={2} />
          Add section
        </button>
      )}

    </div>
  );
}
