import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../data/AppContext';
import { Checkbox } from '../../common/Checkbox';
import { Avatar } from '../../common/Avatar';
import { AssigneeDropdown } from '../../common/AssigneeDropdown';
import { DatePickerCalendar } from '../../common/DatePickerCalendar';
import { StatusBadge } from '../../common/Badge';
import type { Task } from '../../../types';
import {
  Filter, ArrowUpDown, Group, Search, Plus, X, Trash2, MoreHorizontal,
} from 'lucide-react';

type SortField = 'none' | 'start_date' | 'due_date' | 'created_on' | 'alphabetical';
type GroupField = 'sections' | 'none';


/* ─── Reusable click-away hook ─── */
function useClickAway(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

/* ─── Filter Panel ─── */
function FilterPanel({ filters, setFilters, onClose }: {
  filters: { incomplete: boolean; completed: boolean; dueThisWeek: boolean; dueNextWeek: boolean };
  setFilters: (f: typeof filters) => void; onClose: () => void;
}) {
  const ref = useClickAway(onClose);
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
            {filters[key] && '✓'}
          </div>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Sort Panel ─── */
function SortPanel({ sort, setSort, onClose }: { sort: SortField; setSort: (s: SortField) => void; onClose: () => void }) {
  const ref = useClickAway(onClose);
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
  const ref = useClickAway(onClose);

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

/* ─── Options Panel ─── */
function OptionsPanel({ onClose }: { onClose: () => void }) {
  const ref = useClickAway(onClose);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 4, width: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {['Show subtasks', 'Show completed tasks', 'Color columns', 'Compact mode'].map(label => (
        <button key={label} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%',
          borderRadius: 4, fontSize: 13, color: 'var(--text-primary)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Card Context Menu ─── */
function CardContextMenu({ onDelete, onClose }: {
  task: Task; onDelete: () => void; onClose: () => void;
}) {
  const ref = useClickAway(onClose);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 0, right: 0, zIndex: 60, marginTop: 28,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 4, width: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%',
        borderRadius: 4, fontSize: 13, color: 'var(--color-error)',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Trash2 size={13} /> Delete task
      </button>
    </div>
  );
}


/* ═════════ MAIN BOARD VIEW ═════════ */
export function ProjectBoardView() {
  const { projectId } = useParams();
  const {
    tasks, sections, completeTask, addTask, moveTask, deleteTask,
    setSelectedTaskId, addSection, renameSection, projects,
  } = useApp();

  // DnD state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  // Add task state
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState<string | null>(null);
  const [showNewAssigneeDropdown, setShowNewAssigneeDropdown] = useState(false);
  const [showNewDatePicker, setShowNewDatePicker] = useState(false);

  // Add section state
  const [addingSectionOpen, setAddingSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Rename section state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  // Toolbar state
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ incomplete: true, completed: false, dueThisWeek: false, dueNextWeek: false });
  const [sort, setSort] = useState<SortField>('none');
  const [group, setGroup] = useState<GroupField>('sections');
  // Card context menu
  const [contextMenuTaskId, setContextMenuTaskId] = useState<string | null>(null);

  const project = projects.find(p => p.id === projectId);
  if (!project) return <div style={{ padding: 32, color: 'var(--text-secondary)' }}>Project not found</div>;

  const projectSections = sections.filter(s => s.projectId === projectId).sort((a, b) => a.position - b.position);
  const projectTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);
  const now = new Date('2026-04-13');

  const applyFiltersAndSort = (taskList: Task[]) => {
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

  const handleAdd = (sectionId: string) => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      sectionId,
      projectId: project.id,
      ...(newAssigneeId ? { assigneeId: newAssigneeId } : {}),
      ...(newDueDate ? { dueDate: newDueDate } : {}),
    });
    setNewTitle('');
    setNewAssigneeId(null);
    setNewDueDate(null);
    setAddingTo(null);
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    addSection(newSectionName.trim(), project.id);
    setNewSectionName('');
    setAddingSectionOpen(false);
  };

  // ─── Drag and Drop handlers ───
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Set a small delay so the drag image captures correctly
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverSectionId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSectionId(sectionId);
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSectionId(null);
      setDragOverTaskId(null);
      setDropPosition(null);
    }
  };

  const handleCardDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (taskId === draggedTaskId) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'above' : 'below';

    setDragOverTaskId(taskId);
    setDropPosition(pos);
  };

  const handleDrop = (sectionId: string) => {
    if (!draggedTaskId) return;

    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    if (!draggedTask) return;

    // Move the task to the target section
    moveTask(draggedTaskId, sectionId);

    handleDragEnd();
  };

  const formatDate = (task: Task) => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const dueStr = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (task.startDate) {
      const start = new Date(task.startDate);
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startStr} – ${dueStr}`;
    }
    return dueStr;
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setAddingTo(projectSections[0]?.id)} style={{
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
            <button onClick={() => { setShowFilter(v => !v); setShowSort(false); setShowGroup(false); setShowOptions(false); }} style={{
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
            <button onClick={() => { setShowSort(v => !v); setShowFilter(false); setShowGroup(false); setShowOptions(false); }} style={{
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
            <button onClick={() => { setShowGroup(v => !v); setShowFilter(false); setShowSort(false); setShowOptions(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
              fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Group size={12} strokeWidth={1.8} />Group
            </button>
            {showGroup && <GroupPanel group={group} setGroup={setGroup} onClose={() => setShowGroup(false)} />}
          </div>
          {/* Options */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowOptions(v => !v); setShowFilter(false); setShowSort(false); setShowGroup(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
              fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <MoreHorizontal size={14} strokeWidth={1.8} />Options
            </button>
            {showOptions && <OptionsPanel onClose={() => setShowOptions(false)} />}
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

      {/* Board */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, minHeight: 400 }}>
        {projectSections.map(section => {
          const sectionTasks = applyFiltersAndSort(projectTasks.filter(t => t.sectionId === section.id).sort((a, b) => a.position - b.position));
          const isDropTarget = dragOverSectionId === section.id && draggedTaskId !== null;

          return (
            <div
              key={section.id}
              onDragOver={e => handleColumnDragOver(e, section.id)}
              onDragLeave={handleColumnDragLeave}
              onDrop={() => handleDrop(section.id)}
              style={{
                minWidth: 'var(--board-col-width)',
                maxWidth: 'var(--board-col-width)',
                background: isDropTarget ? 'rgba(78, 114, 202, 0.08)' : 'var(--bg-card)',
                borderRadius: 'var(--radius-card)',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                transition: 'background 0.15s ease',
                border: isDropTarget ? '1px solid rgba(78, 114, 202, 0.3)' : '1px solid transparent',
              }}
            >
              {/* Column header */}
              <div style={{ fontWeight: 600, fontSize: 14, padding: '8px 8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editingSectionId === section.id ? (
                  <input
                    autoFocus
                    value={editingSectionName}
                    onChange={e => setEditingSectionName(e.target.value)}
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
                      padding: 0, width: '100%',
                    }}
                  />
                ) : (
                  <span
                    onClick={() => {
                      setEditingSectionId(section.id);
                      setEditingSectionName(section.name);
                    }}
                    style={{ cursor: 'text' }}
                  >
                    {section.name}
                  </span>
                )}
                <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12 }}>{sectionTasks.length}</span>
              </div>

              {/* Cards container */}
              <div style={{ flex: 1, minHeight: 40 }}>
                {sectionTasks.length === 0 && !addingTo ? (
                  <button
                    onClick={() => setAddingTo(section.id)}
                    style={{
                      color: 'var(--text-placeholder)', fontSize: 12, padding: '8px',
                      textAlign: 'left', width: '100%', borderRadius: 'var(--radius-card)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    + Add task
                  </button>
                ) : null}

                {sectionTasks.map(task => {
                  const isDragged = draggedTaskId === task.id;
                  const isOver = dragOverTaskId === task.id && draggedTaskId !== task.id;
                  const dateStr = formatDate(task);

                  return (
                    <div key={task.id} style={{ position: 'relative' }}>
                      {/* Drop indicator above */}
                      {isOver && dropPosition === 'above' && (
                        <div style={{
                          height: 2, background: '#4E72CA', borderRadius: 1,
                          marginBottom: 4, transition: 'opacity 0.1s',
                        }} />
                      )}

                      <div
                        className="board-card"
                        draggable
                        onDragStart={e => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => handleCardDragOver(e, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                        style={{
                          padding: 12,
                          background: 'var(--bg-content)',
                          borderRadius: 'var(--radius-card)',
                          marginBottom: 8,
                          cursor: 'grab',
                          border: '1px solid var(--border-default)',
                          opacity: isDragged ? 0.4 : 1,
                          transition: 'opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
                          transform: isDragged ? 'scale(0.98)' : 'scale(1)',
                          position: 'relative',
                        }}
                        onMouseEnter={e => {
                          if (!isDragged) {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                            e.currentTarget.style.borderColor = 'var(--border-input)';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = 'var(--border-default)';
                        }}
                      >
                        {/* Top row: checkbox + title + menu */}
                        <div style={{ display: 'flex', alignItems: 'start', gap: 8, marginBottom: 8 }}>
                          <Checkbox checked={task.completed} onChange={() => completeTask(task.id)} />
                          <span style={{
                            fontSize: 13, lineHeight: 1.3, flex: 1,
                            textDecoration: task.completed ? 'line-through' : undefined,
                            color: task.completed ? 'var(--text-secondary)' : undefined,
                          }}>{task.title}</span>
                          <button
                            className="card-menu-btn"
                            onClick={e => { e.stopPropagation(); setContextMenuTaskId(contextMenuTaskId === task.id ? null : task.id); }}
                            style={{
                              color: 'var(--text-placeholder)', display: 'flex', padding: 2, borderRadius: 3,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>

                        {/* Badges row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          {task.customFieldValues.cf1 && <StatusBadge status={task.customFieldValues.cf1} />}
                          {task.customFieldValues.cf2 && <StatusBadge status={task.customFieldValues.cf2} />}
                          <div style={{ flex: 1 }} />
                          {task.assigneeId && <Avatar userId={task.assigneeId} size={20} />}
                        </div>

                        {/* Date row */}
                        {dateStr && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            {task.assigneeId && <Avatar userId={task.assigneeId} size={16} />}
                            <span style={{
                              fontSize: 11,
                              color: task.dueDate && new Date(task.dueDate) < now && !task.completed
                                ? 'var(--color-error)' : 'var(--text-secondary)',
                            }}>
                              {dateStr}
                            </span>
                          </div>
                        )}

                        {/* Context menu */}
                        {contextMenuTaskId === task.id && (
                          <CardContextMenu
                            task={task}
                            onDelete={() => deleteTask(task.id)}
                            onClose={() => setContextMenuTaskId(null)}
                          />
                        )}
                      </div>

                      {/* Drop indicator below */}
                      {isOver && dropPosition === 'below' && (
                        <div style={{
                          height: 2, background: '#4E72CA', borderRadius: 1,
                          marginBottom: 4, transition: 'opacity 0.1s',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add task input / button */}
              {addingTo === section.id ? (
                <div data-add-task-card style={{
                  padding: 12, background: 'var(--bg-content)', borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--border-default)', marginTop: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <Checkbox checked={false} onChange={() => {}} />
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(section.id); if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); setNewAssigneeId(null); setNewDueDate(null); } }}
                      onBlur={(e) => {
                        // Don't close if focus is moving to a child element (calendar/assignee buttons)
                        const container = e.currentTarget.closest('[data-add-task-card]');
                        if (container && e.relatedTarget && container.contains(e.relatedTarget as Node)) return;
                        if (showNewAssigneeDropdown || showNewDatePicker) return;
                        if (newTitle.trim()) handleAdd(section.id);
                        else { setAddingTo(null); setNewTitle(''); setNewAssigneeId(null); setNewDueDate(null); }
                      }}
                      placeholder="Write a task name"
                      style={{
                        flex: 1, background: 'transparent', border: 'none', padding: '2px 0',
                        fontSize: 13, color: 'var(--text-primary)', outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Assignee button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowNewAssigneeDropdown(prev => !prev); setShowNewDatePicker(false); }}
                        style={{
                          width: 24, height: 24, borderRadius: '50%',
                          border: newAssigneeId ? 'none' : '1.5px dashed var(--border-input)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', background: 'transparent', padding: 0,
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { if (!newAssigneeId) e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
                        onMouseLeave={e => { if (!newAssigneeId) e.currentTarget.style.borderColor = 'var(--border-input)'; }}
                      >
                        {newAssigneeId ? (
                          <Avatar userId={newAssigneeId} size={24} />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-placeholder)' }}>
                            <circle cx="8" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        )}
                      </button>
                      {showNewAssigneeDropdown && (
                        <AssigneeDropdown
                          assigneeId={newAssigneeId}
                          onSelect={(userId) => setNewAssigneeId(userId)}
                          teamId={project.teamId}
                          onClose={() => setShowNewAssigneeDropdown(false)}
                        />
                      )}
                    </div>
                    {/* Due date button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowNewDatePicker(prev => !prev); setShowNewAssigneeDropdown(false); }}
                        style={{
                          width: 24, height: 24, borderRadius: '50%',
                          border: newDueDate ? 'none' : '1.5px dashed var(--border-input)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', background: newDueDate ? 'var(--color-primary)' : 'transparent', padding: 0,
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { if (!newDueDate) e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
                        onMouseLeave={e => { if (!newDueDate) e.currentTarget.style.borderColor = 'var(--border-input)'; }}
                        title={newDueDate ? new Date(newDueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set due date'}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: newDueDate ? '#fff' : 'var(--text-placeholder)' }}>
                          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                          <line x1="2" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" />
                          <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                      {showNewDatePicker && (
                        <DatePickerCalendar
                          dueDate={newDueDate}
                          onSelectDueDate={(date) => setNewDueDate(date)}
                          position="below-left"
                          onClose={() => setShowNewDatePicker(false)}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }} />
                    {/* Like icon */}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-placeholder)' }}>
                      <path d="M4.5 8V14H2.5C2.22 14 2 13.78 2 13.5V9C2 8.72 2.22 8.5 2.5 8.5H4.5V8ZM5.5 8L8 2C8.83 2 9.5 2.67 9.5 3.5V6H13c.55 0 1 .45 1 1v1l-2 6H5.5V8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTo(section.id)}
                  style={{
                    color: 'var(--text-placeholder)', fontSize: 12, padding: '8px',
                    textAlign: 'left', width: '100%', borderRadius: 'var(--radius-card)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  + Add task
                </button>
              )}
            </div>
          );
        })}

        {/* Add section column */}
        <div style={{
          minWidth: 'var(--board-col-width)',
          display: 'flex',
          alignItems: 'flex-start',
          paddingTop: 8,
        }}>
          {addingSectionOpen ? (
            <div style={{ width: '100%', padding: 8 }}>
              <input
                autoFocus
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddSection(); if (e.key === 'Escape') { setAddingSectionOpen(false); setNewSectionName(''); } }}
                onBlur={() => { if (newSectionName.trim()) handleAddSection(); else { setAddingSectionOpen(false); setNewSectionName(''); } }}
                placeholder="Section name"
                style={{
                  width: '100%', padding: '8px', fontSize: 13,
                  background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                  borderRadius: 'var(--radius-input)', color: 'var(--text-primary)',
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingSectionOpen(true)}
              style={{
                color: 'var(--text-placeholder)', fontSize: 13, padding: '8px 16px',
                border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-card)',
                width: '100%', textAlign: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
            >
              + Add section
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
