import { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../../data/AppContext';
import { currentUserId, users, teamMembers } from '../../../data/seed';
import { Checkbox } from '../../common/Checkbox';
import { Avatar } from '../../common/Avatar';
// Badge available for future use
import {
  ChevronDown, ChevronRight, ChevronLeft, Filter, ArrowUpDown,
  Group, Search, Plus, X, Calendar as CalendarIcon, GripVertical,
} from 'lucide-react';

type ViewType = 'list' | 'board' | 'calendar';
type SortField = 'none' | 'start_date' | 'due_date' | 'created_on' | 'alphabetical' | 'project';
type GroupField = 'sections' | 'none';

const myTaskSections = ['Recently assigned', 'Do today', 'Do next week', 'Do later'];

/* ─── Date Picker Component ─── */
function DatePicker({ startDate, dueDate, onSave, onClose }: {
  startDate: string | null; dueDate: string | null;
  onSave: (start: string | null, due: string | null) => void; onClose: () => void;
}) {
  const [mode, setMode] = useState<'start' | 'due'>(startDate && !dueDate ? 'due' : 'start');
  const [start, setStart] = useState(startDate || '');
  const [due, setDue] = useState(dueDate || '');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = dueDate ? new Date(dueDate) : startDate ? new Date(startDate) : new Date('2026-04-13');
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const firstDay = new Date(viewMonth.year, viewMonth.month, 1).getDay();
  const today = new Date('2026-04-13');

  const toDateStr = (day: number) =>
    `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleDayClick = (day: number) => {
    const dateStr = toDateStr(day);
    if (mode === 'start') {
      setStart(dateStr);
      setDue('');
      setMode('due');
    } else {
      // Ensure due >= start; if not, swap
      if (start && dateStr < start) {
        setDue(start);
        onSave(dateStr, start);
      } else {
        setDue(dateStr);
        onSave(start || null, dateStr);
      }
      setMode('start');
      setHoveredDay(null);
    }
  };

  const prevMonth = () => setViewMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setViewMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Effective end for range (committed due or hover preview)
  const effectiveDue = mode === 'due' && start && !due && hoveredDay ? hoveredDay : due;
  const isPreview = mode === 'due' && start && !due && !!hoveredDay;

  const isInRange = (dateStr: string) => {
    if (!start || !effectiveDue) return false;
    return dateStr >= start && dateStr <= effectiveDue;
  };

  const isStartDate = (dateStr: string) => start === dateStr;
  const isDueDate = (dateStr: string) => effectiveDue === dateStr;
  const isToday = (day: number) => new Date(viewMonth.year, viewMonth.month, day).toDateString() === today.toDateString();

  const fmt = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '';

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 12, width: 260, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {/* Start / Due inputs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode('start')} style={{
          flex: 1, padding: '6px 8px', fontSize: 12, borderRadius: 4, textAlign: 'left',
          border: mode === 'start' ? '1px solid #fff' : '1px solid var(--border-default)',
          color: start ? 'var(--text-primary)' : 'var(--text-placeholder)', background: 'transparent',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>Start date</div>
          {start ? fmt(start) : '—'}
          {start && <X size={10} style={{ float: 'right', marginTop: 2, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setStart(''); setMode('start'); }} />}
        </button>
        <button onClick={() => setMode('due')} style={{
          flex: 1, padding: '6px 8px', fontSize: 12, borderRadius: 4, textAlign: 'left',
          border: mode === 'due' ? '1px solid #fff' : '1px solid var(--border-default)',
          color: due ? 'var(--text-primary)' : 'var(--text-placeholder)', background: 'transparent',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>Due date</div>
          {due ? fmt(due) : '—'}
          {due && <X size={10} style={{ float: 'right', marginTop: 2, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setDue(''); }} />}
        </button>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={prevMonth} style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{monthName}</span>
        <button onClick={nextMonth} style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 10, color: 'var(--text-placeholder)', marginBottom: 4 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
      </div>

      {/* Days */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 12 }}
        onMouseLeave={() => setHoveredDay(null)}
      >
        {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = toDateStr(day);
          const inRange = isInRange(dateStr);
          const isS = isStartDate(dateStr);
          const isD = isDueDate(dateStr);
          const isT = isToday(day);
          const isEndpoint = isS || isD;
          const isSingleDay = isS && isD;
          let borderRadius = '50%';
          if (isSingleDay) borderRadius = '50%';
          else if (isS) borderRadius = '50% 0 0 50%';
          else if (isD) borderRadius = '0 50% 50% 0';
          else if (inRange) borderRadius = '0';

          let bg = 'transparent';
          if (isSingleDay) bg = isPreview ? 'rgba(78,114,202,0.35)' : '#4E72CA';
          else if (isEndpoint) bg = isPreview ? 'rgba(78,114,202,0.35)' : '#4E72CA';
          else if (inRange) bg = isPreview ? 'rgba(78,114,202,0.15)' : 'rgba(78,114,202,0.3)';

          return (
            <button key={day}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => setHoveredDay(dateStr)}
              style={{
                padding: '4px 0', borderRadius,
                background: bg,
                color: isEndpoint && !isPreview ? '#fff' : isT ? '#4E72CA' : 'var(--text-primary)',
                fontWeight: isT || isEndpoint ? 600 : 400,
                border: isT && !isEndpoint ? '1px solid #4E72CA' : '1px solid transparent',
                cursor: 'pointer', width: 30, height: 30, margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.1s',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={() => { onSave(null, null); }} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 8px' }}>Clear</button>
      </div>
    </div>
  );
}

/* ─── Collaborator Picker ─── */
function CollaboratorPicker({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { updateTask, tasks } = useApp();
  const task = tasks.find(t => t.id === taskId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Get team members for this task's project
  // Show all users regardless of project
  const allTeamUserIds = [...new Set(teamMembers.map(tm => tm.userId))];
  const teamUsers = users.filter(u => allTeamUserIds.includes(u.id));

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 8, width: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {teamUsers.map(user => (
        <button key={user.id} onClick={() => {
          if (task) updateTask(task.id, { assigneeId: user.id });
          onClose();
        }} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', width: '100%',
          borderRadius: 4, fontSize: 13, color: 'var(--text-primary)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Avatar userId={user.id} size={22} />
          <span>{user.name}</span>
          {user.id === task?.assigneeId && <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 11 }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

/* ─── Project Picker (rendered once via portal-style fixed positioning) ─── */
function ProjectPicker({ taskId, anchorRect, onClose }: {
  taskId: string; anchorRect: { top: number; left: number; height: number }; onClose: () => void;
}) {
  const { updateTask, tasks, seed: { projects, sections } } = useApp();
  const task = tasks.find(t => t.id === taskId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const activeProjects = projects.filter(p => !p.archived);

  const handleSelect = (projectId: string, sectionId: string) => {
    if (task) updateTask(task.id, { projectId, sectionId });
    onClose();
  };

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} style={{
      position: 'fixed', top: anchorRect.top + anchorRect.height + 4, left: anchorRect.left, zIndex: 9999,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 8, width: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '4px 8px 6px', fontWeight: 500 }}>Select a project</div>
      {activeProjects.map(project => {
        const firstSection = sections.find(s => s.projectId === project.id);
        return (
          <button type="button" key={project.id} onClick={() => {
            if (firstSection) handleSelect(project.id, firstSection.id);
          }} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', width: '100%',
            borderRadius: 4, fontSize: 13, color: 'var(--text-primary)', background: 'transparent',
            border: 'none', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left' }}>{project.name}</span>
            {project.id === task?.projectId && <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>✓</span>}
          </button>
        );
      })}
      {task?.projectId && (
        <>
          <div style={{ height: 1, background: 'var(--border-divider)', margin: '4px 0' }} />
          <button type="button" onClick={() => handleSelect('', '')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', width: '100%',
            borderRadius: 4, fontSize: 13, color: 'var(--text-secondary)', background: 'transparent',
            border: 'none', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={12} />
            <span>Remove from project</span>
          </button>
        </>
      )}
    </div>
  );
}

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
    { value: 'project', label: 'Project' },
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

/* ─── Main Component ─── */
export function MyTasksPage() {
  const { tasks, completeTask, addTask, setSelectedTaskId, updateTask, reorderTasks, projects, seed } = useApp();
  const [view, setView] = useState<ViewType>('list');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Toolbar state
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ incomplete: true, completed: false, dueThisWeek: false, dueNextWeek: false });
  const [sort, setSort] = useState<SortField>('none');
  const [group, setGroup] = useState<GroupField>('sections');

  // Inline pickers
  const [datePickerTask, setDatePickerTask] = useState<string | null>(null);
  const [collabPickerTask, setCollabPickerTask] = useState<string | null>(null);
  const [projectPickerTask, setProjectPickerTask] = useState<string | null>(null);
  const [pickerAnchorRect, setPickerAnchorRect] = useState<{ top: number; left: number; height: number } | null>(null);

  // Drag and drop
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropSection, setDropSection] = useState<string | null>(null);

  // Section overrides are now stored on the task itself via myTaskSection

  // Calendar view state
  const [calMonth, setCalMonth] = useState({ year: 2026, month: 3 }); // April 2026

  const myTasks = tasks.filter(t => t.assigneeId === currentUserId && !t.parentTaskId);
  const now = new Date('2026-04-13');

  const getDefaultSection = (t: typeof myTasks[0]): string => {
    if (t.completed) return '';
    if (t.dueDate && new Date(t.dueDate) > new Date('2026-04-20')) return 'Do later';
    if (t.dueDate && new Date(t.dueDate) > now && new Date(t.dueDate) <= new Date('2026-04-20')) return 'Do next week';
    if (t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString()) return 'Do today';
    if (new Date(t.createdAt) > new Date('2026-04-07')) return 'Recently assigned';
    return 'Recently assigned';
  };

  const getTaskSection = (t: typeof myTasks[0]): string => t.myTaskSection || getDefaultSection(t);

  const getSectionTasks = (section: string) => {
    const result = myTasks.filter(t => !t.completed && getTaskSection(t) === section);
    return applyFiltersAndSort(result);
  };

  const applyFiltersAndSort = (taskList: typeof myTasks) => {
    let filtered = taskList;
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q));
    }
    // Filters
    if (!filters.incomplete && !filters.completed) {
      // show nothing
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
    // Sort
    if (sort !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        switch (sort) {
          case 'due_date': return (a.dueDate || '9').localeCompare(b.dueDate || '9');
          case 'start_date': return (a.startDate || '9').localeCompare(b.startDate || '9');
          case 'created_on': return a.createdAt.localeCompare(b.createdAt);
          case 'alphabetical': return a.title.localeCompare(b.title);
          case 'project': return a.projectId.localeCompare(b.projectId);
          default: return 0;
        }
      });
    }
    return filtered;
  };

  const toggleCollapse = (s: string) => setCollapsed(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const handleAdd = (_section: string) => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), sectionId: 's1', projectId: 'p1', assigneeId: currentUserId });
    setNewTitle('');
    setAddingTo(null);
  };

  const formatDate = (task: typeof myTasks[0]) => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const isToday = due.toDateString() === now.toDateString();
    const dueFmt = isToday ? 'Today' : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (task.startDate) {
      const start = new Date(task.startDate);
      const startFmt = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startFmt} – ${dueFmt}`;
    }
    return dueFmt;
  };

  /* ─── Calendar helpers ─── */
  const calDaysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const calFirstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
  const calMonthName = new Date(calMonth.year, calMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calTasksForDay = useMemo(() => {
    const map: Record<number, typeof myTasks> = {};
    const allFiltered = applyFiltersAndSort(myTasks);
    for (let d = 1; d <= calDaysInMonth; d++) {
      const dayDate = new Date(calMonth.year, calMonth.month, d);
      map[d] = allFiltered.filter(t => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        const start = t.startDate ? new Date(t.startDate) : due;
        return dayDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
               dayDate <= new Date(due.getFullYear(), due.getMonth(), due.getDate());
      });
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calMonth.year, calMonth.month, tasks, filters, searchQuery, sort]);

  const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '7px 8px',
    borderRight: '1px solid var(--border-divider)',
    borderBottom: '1px solid var(--border-divider)',
    cursor: 'pointer',
    transition: 'background 0.1s',
    ...extra,
  });
  const cellHover = (e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.background = 'var(--bg-row-hover)';
  const cellLeave = (e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.background = 'transparent';

  const renderAddRow = (section: string) => {
    if (addingTo === section) {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 40px 1fr 100px 100px 160px 120px 28px',
          alignItems: 'stretch',
          fontSize: 13,
        }}>
          <div style={{ borderBottom: '1px solid var(--border-divider)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-divider)' }}>
            <Checkbox checked={false} onChange={() => {}} />
          </div>
          <div style={cellStyle()}>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(section); if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); } }}
              onBlur={() => { if (newTitle.trim()) handleAdd(section); else { setAddingTo(null); setNewTitle(''); } }}
              placeholder="Write a task name"
              style={{ width: '100%', background: 'transparent', border: 'none', padding: 0, fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <div style={cellStyle()} />
          <div style={cellStyle()} />
          <div style={cellStyle()} />
          <div style={cellStyle()} />
          <div style={{ borderBottom: '1px solid var(--border-divider)' }} />
        </div>
      );
    }
    return (
      <button
        onClick={() => setAddingTo(section)}
        style={{
          padding: '6px 0 6px 40px', fontSize: 13,
          color: 'var(--text-placeholder)', width: '100%', textAlign: 'left',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}
      >
        Add task...
      </button>
    );
  };

  return (
    <div style={{ background: '#1D1F21', margin: '-16px -24px', padding: '8px 24px', minHeight: 'calc(100vh - var(--topbar-height))' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar userId={currentUserId} size={32} />
          <h1 style={{ fontSize: 20, fontWeight: 400 }}>My tasks</h1>
          <ChevronDown size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)', marginLeft: -4 }} />
        </div>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0 }}>
        {(['list', 'board', 'calendar'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '6px 12px 8px', fontSize: 13,
            color: view === v ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: view === v ? '2px solid var(--text-primary)' : '2px solid transparent',
            fontWeight: view === v ? 500 : 400, marginBottom: -1,
          }}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
        <button style={{ padding: '6px 8px 8px', color: 'var(--text-placeholder)', display: 'flex', alignItems: 'center', marginBottom: -1 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}>
          <Plus size={14} strokeWidth={2} />
        </button>
      </div>
      {/* Full-width separator connecting to sidebar */}
      <div style={{ height: 1, background: '#404244', margin: '14px -24px 8px' }} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={() => setAddingTo('Recently assigned')} style={{
          display: 'flex', alignItems: 'center', gap: 5, background: '#4E72CA', color: '#fff',
          padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 'var(--radius-pill)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#4265b8'}
          onMouseLeave={e => e.currentTarget.style.background = '#4E72CA'}>
          <Plus size={12} strokeWidth={2.5} />Add task
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
            <button onClick={() => setSearchOpen(true)} style={{
              display: 'flex', alignItems: 'center', padding: '4px 6px',
              color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Search size={13} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════ LIST VIEW ═══════════ */}
      {view === 'list' && (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '24px 40px 1fr 100px 100px 160px 120px 28px',
            alignItems: 'center', borderBottom: '1px solid var(--border-divider)',
            fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500,
          }}>
            <span />
            <span />
            <span style={{ padding: '6px 8px', borderRight: '1px solid var(--border-divider)' }}>Name</span>
            <span style={{ padding: '6px 8px', borderRight: '1px solid var(--border-divider)' }}>Due date</span>
            <span style={{ padding: '6px 8px', borderRight: '1px solid var(--border-divider)' }}>Collaborators</span>
            <span style={{ padding: '6px 8px', borderRight: '1px solid var(--border-divider)' }}>Projects</span>
            <span style={{ padding: '6px 8px', borderRight: '1px solid var(--border-divider)' }}>Task visibility</span>
            <button style={{ color: 'var(--text-placeholder)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
              <Plus size={12} strokeWidth={2} />
            </button>
          </div>

          {/* Sections */}
          {(group === 'sections' ? myTaskSections : ['All tasks']).map(section => {
            const sectionTasks = group === 'sections' ? getSectionTasks(section) : applyFiltersAndSort(myTasks.filter(t => !t.completed));
            const isCollapsed = collapsed.has(section);
            return (
              <div key={section}>
                {group === 'sections' && (
                  <button onClick={() => toggleCollapse(section)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0 6px',
                    fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', width: '100%',
                  }}>
                    <ChevronRight size={12} strokeWidth={2} style={{
                      transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                      transition: 'transform 0.15s', color: 'var(--text-secondary)',
                    }} />
                    {section}
                  </button>
                )}

                {!isCollapsed && (
                  <>
                    {sectionTasks.map(task => {
                      const project = projects.find(p => p.id === task.projectId);
                      const dateStr = formatDate(task);
                      const assignee = users.find(u => u.id === task.assigneeId);
                      const isDragging = dragTaskId === task.id;
                      const isDropTarget = dropTargetId === task.id && dragTaskId !== task.id;
                      return (
                        <div key={task.id}
                          className="task-row"
                          draggable={dragTaskId === task.id}
                          onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.id); }}
                          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTargetId(task.id); }}
                          onDragLeave={() => { setDropTargetId(prev => prev === task.id ? null : prev); }}
                          onDrop={e => {
                            e.preventDefault();
                            const fromId = e.dataTransfer.getData('text/plain');
                            if (fromId && fromId !== task.id) {
                              // Move to this section if coming from a different one
                              updateTask(fromId, { myTaskSection: section });
                              const ids = sectionTasks.map(t => t.id);
                              if (!ids.includes(fromId)) ids.push(fromId);
                              const fromIdx = ids.indexOf(fromId);
                              const toIdx = ids.indexOf(task.id);
                              if (fromIdx !== -1 && toIdx !== -1) {
                                ids.splice(fromIdx, 1);
                                ids.splice(toIdx, 0, fromId);
                                reorderTasks(ids);
                              }
                            }
                            setDragTaskId(null);
                            setDropTargetId(null);
                          }}
                          onDragEnd={() => { setDragTaskId(null); setDropTargetId(null); }}
                          style={{
                            display: 'grid', gridTemplateColumns: '24px 40px 1fr 100px 100px 160px 120px 28px',
                            alignItems: 'stretch', fontSize: 13,
                            opacity: isDragging ? 0.4 : 1,
                            borderTop: isDropTarget ? '2px solid #4E72CA' : '2px solid transparent',
                          }}>
                          {/* Drag handle */}
                          <div
                            onMouseDown={() => setDragTaskId(task.id)}
                            onMouseUp={() => { if (!isDragging) setDragTaskId(null); }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderBottom: '1px solid var(--border-divider)', cursor: 'grab',
                            }}
                            className="drag-handle"
                          >
                            <GripVertical size={14} strokeWidth={1.5} style={{ color: 'var(--text-placeholder)', opacity: 0 }} />
                          </div>
                          {/* Checkbox */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-divider)', cursor: 'pointer' }}
                            onClick={() => completeTask(task.id)} onMouseEnter={cellHover} onMouseLeave={cellLeave}>
                            <Checkbox checked={task.completed} onChange={() => completeTask(task.id)} />
                          </div>
                          {/* Name */}
                          <div style={cellStyle()} onClick={() => setSelectedTaskId(task.id)} onMouseEnter={cellHover} onMouseLeave={cellLeave}>
                            <span className="truncate" style={{ display: 'block' }}>{task.title}</span>
                          </div>
                          {/* Due date — clickable with calendar picker */}
                          <div style={{ ...cellStyle({ fontSize: 11, display: 'flex', alignItems: 'center', position: 'relative',
                            color: task.dueDate && new Date(task.dueDate) < now && !task.completed ? 'var(--color-error)' : 'var(--text-secondary)' }) }}
                            onClick={() => setDatePickerTask(datePickerTask === task.id ? null : task.id)}
                            onMouseEnter={cellHover} onMouseLeave={cellLeave}>
                            {dateStr || <CalendarIcon size={13} strokeWidth={1.5} style={{ color: 'var(--text-placeholder)', opacity: 0.5 }} />}
                            {datePickerTask === task.id && (
                              <DatePicker
                                startDate={task.startDate}
                                dueDate={task.dueDate}
                                onSave={(start, due) => { updateTask(task.id, { startDate: start, dueDate: due }); setDatePickerTask(null); }}
                                onClose={() => setDatePickerTask(null)}
                              />
                            )}
                          </div>
                          {/* Collaborators — clickable to assign */}
                          <div style={{ ...cellStyle({ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }) }}
                            onClick={() => setCollabPickerTask(collabPickerTask === task.id ? null : task.id)}
                            onMouseEnter={cellHover} onMouseLeave={cellLeave}>
                            {assignee ? <Avatar userId={assignee.id} size={20} /> :
                              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.3 }}>
                                <circle cx="10" cy="10" r="9" stroke="var(--text-placeholder)" strokeWidth="1" strokeDasharray="3 2" fill="none" />
                                <circle cx="10" cy="8" r="3" stroke="var(--text-placeholder)" strokeWidth="1" fill="none" />
                                <path d="M4 16c0-3 3-5 6-5s6 2 6 5" stroke="var(--text-placeholder)" strokeWidth="1" fill="none" />
                              </svg>
                            }
                            {collabPickerTask === task.id && (
                              <CollaboratorPicker taskId={task.id} onClose={() => setCollabPickerTask(null)} />
                            )}
                          </div>
                          {/* Projects — clickable to pick project */}
                          <div style={cellStyle({ display: 'flex', alignItems: 'center', gap: 4 })}
                            onClick={e => {
                              if (projectPickerTask === task.id) { setProjectPickerTask(null); setPickerAnchorRect(null); }
                              else { const rect = e.currentTarget.getBoundingClientRect(); setPickerAnchorRect({ top: rect.top, left: rect.left, height: rect.height }); setProjectPickerTask(task.id); }
                            }}
                            onMouseEnter={cellHover} onMouseLeave={cellLeave}>
                            {project ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '2px 6px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                                background: `${project.color}22`, color: project.color, maxWidth: '100%',
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
                                <span className="truncate">{project.name}</span>
                              </span>
                            ) : (
                              <Plus size={13} strokeWidth={1.5} style={{ color: 'var(--text-placeholder)', opacity: 0.5 }} />
                            )}
                          </div>
                          {/* Task visibility */}
                          <div style={cellStyle({ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 })}
                            onMouseEnter={cellHover} onMouseLeave={cellLeave}>
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                              <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                              <line x1="5" y1="3" x2="5" y2="13" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            My workspace
                          </div>
                          <div style={{ borderBottom: '1px solid var(--border-divider)' }} />
                        </div>
                      );
                    })}
                    {renderAddRow(section)}
                  </>
                )}
              </div>
            );
          })}

          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', fontSize: 13, color: 'var(--text-placeholder)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}>
            <Plus size={13} strokeWidth={2} />Add section
          </button>
        </>
      )}

      {/* ═══════════ BOARD VIEW ═══════════ */}
      {view === 'board' && (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
          {myTaskSections.map(section => {
            const sectionTasks = getSectionTasks(section);
            const isColumnDrop = dropSection === section && dragTaskId && getTaskSection(myTasks.find(t => t.id === dragTaskId)!) !== section;
            return (
              <div key={section}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropSection(section); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropSection(prev => prev === section ? null : prev); }}
                onDrop={e => {
                  e.preventDefault();
                  const fromId = e.dataTransfer.getData('text/plain');
                  if (fromId) {
                    updateTask(fromId, { myTaskSection: section });
                    // If dropped on a specific card, reorder within the section
                    if (dropTargetId && dropTargetId !== fromId) {
                      const ids = sectionTasks.map(t => t.id);
                      if (!ids.includes(fromId)) ids.push(fromId);
                      const fromIdx = ids.indexOf(fromId);
                      const toIdx = ids.indexOf(dropTargetId);
                      if (fromIdx !== -1 && toIdx !== -1) {
                        ids.splice(fromIdx, 1);
                        ids.splice(toIdx, 0, fromId);
                        reorderTasks(ids);
                      }
                    }
                  }
                  setDragTaskId(null);
                  setDropTargetId(null);
                  setDropSection(null);
                }}
                style={{
                  minWidth: 260, flex: '1 1 0', borderRadius: 'var(--radius-card)', padding: 8,
                  display: 'flex', flexDirection: 'column',
                  background: isColumnDrop ? 'rgba(78,114,202,0.12)' : 'var(--bg-card)',
                  border: isColumnDrop ? '2px dashed #4E72CA' : '2px solid transparent',
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                <div style={{ fontWeight: 600, fontSize: 14, padding: '8px 8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {section}
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12 }}>{sectionTasks.length}</span>
                </div>
                <div style={{ flex: 1, minHeight: 40 }}>
                  {sectionTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const dateStr = formatDate(task);
                    const isDragging = dragTaskId === task.id;
                    const isCardDrop = dropTargetId === task.id && dragTaskId !== task.id;
                    return (
                      <div key={task.id}
                        draggable
                        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.id); setDragTaskId(task.id); }}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropTargetId(task.id); setDropSection(section); }}
                        onDragLeave={() => setDropTargetId(prev => prev === task.id ? null : prev)}
                        onDragEnd={() => { setDragTaskId(null); setDropTargetId(null); setDropSection(null); }}
                        onClick={() => setSelectedTaskId(task.id)}
                        style={{
                          padding: 10, background: '#1D1F21', borderRadius: 'var(--radius-card)',
                          marginBottom: 6, cursor: 'grab', border: '1px solid var(--border-default)',
                          opacity: isDragging ? 0.4 : 1,
                          borderTop: isCardDrop ? '2px solid #4E72CA' : undefined,
                        }}
                        onMouseEnter={e => { if (!isDragging) e.currentTarget.style.borderColor = 'var(--text-placeholder)'; }}
                        onMouseLeave={e => { if (!isDragging) e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: 8, marginBottom: 6 }}>
                          <Checkbox checked={task.completed} onChange={() => completeTask(task.id)} />
                          <span style={{ fontSize: 13, flex: 1 }}>{task.title}</span>
                        </div>
                        {project && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: project.color }} />
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{project.name}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {dateStr && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{dateStr}</span>}
                          <div style={{ flex: 1 }} />
                          {task.assigneeId && <Avatar userId={task.assigneeId} size={20} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setAddingTo(section)} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '8px',
                  fontSize: 13, color: 'var(--text-placeholder)', width: '100%',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}>
                  <Plus size={13} strokeWidth={2} />Add task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ CALENDAR VIEW ═══════════ */}
      {view === 'calendar' && (
        <div>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={() => setCalMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })}
              style={{ color: 'var(--text-secondary)', display: 'flex', padding: 6, borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 500, minWidth: 160, textAlign: 'center' }}>{calMonthName}</span>
            <button onClick={() => setCalMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })}
              style={{ color: 'var(--text-secondary)', display: 'flex', padding: 6, borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setCalMonth({ year: 2026, month: 3 })}
              style={{ fontSize: 12, color: 'var(--text-link)', padding: '4px 8px' }}>
              Today
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-divider)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'center' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: calFirstDay }).map((_, i) => (
              <div key={`e${i}`} style={{ minHeight: 90, border: '1px solid var(--border-divider)', borderTop: 'none' }} />
            ))}
            {Array.from({ length: calDaysInMonth }, (_, i) => i + 1).map(day => {
              const dayTasks = calTasksForDay[day] || [];
              const isToday = new Date(calMonth.year, calMonth.month, day).toDateString() === now.toDateString();
              return (
                <div key={day} style={{
                  minHeight: 90, border: '1px solid var(--border-divider)', borderTop: 'none',
                  padding: 4, position: 'relative',
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: isToday ? 600 : 400,
                    color: isToday ? '#4E72CA' : 'var(--text-secondary)',
                    marginBottom: 4, textAlign: 'right', padding: '2px 4px',
                  }}>
                    {isToday ? (
                      <span style={{ background: '#4E72CA', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{day}</span>
                    ) : day}
                  </div>
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} onClick={() => setSelectedTaskId(task.id)} style={{
                      fontSize: 10, padding: '2px 4px', marginBottom: 2, borderRadius: 3, cursor: 'pointer',
                      background: 'rgba(78,114,202,0.2)', color: 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(78,114,202,0.4)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(78,114,202,0.2)'}>
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-placeholder)', padding: '0 4px' }}>+{dayTasks.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view !== 'list' && view !== 'board' && view !== 'calendar' && (
        <p style={{ color: 'var(--text-secondary)', padding: 32, textAlign: 'center', fontSize: 13 }}>
          {view.charAt(0).toUpperCase() + view.slice(1)} view coming soon
        </p>
      )}

      {/* Single ProjectPicker instance rendered at page level */}
      {projectPickerTask && pickerAnchorRect && (
        <ProjectPicker
          taskId={projectPickerTask}
          anchorRect={pickerAnchorRect}
          onClose={() => { setProjectPickerTask(null); setPickerAnchorRect(null); }}
        />
      )}
    </div>
  );
}
