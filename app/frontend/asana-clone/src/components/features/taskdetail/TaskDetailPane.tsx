import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../data/AppContext';
import { users, currentUserId, teamMembers } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { AssigneeDropdown } from '../../common/AssigneeDropdown';
import { X, Calendar, Plus, Info, ChevronDown, ChevronLeft, ChevronRight, Check, UserPlus } from 'lucide-react';

const myTaskSectionOptions = ['Recently assigned', 'Do today', 'Do next week', 'Do later'];

const priorityOptions = [
  { value: '', label: '—', color: '' },
  { value: 'Low', label: 'Low', color: '#5da283' },
  { value: 'Medium', label: 'Medium', color: '#f0b849' },
  { value: 'High', label: 'High', color: '#c27aeb' },
];

const statusOptions = [
  { value: '', label: '—', color: '' },
  { value: 'On track', label: 'On track', color: '#6bb5e0' },
  { value: 'At risk', label: 'At risk', color: '#f0d26b' },
  { value: 'Off track', label: 'Off track', color: '#f09a9a' },
];

export function TaskDetailPane({ closing }: { closing?: boolean }) {
  const { tasks, selectedTaskId, setSelectedTaskId, updateTask, completeTask, comments, addComment, likeComment, projects, sections } = useApp();
  const [commentText, setCommentText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showInvitePopover, setShowInvitePopover] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showProjectSectionDropdown, setShowProjectSectionDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'due'>('start');
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    const d = new Date('2026-04-14');
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [projectExpanded, setProjectExpanded] = useState(true);
  const [hoveredProjectRow, setHoveredProjectRow] = useState(false);
  const sectionDropdownRef = useRef<HTMLDivElement>(null);
  const inviteRef = useRef<HTMLDivElement>(null);
  const addProjectRef = useRef<HTMLDivElement>(null);
  const projectSectionRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const task = tasks.find(t => t.id === selectedTaskId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(e.target as Node)) {
        setShowSectionDropdown(false);
      }
      if (inviteRef.current && !inviteRef.current.contains(e.target as Node)) {
        setShowInvitePopover(false);
        setInviteSearch('');
      }
      if (addProjectRef.current && !addProjectRef.current.contains(e.target as Node)) {
        setShowAddProject(false);
      }
      if (projectSectionRef.current && !projectSectionRef.current.contains(e.target as Node)) {
        setShowProjectSectionDropdown(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!task) return null;

  const assignee = users.find(u => u.id === task.assigneeId);
  const project = projects.find(p => p.id === task.projectId);
  const section = sections.find(s => s.id === task.sectionId);
  const taskComments = comments.filter(c => c.taskId === task.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Available projects to add (exclude currently assigned)
  const availableProjects = projects.filter(p => p.id !== task.projectId && !p.archived);

  // Sections for the current project
  const projectSections = project ? sections.filter(s => s.projectId === project.id) : [];

  // Get team members for the project's team for invite
  const projectTeam = project ? projects.find(p => p.id === project.id) : null;
  const teamId = projectTeam?.teamId;
  const teamUserIds = teamId ? teamMembers.filter(tm => tm.teamId === teamId).map(tm => tm.userId) : [];
  const inviteableUsers = users.filter(u => {
    if (u.id === currentUserId) return false;
    if (u.id === task.assigneeId) return false;
    if (!teamUserIds.includes(u.id)) return true; // show non-team users too
    return true;
  });
  const filteredInviteUsers = inviteSearch
    ? inviteableUsers.filter(u => u.name.toLowerCase().includes(inviteSearch.toLowerCase()) || u.email.toLowerCase().includes(inviteSearch.toLowerCase()))
    : inviteableUsers;

  const currentSection = task.myTaskSection || 'Recently assigned';

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

  const startEditTitle = () => {
    setTitleValue(task.title);
    setEditingTitle(true);
  };

  const saveTitle = () => {
    if (titleValue.trim() && titleValue !== task.title) {
      updateTask(task.id, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const formatDate = () => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const dueFmt = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (task.startDate) {
      const start = new Date(task.startDate);
      const startFmt = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startFmt} – ${dueFmt}`;
    }
    return dueFmt;
  };

  const handleRemoveProject = () => {
    updateTask(task.id, { projectId: '', sectionId: '', customFieldValues: {} });
  };

  const handleAddProject = (projectId: string) => {
    const firstSection = sections.find(s => s.projectId === projectId);
    updateTask(task.id, {
      projectId,
      sectionId: firstSection?.id || '',
      customFieldValues: { ...task.customFieldValues },
    });
    setShowAddProject(false);
  };

  const handleChangeSection = (sectionId: string) => {
    updateTask(task.id, { sectionId });
    setShowProjectSectionDropdown(false);
  };

  const handleChangePriority = (value: string) => {
    updateTask(task.id, {
      customFieldValues: { ...task.customFieldValues, cf1: value },
    });
    setShowPriorityDropdown(false);
  };

  const handleChangeStatus = (value: string) => {
    updateTask(task.id, {
      customFieldValues: { ...task.customFieldValues, cf2: value },
    });
    setShowStatusDropdown(false);
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 12, color: 'var(--text-secondary)', minWidth: 90, paddingTop: 2,
  };

  const fieldRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
    minWidth: 180, background: '#2a2d2f', border: '1px solid var(--border-divider)',
    borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    overflow: 'hidden', padding: '4px 0',
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '50%',
      minWidth: 400,
      maxWidth: 600,
      borderLeft: '1px solid var(--border-divider)',
      background: '#1D1F21',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 20,
      boxShadow: '-4px 0 16px rgba(0,0,0,0.3)',
      animation: closing ? 'slideOutRight 0.2s ease-in forwards' : 'slideInRight 0.2s ease-out',
    }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border-divider)' }}>
        {/* Mark complete button */}
        <button
          onClick={() => completeTask(task.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 'var(--radius-btn)', fontSize: 12, fontWeight: 400,
            border: `1px solid ${task.completed ? '#5da283' : 'var(--border-input)'}`,
            color: task.completed ? '#5da283' : 'var(--text-primary)',
            background: task.completed ? 'rgba(93,162,131,0.1)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            if (!task.completed) {
              e.currentTarget.style.borderColor = '#5da283';
              e.currentTarget.style.color = '#5da283';
            }
          }}
          onMouseLeave={e => {
            if (!task.completed) {
              e.currentTarget.style.borderColor = 'var(--border-input)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
        >
          {task.completed ? <Check size={12} strokeWidth={2.5} /> : <Check size={12} strokeWidth={1.5} />}
          {task.completed ? 'Completed' : 'Mark complete'}
        </button>

        <div style={{ flex: 1 }} />

        {/* Assignee avatar + invite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }} ref={inviteRef}>
          <Avatar userId={task.assigneeId} size={24} />
          <button
            onClick={() => setShowInvitePopover(!showInvitePopover)}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--color-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            title="Invite collaborators"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>

          {/* Invite popover */}
          {showInvitePopover && (
            <div style={{
              position: 'absolute', top: 32, right: 0, zIndex: 100,
              width: 280, background: '#2a2d2f', border: '1px solid var(--border-divider)',
              borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-divider)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <UserPlus size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Invite to collaborate</span>
                </div>
                <input
                  autoFocus
                  value={inviteSearch}
                  onChange={e => setInviteSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  style={{
                    width: '100%', padding: '6px 8px', fontSize: 12,
                    background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                    borderRadius: 'var(--radius-input)', color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div style={{ maxHeight: 200, overflow: 'auto', padding: '4px 0' }}>
                {filteredInviteUsers.length === 0 ? (
                  <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-placeholder)', textAlign: 'center' }}>
                    No users found
                  </div>
                ) : filteredInviteUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      updateTask(task.id, { assigneeId: user.id });
                      setShowInvitePopover(false);
                      setInviteSearch('');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '8px 12px', textAlign: 'left',
                      background: 'transparent', cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Avatar userId={user.id} size={24} />
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>{user.email}</div>
                    </div>
                    {teamUserIds.includes(user.id) && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 10, color: 'var(--text-secondary)',
                        background: 'var(--bg-input)', borderRadius: 4, padding: '1px 5px',
                      }}>Team</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Close */}
        <button onClick={() => setSelectedTaskId(null)} style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4, borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {/* Visibility notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
          This task is visible to everyone in My workspace.
          <Info size={12} strokeWidth={1.8} style={{ color: 'var(--text-placeholder)' }} />
        </div>

        {/* Title */}
        {editingTitle ? (
          <input autoFocus value={titleValue} onChange={e => setTitleValue(e.target.value)}
            onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            style={{ fontSize: 20, fontWeight: 500, width: '100%', background: 'transparent', border: 'none', padding: 0, marginBottom: 20, color: 'var(--text-primary)' }}
          />
        ) : (
          <h2
            onClick={startEditTitle}
            style={{
              fontSize: 20, fontWeight: 500, marginBottom: 20, cursor: 'text',
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
            }}
          >{task.title}</h2>
        )}

        {/* Fields */}
        <div style={{ marginBottom: 20 }}>
          {/* Assignee */}
          <div style={fieldRowStyle}>
            <span style={fieldLabelStyle}>Assignee</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
              <button
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', cursor: 'pointer', padding: '2px 4px',
                  borderRadius: 4, transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar userId={task.assigneeId} size={22} />
                <span style={{ fontSize: 13 }}>{assignee?.name || 'Unassigned'}</span>
              </button>
              {assignee && (
                <button
                  onClick={() => updateTask(task.id, { assigneeId: undefined })}
                  style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 2 }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}

              {showAssigneeDropdown && (
                <AssigneeDropdown
                  assigneeId={task.assigneeId}
                  teamId={teamId}
                  onSelect={(userId) => updateTask(task.id, { assigneeId: userId || undefined })}
                  onClose={() => setShowAssigneeDropdown(false)}
                />
              )}

              {/* My Task Section dropdown */}
              <div style={{ position: 'relative' }} ref={sectionDropdownRef}>
                <button
                  onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    fontSize: 12, color: 'var(--text-placeholder)',
                    cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
                    background: 'transparent', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {currentSection}
                  <ChevronDown size={10} strokeWidth={2} />
                </button>

                {showSectionDropdown && (
                  <div style={dropdownStyle}>
                    {myTaskSectionOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          updateTask(task.id, { myTaskSection: option });
                          setShowSectionDropdown(false);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '7px 12px', textAlign: 'left',
                          fontSize: 13, color: 'var(--text-primary)',
                          background: option === currentSection ? 'var(--bg-sidebar-hover)' : 'transparent',
                          cursor: 'pointer', transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                        onMouseLeave={e => { if (option !== currentSection) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {option === currentSection && <Check size={12} strokeWidth={2.5} style={{ color: 'var(--color-primary)' }} />}
                        {option !== currentSection && <span style={{ width: 12 }} />}
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Due date */}
          <div style={fieldRowStyle}>
            <span style={fieldLabelStyle}>Due date</span>
            <div style={{ position: 'relative' }} ref={datePickerRef}>
              <button
                onClick={() => {
                  const ref = task.dueDate || task.startDate;
                  if (ref) {
                    const d = new Date(ref);
                    setDatePickerMonth({ year: d.getFullYear(), month: d.getMonth() });
                  } else {
                    setDatePickerMonth({ year: 2026, month: 3 });
                  }
                  // If both dates exist, start fresh in start mode; if start exists but no due, continue in due mode
                  if (task.startDate && !task.dueDate) {
                    setDatePickerMode('due');
                  } else {
                    setDatePickerMode('start');
                  }
                  setHoveredDay(null);
                  setShowDatePicker(!showDatePicker);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', cursor: 'pointer', padding: '2px 4px',
                  borderRadius: 4, transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Calendar size={13} strokeWidth={1.8} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {formatDate() || 'No due date'}
                </span>
              </button>

              {showDatePicker && (() => {
                const daysInMonth = new Date(datePickerMonth.year, datePickerMonth.month + 1, 0).getDate();
                const firstDay = new Date(datePickerMonth.year, datePickerMonth.month, 1).getDay();
                const monthName = new Date(datePickerMonth.year, datePickerMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                const toDateStr = (day: number) =>
                  `${datePickerMonth.year}-${String(datePickerMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                const toDateStrFull = (year: number, month: number, day: number) =>
                  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                const formatInputDate = (d: string | null) => {
                  if (!d) return '';
                  const date = new Date(d + 'T00:00:00');
                  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${String(date.getFullYear()).slice(2)}`;
                };

                // Determine effective range (committed or hover preview)
                const effectiveStart = task.startDate;
                const effectiveDue = datePickerMode === 'due' && task.startDate && !task.dueDate && hoveredDay
                  ? hoveredDay
                  : task.dueDate;
                const isPreview = datePickerMode === 'due' && task.startDate && !task.dueDate && hoveredDay;

                const isInRange = (dateStr: string) => {
                  if (!effectiveStart || !effectiveDue) return false;
                  return dateStr >= effectiveStart && dateStr <= effectiveDue;
                };

                const isStart = (dateStr: string) => effectiveStart === dateStr;
                const isDue = (dateStr: string) => effectiveDue === dateStr;

                const prevMonth = () => setDatePickerMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
                const nextMonth = () => setDatePickerMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

                // Previous month trailing days
                const prevMonthDays = new Date(datePickerMonth.year, datePickerMonth.month, 0).getDate();
                // Previous month year/month for date strings
                const prevMYear = datePickerMonth.month === 0 ? datePickerMonth.year - 1 : datePickerMonth.year;
                const prevMMonth = datePickerMonth.month === 0 ? 11 : datePickerMonth.month - 1;

                // Helper for range pill styling
                const getDayStyle = (dateStr: string, isOtherMonth: boolean): React.CSSProperties => {
                  const inRange = isInRange(dateStr);
                  const start = isStart(dateStr);
                  const due = isDue(dateStr);
                  const isEndpoint = start || due;
                  const isSingleDay = start && due;

                  let bg = 'transparent';
                  let borderRadius = '0';

                  if (isSingleDay) {
                    bg = isPreview ? 'rgba(78,130,238,0.35)' : 'var(--color-primary)';
                    borderRadius = '50%';
                  } else if (isEndpoint) {
                    bg = isPreview ? 'rgba(78,130,238,0.35)' : 'var(--color-primary)';
                    borderRadius = start ? '50% 0 0 50%' : '0 50% 50% 0';
                  } else if (inRange) {
                    bg = isPreview ? 'rgba(78,130,238,0.15)' : 'rgba(78,130,238,0.2)';
                  }

                  return {
                    textAlign: 'center' as const,
                    padding: '6px 0',
                    fontSize: 12,
                    cursor: isOtherMonth ? 'default' : 'pointer',
                    borderRadius,
                    background: bg,
                    color: isEndpoint && !isPreview ? '#fff' : isOtherMonth ? 'var(--text-placeholder)' : 'var(--text-primary)',
                    fontWeight: isEndpoint ? 600 : 400,
                    opacity: isOtherMonth && !inRange ? 0.4 : 1,
                    transition: 'background 0.1s',
                  };
                };

                return (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 200,
                    width: 300, background: '#232527', border: '1px solid var(--border-divider)',
                    borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    padding: 0,
                  }}>
                    {/* Start / Due inputs */}
                    <div style={{ display: 'flex', gap: 8, padding: '12px 12px 8px' }}>
                      <div
                        onClick={() => setDatePickerMode('start')}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 10px', borderRadius: 6,
                          border: `1px solid ${datePickerMode === 'start' ? 'var(--text-primary)' : 'var(--border-input)'}`,
                          cursor: 'pointer', background: '#1a1c1e',
                        }}
                      >
                        <span style={{ fontSize: 12, color: task.startDate ? 'var(--text-primary)' : 'var(--text-placeholder)', flex: 1 }}>
                          {formatInputDate(task.startDate) || 'Start date'}
                        </span>
                        {task.startDate && (
                          <button onClick={e => { e.stopPropagation(); updateTask(task.id, { startDate: null }); setDatePickerMode('start'); }}
                            style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 0 }}>
                            <X size={12} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                      <div
                        onClick={() => setDatePickerMode('due')}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 10px', borderRadius: 6,
                          border: `1px solid ${datePickerMode === 'due' ? 'var(--text-primary)' : 'var(--border-input)'}`,
                          cursor: 'pointer', background: '#1a1c1e',
                        }}
                      >
                        <span style={{ fontSize: 12, color: task.dueDate ? 'var(--text-primary)' : 'var(--text-placeholder)', flex: 1 }}>
                          {formatInputDate(task.dueDate) || 'Due date'}
                        </span>
                        {task.dueDate && (
                          <button onClick={e => { e.stopPropagation(); updateTask(task.id, { dueDate: null }); }}
                            style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 0 }}>
                            <X size={12} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Month navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                      <button onClick={prevMonth} style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4, cursor: 'pointer', borderRadius: 4 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <ChevronLeft size={16} strokeWidth={2} />
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{monthName}</span>
                      <button onClick={nextMonth} style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4, cursor: 'pointer', borderRadius: 4 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <ChevronRight size={16} strokeWidth={2} />
                      </button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px', marginBottom: 4 }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-placeholder)', padding: '4px 0' }}>{d}</div>
                      ))}
                    </div>

                    {/* Day grid */}
                    <div
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px 8px' }}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* Trailing days from previous month */}
                      {Array.from({ length: firstDay }, (_, i) => {
                        const day = prevMonthDays - firstDay + 1 + i;
                        const dateStr = toDateStrFull(prevMYear, prevMMonth, day);
                        return (
                          <div key={`prev-${i}`} style={getDayStyle(dateStr, true)}>
                            {day}
                          </div>
                        );
                      })}
                      {/* Current month days */}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const dateStr = toDateStr(day);
                        const style = getDayStyle(dateStr, false);
                        return (
                          <div
                            key={day}
                            onMouseEnter={() => setHoveredDay(dateStr)}
                            onClick={() => {
                              if (datePickerMode === 'start') {
                                updateTask(task.id, { startDate: dateStr, dueDate: null });
                                setDatePickerMode('due');
                              } else {
                                // Ensure due >= start; if not, swap
                                if (task.startDate && dateStr < task.startDate) {
                                  updateTask(task.id, { startDate: dateStr, dueDate: task.startDate });
                                } else {
                                  updateTask(task.id, { dueDate: dateStr });
                                }
                                setDatePickerMode('start');
                              }
                              setHoveredDay(null);
                            }}
                            style={style}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer with Clear */}
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end',
                      padding: '8px 12px', borderTop: '1px solid var(--border-divider)',
                    }}>
                      <button
                        onClick={() => {
                          updateTask(task.id, { startDate: null, dueDate: null });
                          setDatePickerMode('start');
                          setHoveredDay(null);
                          setShowDatePicker(false);
                        }}
                        style={{
                          fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
                          padding: '4px 8px', borderRadius: 4, background: 'transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Projects section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }} ref={addProjectRef}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Projects</span>
              {project && <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-input)', borderRadius: 8, padding: '0 5px' }}>1</span>}
              <button
                onClick={() => setShowAddProject(!showAddProject)}
                style={{ color: 'var(--text-placeholder)', display: 'flex', cursor: 'pointer', padding: 2, borderRadius: 4, background: 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={13} strokeWidth={2} />
              </button>

              {/* Add project dropdown */}
              {showAddProject && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                  minWidth: 240, background: '#2a2d2f', border: '1px solid var(--border-divider)',
                  borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-divider)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Add to project
                  </div>
                  <div style={{ maxHeight: 240, overflow: 'auto', padding: '4px 0' }}>
                    {availableProjects.length === 0 ? (
                      <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-placeholder)', textAlign: 'center' }}>
                        No projects available
                      </div>
                    ) : availableProjects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddProject(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '8px 12px', textAlign: 'left',
                          background: 'transparent', cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {project && (
            <div>
              {/* Project header row */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px',
                  borderRadius: 4, cursor: 'pointer',
                  background: hoveredProjectRow ? 'var(--bg-sidebar-hover)' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={() => setHoveredProjectRow(true)}
                onMouseLeave={() => setHoveredProjectRow(false)}
              >
                {/* Expand/collapse chevron */}
                <button
                  onClick={() => setProjectExpanded(!projectExpanded)}
                  style={{ display: 'flex', padding: 0, color: 'var(--text-secondary)', transition: 'transform 0.15s', transform: projectExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                >
                  <ChevronDown size={14} strokeWidth={2} />
                </button>

                {/* Color dot */}
                <div style={{ width: 8, height: 8, borderRadius: 2, background: project.color, flexShrink: 0 }} />

                {/* Project name */}
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{project.name}</span>

                {/* Section selector ("To do" dropdown) */}
                <div style={{ position: 'relative' }} ref={projectSectionRef}>
                  <button
                    onClick={e => { e.stopPropagation(); setShowProjectSectionDropdown(!showProjectSectionDropdown); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      fontSize: 12, color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: '2px 6px', borderRadius: 4,
                      background: 'transparent', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {section?.name || 'No section'}
                    <ChevronDown size={10} strokeWidth={2} />
                  </button>

                  {showProjectSectionDropdown && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
                      minWidth: 160, background: '#2a2d2f', border: '1px solid var(--border-divider)',
                      borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-divider)', fontSize: 12, color: 'var(--text-secondary)' }}>
                        Select section
                      </div>
                      <div style={{ padding: '4px 0' }}>
                        {projectSections.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleChangeSection(s.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', padding: '7px 12px', textAlign: 'left',
                              fontSize: 13, color: 'var(--text-primary)',
                              background: s.id === task.sectionId ? 'var(--bg-sidebar-hover)' : 'transparent',
                              cursor: 'pointer', transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                            onMouseLeave={e => { if (s.id !== task.sectionId) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {s.id === task.sectionId && <Check size={12} strokeWidth={2.5} style={{ color: 'var(--text-primary)' }} />}
                            {s.id !== task.sectionId && <span style={{ width: 12 }} />}
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete project X button - visible on hover */}
                <button
                  onClick={e => { e.stopPropagation(); handleRemoveProject(); }}
                  style={{
                    display: 'flex', padding: 2, color: 'var(--text-placeholder)',
                    opacity: hoveredProjectRow ? 1 : 0,
                    transition: 'opacity 0.1s',
                    cursor: 'pointer', borderRadius: 4,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>

              {/* Expanded: Priority & Status grid */}
              {projectExpanded && (
                <div style={{ borderTop: '1px solid var(--border-divider)', marginTop: 2 }}>
                  {/* Priority row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    borderBottom: '1px solid var(--border-divider)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px',
                      borderRight: '1px solid var(--border-divider)',
                      fontSize: 12, color: 'var(--text-secondary)',
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="8 10 12 14 16 10" />
                      </svg>
                      Priority
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', position: 'relative' }} ref={priorityRef}>
                      <button
                        onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          cursor: 'pointer', background: 'transparent', padding: 0,
                        }}
                      >
                        {task.customFieldValues.cf1 ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                            background: priorityOptions.find(o => o.value === task.customFieldValues.cf1)?.color || '#555',
                            color: '#1a1a1a',
                          }}>
                            {task.customFieldValues.cf1}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>—</span>
                        )}
                      </button>

                      {showPriorityDropdown && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                          minWidth: 160, background: '#2a2d2f', border: '1px solid var(--border-divider)',
                          borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                          overflow: 'hidden', padding: '4px 0',
                        }}>
                          {priorityOptions.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleChangePriority(opt.value)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                width: '100%', padding: '7px 12px', textAlign: 'left',
                                background: 'transparent', cursor: 'pointer',
                                transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {task.customFieldValues.cf1 === opt.value && <Check size={12} strokeWidth={2.5} style={{ color: 'var(--text-secondary)' }} />}
                              {task.customFieldValues.cf1 !== opt.value && <span style={{ width: 12 }} />}
                              {opt.value ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center',
                                  padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                                  background: opt.color, color: '#1a1a1a',
                                }}>
                                  {opt.label}
                                </span>
                              ) : (
                                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>—</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    borderBottom: '1px solid var(--border-divider)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px',
                      borderRight: '1px solid var(--border-divider)',
                      fontSize: 12, color: 'var(--text-secondary)',
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="8 10 12 14 16 10" />
                      </svg>
                      Status
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', position: 'relative' }} ref={statusRef}>
                      <button
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          cursor: 'pointer', background: 'transparent', padding: 0,
                        }}
                      >
                        {task.customFieldValues.cf2 ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                            background: statusOptions.find(o => o.value === task.customFieldValues.cf2)?.color || '#555',
                            color: '#1a1a1a',
                          }}>
                            {task.customFieldValues.cf2}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>—</span>
                        )}
                      </button>

                      {showStatusDropdown && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                          minWidth: 160, background: '#2a2d2f', border: '1px solid var(--border-divider)',
                          borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                          overflow: 'hidden', padding: '4px 0',
                        }}>
                          {statusOptions.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleChangeStatus(opt.value)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                width: '100%', padding: '7px 12px', textAlign: 'left',
                                background: 'transparent', cursor: 'pointer',
                                transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {task.customFieldValues.cf2 === opt.value && <Check size={12} strokeWidth={2.5} style={{ color: 'var(--text-secondary)' }} />}
                              {task.customFieldValues.cf2 !== opt.value && <span style={{ width: 12 }} />}
                              {opt.value ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center',
                                  padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                                  background: opt.color, color: '#1a1a1a',
                                }}>
                                  {opt.label}
                                </span>
                              ) : (
                                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>—</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-divider)', margin: '8px 0 16px' }} />

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Description</div>
          <textarea
            placeholder="What is this task about?"
            value={task.description}
            onChange={e => updateTask(task.id, { description: e.target.value })}
            style={{
              width: '100%', minHeight: 60, resize: 'vertical',
              background: 'transparent', border: '1px solid transparent', borderRadius: 'var(--radius-input)',
              padding: 8, fontSize: 13, color: 'var(--text-primary)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
          />
        </div>

        {/* Comments & Activity */}
        {taskComments.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {taskComments.map(comment => {
              const author = users.find(u => u.id === comment.authorId);
              return (
                <div key={comment.id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <Avatar userId={comment.authorId} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{author?.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>
                        {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--text-primary)', marginBottom: 4 }}>{comment.body}</p>
                    <button onClick={() => likeComment(comment.id)} style={{ fontSize: 12, color: comment.likes.includes(currentUserId) ? 'var(--color-primary)' : 'var(--text-placeholder)' }}>
                      👍 {comment.likes.length > 0 && comment.likes.length}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comment input — fixed at bottom */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-divider)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Avatar userId={currentUserId} size={28} />
        <div style={{ flex: 1 }}>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComment(); }}
            placeholder="Add a comment"
            style={{
              width: '100%', minHeight: 36, resize: 'none', fontSize: 13,
              background: 'var(--bg-input)', border: '1px solid var(--border-input)',
              borderRadius: 'var(--radius-input)', padding: 8, color: 'var(--text-primary)',
            }}
          />
          {commentText.trim() && (
            <button onClick={handleSubmitComment} style={{
              marginTop: 4, padding: '4px 12px',
              background: 'var(--color-primary)', color: '#fff',
              borderRadius: 'var(--radius-btn)', fontSize: 12,
            }}>
              Comment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
