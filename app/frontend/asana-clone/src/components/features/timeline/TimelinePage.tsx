import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { currentUserId } from '../../../data/seed';
import { Plus, ChevronLeft, ChevronRight, Minus, Filter, ArrowUpDown, Settings, ChevronDown, Trash2 } from 'lucide-react';

type ZoomLevel = 'hours' | 'days' | 'weeks' | 'months' | 'quarters' | 'half-year' | 'years';
const ZOOM_LEVELS: ZoomLevel[] = ['hours', 'days', 'weeks', 'months', 'quarters', 'half-year', 'years'];
const ZOOM_LABELS: Record<ZoomLevel, string> = {
  hours: 'Hours', days: 'Days', weeks: 'Weeks', months: 'Months',
  quarters: 'Quarters', 'half-year': 'Half-year', years: 'Years',
};

type SortField = 'none' | 'start_date' | 'due_date' | 'assignee';

function getQuarter(d: Date): number { return Math.floor(d.getMonth() / 3) + 1; }

function formatMonth(d: Date): string {
  return d.toLocaleString('en-US', { month: 'long' });
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const sMonth = start.toLocaleString('en-US', { month: 'short' });
  const eMonth = end.toLocaleString('en-US', { month: 'short' });
  if (sMonth === eMonth) {
    return `${start.getDate()} - ${end.getDate()}`;
  }
  return `${sMonth} ${start.getDate()} - ${end.getDate()}`;
}

// Generate columns based on zoom level
function generateColumns(zoom: ZoomLevel, anchorDate: Date) {
  const cols: { key: string; label: string; subLabel?: string; start: Date; end: Date }[] = [];

  if (zoom === 'hours') {
    // Show 48 hours
    const base = new Date(anchorDate);
    base.setHours(0, 0, 0, 0);
    for (let i = -12; i < 36; i++) {
      const s = new Date(base);
      s.setHours(base.getHours() + i);
      const e = new Date(s);
      e.setHours(s.getHours() + 1);
      cols.push({ key: `h${i}`, label: `${s.getHours()}:00`, start: s, end: e });
    }
  } else if (zoom === 'days') {
    // Show ~35 days
    const base = new Date(anchorDate);
    base.setDate(base.getDate() - 5);
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 35; i++) {
      const s = new Date(base);
      s.setDate(base.getDate() + i);
      const e = new Date(s);
      e.setDate(s.getDate() + 1);
      cols.push({ key: `d${i}`, label: `${s.getDate()}`, start: s, end: e });
    }
  } else if (zoom === 'weeks') {
    // Show ~12 weeks
    const base = new Date(anchorDate);
    const dayOfWeek = base.getDay();
    base.setDate(base.getDate() - dayOfWeek - 14);
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 12; i++) {
      const s = new Date(base);
      s.setDate(base.getDate() + i * 7);
      const e = new Date(s);
      e.setDate(s.getDate() + 7);
      const wn = getWeekNumber(s);
      cols.push({ key: `w${i}`, label: `W${wn}`, subLabel: formatWeekRange(s), start: s, end: e });
    }
  } else if (zoom === 'months') {
    // Show ~8 months
    const base = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
    for (let i = 0; i < 8; i++) {
      const s = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const e = new Date(base.getFullYear(), base.getMonth() + i + 1, 1);
      cols.push({ key: `m${i}`, label: formatMonth(s), start: s, end: e });
    }
  } else if (zoom === 'quarters') {
    // Columns = months, spanning ~12 months (4 quarters)
    const startMonth = (getQuarter(anchorDate) - 2) * 3; // start 1 quarter before
    const startYear = anchorDate.getFullYear();
    const base = new Date(startYear, startMonth - 2, 1);
    for (let i = 0; i < 12; i++) {
      const s = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const e = new Date(base.getFullYear(), base.getMonth() + i + 1, 1);
      cols.push({ key: `qm${i}`, label: formatMonth(s), start: s, end: e });
    }
  } else if (zoom === 'half-year') {
    // Columns = quarters, spanning ~8 quarters (~2 years)
    const baseQ = getQuarter(anchorDate);
    const baseYear = anchorDate.getFullYear();
    for (let i = -2; i < 6; i++) {
      const rawQ = baseQ - 1 + i;
      const q = ((rawQ % 4) + 4) % 4 + 1;
      const y = baseYear + Math.floor((baseQ - 1 + i) / 4);
      const s = new Date(y, (q - 1) * 3, 1);
      const e = new Date(y, q * 3, 1);
      cols.push({ key: `hyq${i}`, label: `Q${q}`, start: s, end: e });
    }
  } else {
    // Years: columns = quarters, spanning ~16 quarters (~4 years)
    const baseYear = anchorDate.getFullYear();
    for (let yr = baseYear - 2; yr <= baseYear + 1; yr++) {
      for (let q = 1; q <= 4; q++) {
        const s = new Date(yr, (q - 1) * 3, 1);
        const e = new Date(yr, q * 3, 1);
        cols.push({ key: `yq${yr}q${q}`, label: `Q${q}`, start: s, end: e });
      }
    }
  }

  return cols;
}

// Generate group headers (higher level labels above columns)
function generateGroupHeaders(zoom: ZoomLevel, cols: ReturnType<typeof generateColumns>) {
  const groups: { label: string; span: number }[] = [];
  if (zoom === 'hours' || zoom === 'days') {
    // Group by month
    let currentMonth = '';
    let count = 0;
    for (const col of cols) {
      const m = col.start.toLocaleString('en-US', { month: 'long' });
      if (m !== currentMonth) {
        if (count > 0) groups.push({ label: currentMonth, span: count });
        currentMonth = m;
        count = 1;
      } else {
        count++;
      }
    }
    if (count > 0) groups.push({ label: currentMonth, span: count });
  } else if (zoom === 'weeks') {
    // Group by month
    let currentMonth = '';
    let count = 0;
    for (const col of cols) {
      const m = col.start.toLocaleString('en-US', { month: 'long' });
      if (m !== currentMonth) {
        if (count > 0) groups.push({ label: currentMonth, span: count });
        currentMonth = m;
        count = 1;
      } else {
        count++;
      }
    }
    if (count > 0) groups.push({ label: currentMonth, span: count });
  } else if (zoom === 'months') {
    // Group by quarter
    let currentQ = '';
    let count = 0;
    for (const col of cols) {
      const q = `Q${getQuarter(col.start)} ${col.start.getFullYear()}`;
      if (q !== currentQ) {
        if (count > 0) groups.push({ label: currentQ, span: count });
        currentQ = q;
        count = 1;
      } else {
        count++;
      }
    }
    if (count > 0) groups.push({ label: currentQ, span: count });
  } else if (zoom === 'quarters') {
    // Group by quarter
    let currentQ = '';
    let count = 0;
    for (const col of cols) {
      const q = `Q${getQuarter(col.start)} ${col.start.getFullYear()}`;
      if (q !== currentQ) {
        if (count > 0) groups.push({ label: currentQ, span: count });
        currentQ = q;
        count = 1;
      } else {
        count++;
      }
    }
    if (count > 0) groups.push({ label: currentQ, span: count });
  } else {
    // Half-year and Years: group by year
    let currentYear = -1;
    let count = 0;
    for (const col of cols) {
      const y = col.start.getFullYear();
      if (y !== currentYear) {
        if (count > 0) groups.push({ label: `${currentYear}`, span: count });
        currentYear = y;
        count = 1;
      } else {
        count++;
      }
    }
    if (count > 0) groups.push({ label: `${currentYear}`, span: count });
  }
  return groups;
}

export function TimelinePage() {
  const { projectId } = useParams();
  const { tasks, sections, projects, setSelectedTaskId, addTask, updateTask, addSection, deleteTask } = useApp();
  const [contextMenu, setContextMenu] = useState<{ taskId: string; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) setContextMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);
  const [zoom, setZoom] = useState<ZoomLevel>('months');
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const [anchorDate, setAnchorDate] = useState(new Date('2026-04-14'));
  const [sort, setSort] = useState<SortField>('none');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterIncomplete, setFilterIncomplete] = useState(true);
  const [filterCompleted, setFilterCompleted] = useState(false);
  const [filterJustMine, setFilterJustMine] = useState(false);
  const [filterDueThisWeek, setFilterDueThisWeek] = useState(false);
  const [filterDueNextWeek, setFilterDueNextWeek] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Inline task creation
  const [creating, setCreating] = useState<{ startDate: string; endDate: string; leftPct: number; widthPct: number; sectionId: string } | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  // Drag resize / move
  const [dragging, setDragging] = useState<{ taskId: string; edge: 'left' | 'right' | 'move'; startX: number; origStart: string; origEnd: string } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ taskId: string; startDate: string; endDate: string } | null>(null);

  const project = projects.find(p => p.id === (projectId || 'prj_001'));
  const projectTasks = tasks.filter(t => t.projectId === (projectId || 'prj_001') && !t.parentTaskId && t.dueDate);
  const projectSections = sections.filter(s => s.projectId === (projectId || 'prj_001'));

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) setShowZoomDropdown(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cols = useMemo(() => generateColumns(zoom, anchorDate), [zoom, anchorDate]);
  const groupHeaders = useMemo(() => generateGroupHeaders(zoom, cols), [zoom, cols]);

  const timelineStart = cols[0].start.getTime();
  const timelineEnd = cols[cols.length - 1].end.getTime();
  const totalDuration = timelineEnd - timelineStart;

  const isCardMode = zoom === 'quarters' || zoom === 'half-year' || zoom === 'years';

  const getTaskPosition = (task: typeof projectTasks[0]) => {
    const { startDate, endDate } = getTaskDates(task);
    const taskStart = new Date(startDate);
    const taskEnd = new Date(endDate);
    const left = Math.max(0, ((taskStart.getTime() - timelineStart) / totalDuration) * 100);
    const width = Math.max(1, ((taskEnd.getTime() - taskStart.getTime()) / totalDuration) * 100);
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  const getDueLabel = (dueDate: string) => {
    const due = new Date(dueDate);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff === -1) return 'Due yesterday';
    if (diff > 0) return `Due in ${diff} days`;
    return `Due ${Math.abs(diff)} days ago`;
  };

  const zoomIn = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1]);
  };
  const zoomOut = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1]);
  };

  const navigateBack = () => {
    const d = new Date(anchorDate);
    if (zoom === 'hours') d.setHours(d.getHours() - 12);
    else if (zoom === 'days') d.setDate(d.getDate() - 14);
    else if (zoom === 'weeks') d.setDate(d.getDate() - 28);
    else if (zoom === 'months') d.setMonth(d.getMonth() - 4);
    else if (zoom === 'quarters') d.setMonth(d.getMonth() - 9);
    else if (zoom === 'half-year') d.setFullYear(d.getFullYear() - 1);
    else d.setFullYear(d.getFullYear() - 2);
    setAnchorDate(d);
  };
  const navigateForward = () => {
    const d = new Date(anchorDate);
    if (zoom === 'hours') d.setHours(d.getHours() + 12);
    else if (zoom === 'days') d.setDate(d.getDate() + 14);
    else if (zoom === 'weeks') d.setDate(d.getDate() + 28);
    else if (zoom === 'months') d.setMonth(d.getMonth() + 4);
    else if (zoom === 'quarters') d.setMonth(d.getMonth() + 9);
    else if (zoom === 'half-year') d.setFullYear(d.getFullYear() + 1);
    else d.setFullYear(d.getFullYear() + 2);
    setAnchorDate(d);
  };

  // Apply filters and sort
  const now = new Date('2026-04-14');
  const thisWeekEnd = new Date('2026-04-19');
  const nextWeekStart = new Date('2026-04-20');
  const nextWeekEnd = new Date('2026-04-26');

  const getFilteredTasks = (taskList: typeof projectTasks) => {
    let filtered = taskList;
    if (filterIncomplete && !filterCompleted) filtered = filtered.filter(t => !t.completed);
    else if (!filterIncomplete && filterCompleted) filtered = filtered.filter(t => t.completed);
    else if (!filterIncomplete && !filterCompleted) filtered = [];

    if (filterJustMine) filtered = filtered.filter(t => t.assigneeId === currentUserId);
    if (filterDueThisWeek) filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= thisWeekEnd);
    if (filterDueNextWeek) filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) >= nextWeekStart && new Date(t.dueDate) <= nextWeekEnd);

    if (sort === 'start_date') filtered = [...filtered].sort((a, b) => (a.startDate || a.dueDate || '').localeCompare(b.startDate || b.dueDate || ''));
    else if (sort === 'due_date') filtered = [...filtered].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    else if (sort === 'assignee') filtered = [...filtered].sort((a, b) => (a.assigneeId || '').localeCompare(b.assigneeId || ''));
    return filtered;
  };

  const clearFilters = () => {
    setFilterIncomplete(true);
    setFilterCompleted(false);
    setFilterJustMine(false);
    setFilterDueThisWeek(false);
    setFilterDueNextWeek(false);
  };

  // Convert pixel X position on grid to a date
  const pxToDate = (clientX: number): Date => {
    if (!gridRef.current) return new Date(anchorDate);
    const rect = gridRef.current.getBoundingClientRect();
    const scrollLeft = gridRef.current.parentElement?.scrollLeft || 0;
    const totalW = gridRef.current.scrollWidth;
    const pct = (clientX - rect.left + scrollLeft) / totalW;
    const ts = timelineStart + pct * totalDuration;
    return new Date(ts);
  };

  const formatDateShort = (d: Date | string): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Click on empty grid area to create task
  const handleGridClick = (e: React.MouseEvent, sectionId?: string) => {
    if ((e.target as HTMLElement).closest('[data-task-bar]')) return;
    if ((e.target as HTMLElement).closest('[data-creating]')) return;
    if (!project) return;

    // Ensure we have a section
    let sid = sectionId;
    if (!sid) {
      if (projectSections.length > 0) {
        sid = projectSections[0].id;
      } else {
        const newSection = addSection('Untitled section', project.id);
        sid = newSection.id;
      }
    }

    const clickDate = pxToDate(e.clientX);
    clickDate.setHours(0, 0, 0, 0);

    // Find which column was clicked to set the date range
    const clickedCol = cols.find(col => clickDate >= col.start && clickDate < col.end);
    let startDate: Date;
    let endDate: Date;
    if (clickedCol) {
      startDate = new Date(clickedCol.start);
      endDate = new Date(clickedCol.end);
      // For larger zoom levels, narrow the range a bit
      if (zoom === 'months' || zoom === 'quarters') {
        startDate = new Date(clickDate);
        endDate = new Date(clickDate);
        endDate.setDate(endDate.getDate() + 14);
      }
    } else {
      startDate = new Date(clickDate);
      endDate = new Date(clickDate);
      endDate.setDate(endDate.getDate() + 7);
    }

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    const leftPct = Math.max(0, ((startDate.getTime() - timelineStart) / totalDuration) * 100);
    const widthPct = Math.max(2, ((endDate.getTime() - startDate.getTime()) / totalDuration) * 100);

    setCreating({ startDate: startStr, endDate: endStr, leftPct, widthPct, sectionId: sid });
    setNewTaskTitle('');
    setTimeout(() => newTaskInputRef.current?.focus(), 50);
  };

  const handleCreateSubmit = () => {
    if (!creating || !project) return;
    if (newTaskTitle.trim()) {
      const newTask = addTask({
        title: newTaskTitle.trim(),
        sectionId: creating.sectionId,
        projectId: project.id,
        startDate: creating.startDate,
        dueDate: creating.endDate,
      });
      setSelectedTaskId(newTask.id);
    }
    setCreating(null);
    setNewTaskTitle('');
  };

  // Snap a date to the nearest column boundary
  const snapToCol = (date: Date): Date => {
    let closest = date;
    let minDist = Infinity;
    for (const col of cols) {
      const dStart = Math.abs(date.getTime() - col.start.getTime());
      const dEnd = Math.abs(date.getTime() - col.end.getTime());
      if (dStart < minDist) { minDist = dStart; closest = new Date(col.start); }
      if (dEnd < minDist) { minDist = dEnd; closest = new Date(col.end); }
    }
    return closest;
  };

  // Drag resize / move handlers
  const handleDragStart = (e: React.MouseEvent, taskId: string, edge: 'left' | 'right' | 'move') => {
    e.stopPropagation();
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setDragging({
      taskId,
      edge,
      startX: e.clientX,
      origStart: task.startDate || task.dueDate || '',
      origEnd: task.dueDate || '',
    });
    setDragPreview({ taskId, startDate: task.startDate || task.dueDate || '', endDate: task.dueDate || '' });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;
      const totalW = gridRef.current.scrollWidth;
      const dx = e.clientX - dragging.startX;
      const dtMs = (dx / totalW) * totalDuration;

      let newStart = dragging.origStart;
      let newEnd = dragging.origEnd;

      if (dragging.edge === 'move') {
        // Move the entire bar, preserving duration
        const origStartMs = new Date(dragging.origStart).getTime();
        const origEndMs = new Date(dragging.origEnd).getTime();
        const duration = origEndMs - origStartMs;
        const movedStart = snapToCol(new Date(origStartMs + dtMs));
        movedStart.setHours(0, 0, 0, 0);
        const movedEnd = new Date(movedStart.getTime() + duration);
        movedEnd.setHours(0, 0, 0, 0);
        newStart = movedStart.toISOString().slice(0, 10);
        newEnd = movedEnd.toISOString().slice(0, 10);
      } else if (dragging.edge === 'right') {
        const origEnd = new Date(dragging.origEnd).getTime();
        const snapped = snapToCol(new Date(origEnd + dtMs));
        snapped.setHours(0, 0, 0, 0);
        newEnd = snapped.toISOString().slice(0, 10);
        if (new Date(newEnd) < new Date(newStart)) newEnd = newStart;
      } else {
        const origStart = new Date(dragging.origStart).getTime();
        const snapped = snapToCol(new Date(origStart + dtMs));
        snapped.setHours(0, 0, 0, 0);
        newStart = snapped.toISOString().slice(0, 10);
        if (new Date(newStart) > new Date(newEnd)) newStart = newEnd;
      }
      setDragPreview({ taskId: dragging.taskId, startDate: newStart, endDate: newEnd });
    };

    const handleMouseUp = () => {
      if (dragPreview) {
        updateTask(dragPreview.taskId, {
          startDate: dragPreview.startDate,
          dueDate: dragPreview.endDate,
        });
      }
      setDragging(null);
      setDragPreview(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragPreview, totalDuration, updateTask, cols]);

  const getTaskDates = (task: typeof projectTasks[0]) => {
    if (dragPreview && dragPreview.taskId === task.id) {
      return { startDate: dragPreview.startDate, endDate: dragPreview.endDate };
    }
    return { startDate: task.startDate || task.dueDate!, endDate: task.dueDate! };
  };

  const handleAddTask = () => {
    if (!project || projectSections.length === 0) return;
    addTask({ title: 'New task', sectionId: projectSections[0].id, projectId: project.id, dueDate: new Date().toISOString().slice(0, 10) });
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
    fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
    cursor: 'pointer', border: 'none', background: 'transparent',
  };

  // Today indicator position
  const today = new Date('2026-04-14');
  const todayPos = ((today.getTime() - timelineStart) / totalDuration) * 100;
  const showTodayLine = todayPos >= 0 && todayPos <= 100;

  const colWidth = zoom === 'hours' ? 60 : zoom === 'days' ? 40 : undefined;
  const useFixedWidth = colWidth !== undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, flexShrink: 0 }}>
        {/* Add task */}
        <button onClick={handleAddTask} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
          fontSize: 12, color: 'var(--text-primary)', borderRadius: 'var(--radius-btn)',
          border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Plus size={12} strokeWidth={2.5} />
          Add task
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 4px' }} />

        {/* Nav arrows */}
        <button onClick={navigateBack} style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
        <button onClick={() => setAnchorDate(new Date('2026-04-14'))} style={{ ...btnStyle, padding: '4px 10px' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          Today
        </button>
        <button onClick={navigateForward} style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ChevronRight size={14} strokeWidth={2} />
        </button>

        <div style={{ flex: 1 }} />

        {/* Zoom level selector */}
        <div ref={zoomRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowZoomDropdown(v => !v)} style={{
            ...btnStyle, padding: '4px 10px', border: '1px solid var(--border-default)',
            borderRadius: 16, fontWeight: 500,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {ZOOM_LABELS[zoom]}
            <ChevronDown size={12} strokeWidth={2} />
          </button>
          {showZoomDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
              background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
              padding: 4, width: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {ZOOM_LEVELS.map(z => (
                <button key={z} onClick={() => { setZoom(z); setShowZoomDropdown(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', width: '100%',
                  borderRadius: 4, fontSize: 13,
                  color: zoom === z ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: zoom === z ? 500 : 400,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {zoom === z && <span style={{ fontSize: 14 }}>&#10003;</span>}
                  {zoom !== z && <span style={{ width: 14 }} />}
                  {ZOOM_LABELS[z]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom out (-) */}
        <button onClick={zoomOut} style={btnStyle} title="Zoom out"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Minus size={14} strokeWidth={2} />
        </button>
        {/* Zoom in (+) */}
        <button onClick={zoomIn} style={btnStyle} title="Zoom in"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Plus size={14} strokeWidth={2} />
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 4px' }} />

        {/* Filter */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button onClick={() => { setShowFilterDropdown(v => !v); setShowSortDropdown(false); }} style={btnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Filter size={12} strokeWidth={1.8} />Filter
          </button>
          {showFilterDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
              background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
              padding: 16, width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Filters</span>
                <button onClick={clearFilters} style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', background: 'transparent', border: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Clear
                </button>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10 }}>Quick filters</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Incomplete tasks', active: filterIncomplete, toggle: () => setFilterIncomplete(v => !v) },
                  { label: 'Completed tasks', active: filterCompleted, toggle: () => setFilterCompleted(v => !v) },
                  { label: 'Just my tasks', active: filterJustMine, toggle: () => setFilterJustMine(v => !v) },
                  { label: 'Due this week', active: filterDueThisWeek, toggle: () => setFilterDueThisWeek(v => !v) },
                  { label: 'Due next week', active: filterDueNextWeek, toggle: () => setFilterDueNextWeek(v => !v) },
                ].map(f => (
                  <button key={f.label} onClick={f.toggle} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20, fontSize: 13,
                    border: f.active ? '1px solid var(--text-primary)' : '1px solid var(--border-default)',
                    background: f.active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: f.active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => { if (!f.active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!f.active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <div ref={sortRef} style={{ position: 'relative' }}>
          <button onClick={() => { setShowSortDropdown(v => !v); setShowFilterDropdown(false); }} style={btnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ArrowUpDown size={12} strokeWidth={1.8} />Sort
          </button>
          {showSortDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
              background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
              padding: 4, width: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {([['none', 'None'], ['start_date', 'Start date'], ['due_date', 'Due date'], ['assignee', 'Assignee']] as const).map(([val, label]) => (
                <button key={val} onClick={() => { setSort(val); setShowSortDropdown(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', width: '100%',
                  borderRadius: 4, fontSize: 13,
                  color: sort === val ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: sort === val ? 500 : 400,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {sort === val ? <span style={{ fontSize: 12 }}>&#10003;</span> : <span style={{ width: 12 }} />}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <button style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Settings size={12} strokeWidth={1.8} />Options
        </button>

        <button style={{
          ...btnStyle, padding: '4px 12px', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-btn)', fontWeight: 500,
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          Save view
        </button>
      </div>

      {/* Timeline grid */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border-divider)', borderRadius: 4 }}>
        <div ref={gridRef} style={{ minWidth: useFixedWidth ? cols.length * colWidth! : undefined, position: 'relative' }}>
          {/* Today indicator line */}
          {showTodayLine && (
            <>
              <div style={{
                position: 'absolute', left: `${todayPos}%`, top: 0, bottom: 0,
                width: 2, background: '#4573d2', zIndex: 10, pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', left: `${todayPos}%`, top: 0,
                width: 8, height: 8, borderRadius: '50%', background: '#4573d2',
                transform: 'translateX(-3px)', zIndex: 10, pointerEvents: 'none',
              }} />
            </>
          )}
          {/* Group headers (quarters over months, months over weeks/days) */}
          {groupHeaders && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-divider)' }}>
              {groupHeaders.map((g, i) => (
                <div key={i} style={{
                  flex: useFixedWidth ? undefined : g.span,
                  width: useFixedWidth ? g.span * colWidth! : undefined,
                  padding: '4px 8px', fontSize: 12, fontWeight: 500,
                  color: 'var(--text-primary)',
                  borderRight: '1px solid var(--border-divider)',
                }}>
                  {g.label}
                </div>
              ))}
            </div>
          )}

          {/* Column headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-divider)', position: 'sticky', top: 0, background: 'var(--bg-content)', zIndex: 5 }}>
            {cols.map(col => (
              <div key={col.key} style={{
                flex: useFixedWidth ? undefined : 1,
                width: useFixedWidth ? colWidth : undefined,
                padding: '6px 4px', fontSize: 11,
                color: 'var(--text-placeholder)', textAlign: 'center',
                borderRight: '1px solid var(--border-divider)',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}>
                {col.subLabel ? (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{col.label}</div>
                    <div style={{ fontSize: 11 }}>{col.subLabel}</div>
                  </div>
                ) : col.label}
              </div>
            ))}
          </div>

          {/* Task rows grouped by section */}
          {projectSections.map(section => {
            const sectionTasks = getFilteredTasks(projectTasks.filter(t => t.sectionId === section.id));
            return (
              <div key={section.id}>
                <div style={{
                  padding: '6px 8px', fontWeight: 600, fontSize: 12,
                  borderBottom: '1px solid var(--border-divider)',
                  color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)',
                }}>
                  {section.name}
                </div>
                {sectionTasks.map(task => {
                  const pos = getTaskPosition(task);
                  const { startDate: tStart, endDate: tEnd } = getTaskDates(task);
                  const isDraggingThis = dragPreview?.taskId === task.id;
                  return (
                    <div key={task.id} style={{
                      display: 'flex', position: 'relative', borderBottom: '1px solid var(--border-divider)',
                      minHeight: isCardMode ? 52 : 36, cursor: 'pointer',
                    }}
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('[data-task-bar]')) {
                          handleGridClick(e, section.id);
                        }
                      }}
                    >
                      {/* Column grid lines */}
                      {cols.map((col) => (
                        <div key={col.key} style={{
                          flex: useFixedWidth ? undefined : 1,
                          width: useFixedWidth ? colWidth : undefined,
                          borderRight: '1px solid var(--border-divider)',
                          minHeight: isCardMode ? 52 : 36,
                        }} />
                      ))}

                      {/* Date badge shown when dragging/moving */}
                      {isDraggingThis && (
                        <div style={{
                          position: 'absolute', left: pos.left, top: -20, zIndex: 20,
                          background: '#4573d2', color: '#fff', fontSize: 11, fontWeight: 500,
                          padding: '2px 10px', borderRadius: 4, whiteSpace: 'nowrap',
                          display: 'flex', justifyContent: 'space-between', gap: 16,
                          width: pos.width, minWidth: 'fit-content',
                        }}>
                          <span>{formatDateShort(tStart)}</span>
                          <span>{formatDateShort(tEnd)}</span>
                        </div>
                      )}

                      {isCardMode ? (
                        /* Card-style task display for high zoom */
                        <div data-task-bar style={{
                          position: 'absolute',
                          left: pos.left,
                          top: 4,
                          zIndex: 2,
                          display: 'flex', alignItems: 'flex-start', gap: 6,
                          paddingLeft: 4, cursor: 'pointer',
                        }}
                          onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ taskId: task.id, x: e.clientX, y: e.clientY }); }}
                        >
                          <span style={{
                            width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                            border: `1.5px solid ${task.completed ? 'var(--color-success)' : 'var(--text-tertiary)'}`,
                            background: task.completed ? 'var(--color-success)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: '#fff',
                          }}>
                            {task.completed && '\u2713'}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {task.title}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                              {task.dueDate && getDueLabel(task.dueDate)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Bar-style task display with drag handles */
                        <div data-task-bar style={{
                          position: 'absolute',
                          left: pos.left,
                          width: pos.width,
                          top: 6,
                          height: 24,
                          background: isDraggingThis ? '#4573d2' : (project?.color || 'var(--color-primary)'),
                          borderRadius: 4,
                          border: isDraggingThis ? '2px solid #6b9eff' : 'none',
                          opacity: task.completed ? 0.4 : 0.85,
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 10,
                          color: '#fff',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          zIndex: isDraggingThis ? 15 : 2,
                          cursor: isDraggingThis ? 'grabbing' : 'grab',
                          userSelect: 'none',
                        }}
                          onClick={(e) => { e.stopPropagation(); if (!dragging) setSelectedTaskId(task.id); }}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ taskId: task.id, x: e.clientX, y: e.clientY }); }}
                        >
                          {/* Left resize handle */}
                          <div
                            style={{
                              width: 10, height: '100%', cursor: 'ew-resize', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onMouseDown={(e) => handleDragStart(e, task.id, 'left')}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ width: 2, height: 10, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
                          </div>
                          {/* Task content - draggable to move */}
                          <div
                            style={{ flex: 1, overflow: 'hidden', paddingLeft: 2, cursor: isDraggingThis ? 'grabbing' : 'grab' }}
                            onMouseDown={(e) => handleDragStart(e, task.id, 'move')}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {task.completed && <span style={{ marginRight: 4 }}>&#10003;</span>}
                            {task.title}
                          </div>
                          {/* Right resize handle */}
                          <div
                            style={{
                              width: 10, height: '100%', cursor: 'ew-resize', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onMouseDown={(e) => handleDragStart(e, task.id, 'right')}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ width: 2, height: 10, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            );
          })}

          {/* Grid body with vertical lines - fills remaining space, always clickable */}
          <div
            style={{
              display: 'flex', position: 'relative', minHeight: 'calc(100vh - 280px)',
              cursor: 'crosshair',
            }}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('[data-task-bar]')) return;
              if ((e.target as HTMLElement).closest('[data-creating]')) return;
              handleGridClick(e);
            }}
          >
            {cols.map((col) => (
              <div key={col.key} style={{
                flex: useFixedWidth ? undefined : 1,
                width: useFixedWidth ? colWidth : undefined,
                borderRight: '1px solid var(--border-divider)',
                minHeight: '100%',
              }} />
            ))}

            {/* Inline creation */}
            {creating && (
              <div data-creating style={{
                position: 'absolute', left: `${creating.leftPct}%`, top: 0,
                zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              }}>
                {/* Date badge */}
                <div style={{
                  background: '#4573d2', color: '#fff', fontSize: 11, fontWeight: 500,
                  padding: '3px 10px', borderRadius: 4, whiteSpace: 'nowrap', marginBottom: 6,
                }}>
                  {formatDateShort(creating.startDate)} – {formatDateShort(creating.endDate)}
                </div>
                {/* Task input */}
                <div style={{
                  width: Math.max(120, 160),
                  height: 32,
                  background: 'var(--bg-input)',
                  borderRadius: 6,
                  border: '1px solid var(--border-default)',
                  display: 'flex', alignItems: 'center', padding: '0 8px',
                }}>
                  <input
                    ref={newTaskInputRef}
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateSubmit();
                      if (e.key === 'Escape') { setCreating(null); setNewTaskTitle(''); }
                    }}
                    onBlur={() => { setTimeout(handleCreateSubmit, 100); }}
                    placeholder="Write a task name"
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100,
            background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
            padding: 4, width: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <button
            onClick={() => { deleteTask(contextMenu.taskId); setContextMenu(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%',
              borderRadius: 4, fontSize: 13, color: 'var(--color-error)',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={13} /> Delete task
          </button>
        </div>
      )}
    </div>
  );
}
