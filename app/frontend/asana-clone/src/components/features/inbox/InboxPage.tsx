import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../data/AppContext';
import { Avatar } from '../../common/Avatar';
import { Filter, ArrowUpDown, MoreHorizontal, Plus, Bookmark, Archive, CheckCircle } from 'lucide-react';

type Tab = 'activity' | 'bookmarks' | 'archive' | 'mentioned';
type SortOrder = 'newest' | 'oldest';
type FilterType = 'all' | 'unread' | 'task_assigned' | 'comment_added' | 'mentioned' | 'due_date' | 'project_update' | 'task_completed';

const filterLabels: Record<FilterType, string> = {
  all: 'All',
  unread: 'Unread',
  task_assigned: 'Task assigned',
  comment_added: 'Comments',
  mentioned: 'Mentions',
  due_date: 'Due dates',
  project_update: 'Project updates',
  task_completed: 'Completed',
};

export function InboxPage() {
  const { notifications, markRead, markUnread, archive, bookmark, archiveAll, setSelectedTaskId } = useApp();
  const [tab, setTab] = useState<Tab>('activity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dotMenuId, setDotMenuId] = useState<string | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const dotMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDropdown(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false);
      if (dotMenuRef.current && !dotMenuRef.current.contains(e.target as Node)) setDotMenuId(null);
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = notifications.filter(n => {
    if (tab === 'activity') return !n.archived;
    if (tab === 'bookmarks') return n.bookmarked && !n.archived;
    if (tab === 'archive') return n.archived;
    if (tab === 'mentioned') return n.type === 'mentioned' && !n.archived;
    return true;
  }).filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    return n.type === filterType;
  }).sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return sortOrder === 'newest' ? diff : -diff;
  });

  const groupByDate = (items: typeof filtered) => {
    const groups: { label: string; items: typeof filtered }[] = [];
    const dateMap = new Map<string, typeof filtered>();
    const today = new Date('2026-04-13');

    for (const n of items) {
      const d = new Date(n.createdAt);
      const dayDiff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      let label: string;
      if (d.toDateString() === today.toDateString()) label = 'Today';
      else if (dayDiff === 1) label = 'Yesterday';
      else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

      if (!dateMap.has(label)) dateMap.set(label, []);
      dateMap.get(label)!.push(n);
    }

    for (const [label, items] of dateMap) {
      groups.push({ label, items });
    }
    return groups;
  };

  const groups = groupByDate(filtered);

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, marginTop: 4,
    background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
    padding: '4px 0', zIndex: 100, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  };

  const dropdownItemStyle = (active?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
    fontSize: 13, color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: 'pointer', width: '100%', textAlign: 'left',
    background: active ? 'var(--bg-sidebar-hover)' : 'transparent',
  });

  return (
    <div style={{ background: 'var(--bg-content)', margin: '-16px -24px', padding: '16px 24px', minHeight: 'calc(100vh - var(--topbar-height))' }}>
      {/* Title row */}
      <div style={{ marginBottom: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 400 }}>Inbox</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0 }}>
        {(['activity', 'bookmarks', 'archive', 'mentioned'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 12px 8px', fontSize: 13,
            color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: tab === t ? '2px solid var(--text-primary)' : '2px solid transparent',
            fontWeight: tab === t ? 500 : 400,
            marginBottom: -1,
          }}>
            {t === 'mentioned' ? '@Mentioned' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button style={{
          padding: '6px 8px 8px', color: 'var(--text-placeholder)', display: 'flex', alignItems: 'center',
          marginBottom: -1,
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}
        >
          <Plus size={14} strokeWidth={2} />
        </button>
      </div>
      {/* Full-width separator connecting to sidebar */}
      <div style={{ height: 1, background: 'var(--border-default)', margin: '9px -24px 8px' }} />

      {/* Filter & Sort bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12 }}>
        {/* Filter dropdown */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowFilterDropdown(v => !v); setShowSortDropdown(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              fontSize: 12, color: filterType !== 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-btn)',
              background: filterType !== 'all' ? 'var(--bg-sidebar-hover)' : 'transparent',
            }}
            onMouseEnter={e => { if (filterType === 'all') e.currentTarget.style.background = 'var(--bg-sidebar-hover)'; }}
            onMouseLeave={e => { if (filterType === 'all') e.currentTarget.style.background = 'transparent'; }}
          >
            <Filter size={12} strokeWidth={1.8} />
            {filterType === 'all' ? 'Filter' : filterLabels[filterType]}
          </button>
          {showFilterDropdown && (
            <div style={dropdownStyle}>
              {(Object.keys(filterLabels) as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => { setFilterType(f); setShowFilterDropdown(false); }}
                  style={dropdownItemStyle(filterType === f)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => { if (filterType !== f) e.currentTarget.style.background = 'transparent'; }}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort dropdown */}
        <div ref={sortRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowSortDropdown(v => !v); setShowFilterDropdown(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowUpDown size={12} strokeWidth={1.8} />
            Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
          {showSortDropdown && (
            <div style={dropdownStyle}>
              <button
                onClick={() => { setSortOrder('newest'); setShowSortDropdown(false); }}
                style={dropdownItemStyle(sortOrder === 'newest')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                onMouseLeave={e => { if (sortOrder !== 'newest') e.currentTarget.style.background = 'transparent'; }}
              >
                Newest
              </button>
              <button
                onClick={() => { setSortOrder('oldest'); setShowSortDropdown(false); }}
                style={dropdownItemStyle(sortOrder === 'oldest')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                onMouseLeave={e => { if (sortOrder !== 'oldest') e.currentTarget.style.background = 'transparent'; }}
              >
                Oldest
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div ref={moreMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMoreMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', padding: '4px 6px',
              color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <MoreHorizontal size={16} strokeWidth={1.8} />
          </button>
          {showMoreMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4,
              background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
              padding: '8px 0', zIndex: 100, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <button
                onClick={() => { archiveAll(); setShowMoreMenu(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                  width: '100%', textAlign: 'left', fontSize: 14, color: 'var(--text-primary)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Archive size={14} strokeWidth={1.8} />
                Archive all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification list */}
      {groups.map(group => (
        <div key={group.label}>
          <div style={{ padding: '16px 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{group.label}</div>
          {group.items.map(n => (
            <div
              key={n.id}
              onClick={() => { markRead(n.id); if (n.taskId) setSelectedTaskId(n.taskId); }}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => { if (dotMenuId !== n.id) setHoveredId(null); }}
              style={{
                display: 'flex', gap: 10, padding: '8px 8px', borderRadius: 'var(--radius-btn)',
                cursor: 'pointer', alignItems: 'flex-start', position: 'relative',
                background: hoveredId === n.id ? 'var(--bg-row-hover)' : 'transparent',
              }}
            >
              {/* Checkbox circle */}
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: '1.5px solid var(--text-placeholder)',
                flexShrink: 0, marginTop: 2,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{n.preview}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Avatar userId={n.actorId} size={20} />
                  <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>
                    {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Hover action buttons */}
              {hoveredId === n.id && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
                    padding: '2px 4px', flexShrink: 0, marginTop: 0,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Three dots menu */}
                  <div ref={dotMenuId === n.id ? dotMenuRef : undefined} style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDotMenuId(dotMenuId === n.id ? null : n.id); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 6, color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <MoreHorizontal size={16} strokeWidth={1.8} />
                    </button>
                    {dotMenuId === n.id && (
                      <div style={{
                        ...dropdownStyle,
                        right: 0, left: 'auto', minWidth: 200,
                      }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); markUnread(n.id); setDotMenuId(null); }}
                          style={dropdownItemStyle()}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <CheckCircle size={14} strokeWidth={1.8} />
                          Mark as unread
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); bookmark(n.id); setDotMenuId(null); }}
                          style={dropdownItemStyle()}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Bookmark size={14} strokeWidth={1.8} />
                          {n.bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); archive(n.id); setDotMenuId(null); }}
                          style={dropdownItemStyle()}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Archive size={14} strokeWidth={1.8} />
                          Archive notification
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bookmark button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); bookmark(n.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: 6,
                      color: n.bookmarked ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Bookmark size={16} strokeWidth={1.8} fill={n.bookmarked ? 'currentColor' : 'none'} />
                  </button>

                  {/* Archive button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); archive(n.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: 6, color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Archive size={16} strokeWidth={1.8} />
                  </button>
                </div>
              )}

              {/* Unread dot */}
              {!n.read && hoveredId !== n.id && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#4573d2', flexShrink: 0, marginTop: 6,
                }} />
              )}
            </div>
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-placeholder)', padding: 32 }}>No notifications</p>
      )}

      {/* Archive all */}
      {tab === 'activity' && filtered.length > 0 && (
        <button
          onClick={archiveAll}
          style={{ color: 'var(--text-link)', fontSize: 13, padding: '16px 0', display: 'block' }}
        >
          Archive all notifications
        </button>
      )}
    </div>
  );
}
